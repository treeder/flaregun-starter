# Flaregun Library Usage Rules

Guidelines and instructions for using the `flaregun` library on Cloudflare.

## Cloudflare Request Context (`c`) & `c.data`

Every HTTP request, scheduled cron event, and queue batch runs through `flaregun`'s worker router ([`src/worker.js`](../src/worker.js)) and request initialization ([`functions/_middleware.js`](../functions/_middleware.js) and [`functions/init.js`](../functions/init.js)).

### Guaranteed Properties on `c`

- `c.request`: Standard Fetch `Request` object (on HTTP requests).
- `c.env`: Cloudflare Worker environment bindings (`c.env.D1`, `c.env.KV`, `c.env.R2`, `c.env.ASSETS`, `c.env.ENV`).
- `c.ctx`: Native Cloudflare Worker `ExecutionContext`.
- `c.params`: Route parameters parsed from file-based routing (e.g. `c.params.id` for `[id]`, `c.params.catchall` array for `[[catchall]]`).
- `c.waitUntil(promise)`: Bound `ctx.waitUntil` function for scheduling background tasks that outlive the response.
- `c.passThroughOnException()`: Bound `ctx.passThroughOnException` function.
- `c.next(nextReq?, nextEnv?)`: Advances to the next middleware or route handler in the chain.
- `c.data`: Shared per-request context object, always initialized and populated before any route handler executes.
- *(In [`functions/scheduled.js`](../functions/scheduled.js), `c.controller` is provided; in [`functions/queue.js`](../functions/queue.js), `c.batch` is provided).*

### Pre-Initialized Properties on `c.data`

`initRequest(c)` and `once(init, c)` run on every request in [`functions/_middleware.js`](../functions/_middleware.js) (and [`functions/scheduled.js`](../functions/scheduled.js)), guaranteeing the following properties on `c.data`:

- `c.data.d1`: Pre-initialized `D1` database wrapper (`new D1(c.env.D1)`).
- `c.data.kv`: Pre-initialized `KV` storage wrapper (`new KV(c.env.KV)`).
- `c.data.r2`: Cloudflare R2 bucket binding (`c.env.R2`).
- `c.data.logger`: Request-scoped logger (`ConsoleLogger` in dev, `CloudflareLogger` in prod) pre-populated with `{ requestId, method, path }`.
- `c.data.errorHandler`: Pre-initialized `ErrorHandler` instance (`new ErrorHandler({ logger })`).
- `c.data.env`: Resolved environment name (`'dev'`, `'preview'`, or `'prod'`).
- `c.data.scheduler`: Pre-initialized `Scheduler` instance (`new Scheduler()`).
- `c.data.mailer`: Pre-initialized mailer instance (`new ConsoleMailer()`).
- `c.data.rend`: Pre-initialized `Rend` HTML renderer configured with the app layout and reactive `{ user, path }` data (for HTTP requests).
- `c.data.user`: The authenticated `User` object when the request has a valid session, or `undefined` when unauthenticated (this is the **only** conditional property on `c.data`).

### Critical Rule — No Defensive Existence Checks

- **NEVER check whether `c`, `c.data`, `c.env`, `c.request`, `c.waitUntil`, `c.data.d1`, `c.data.kv`, `c.data.r2`, `c.data.logger`, `c.data.rend`, `c.data.scheduler`, or `c.data.mailer` exist or are functions.**
- **NEVER write defensive boilerplate** such as:
  - `if (typeof c.waitUntil === 'function') c.waitUntil(...)` or `c.waitUntil?.(...)`
  - `if (c?.data?.d1)` or `const d1 = c.data?.d1 || new D1(c.env.D1)`
  - `c.data?.logger?.error?.(...)` or `if (c && c.data && c.data.kv)`
- **ALWAYS access and invoke them directly**:
  ```js
  c.waitUntil(doBackgroundWork())
  const product = await c.data.d1.get(Product, c.params.id)
  await c.data.kv.putJSON('cacheKey', product)
  c.data.logger.log('Loaded product', { id: product.id })
  ```

---

## D1 Database Wrapper (`flaregun/d1.js`)

The `D1` class wraps the native Cloudflare D1 Database binding to add advanced object mapping, query builders, and automated field formatting.

### Usage

- Always use `c.data.d1` in route handlers, middleware, and scheduled jobs (only instantiate with `new D1(env.D1)` in standalone scripts or isolated unit tests).
- You can enable debugging by setting `c.data.d1.debug = true`.

### Table Names and Models

- Database operations accept either a string table name or a model class (using the `models` npm library):
  ```js
  import { User } from './models/User.js'
  // Resolves the table name from User.table and parses fields automatically
  const user = await c.data.d1.get(User, userId)
  ```
- Always prefer using model classes when retrieving or querying data. This ensures date strings, booleans, and JSON properties are parsed into native JavaScript types based on the model's static properties.
- Prefer `camelCase` for table names and values stored in the database (e.g., `product.type = 'teddyBears'` instead of `'teddy_bears'` or `'teddy-bears'`).

### Database Operations

- **Get**: `await c.data.d1.get(table, id, q = {})` retrieves a single record by ID.
- **Delete**: `await c.data.d1.delete(table, id)` deletes a record by ID.
- **Insert**: `await c.data.d1.insert(table, obj)` inserts a new record.
  - Automatically generates an alphanumeric ID using `nanoid()` if `id` is omitted.
  - Automatically inserts `createdAt` and `updatedAt` timestamps.
- **Update**: `await c.data.d1.update(table, id, obj)` updates a record by ID.
  - Automatically updates the `updatedAt` field to the current timestamp.
  - **JSON Merge Patch**: Object properties inside the update payload are automatically patched on the database using SQL `json_patch(COALESCE(field, '{}'), ?)` (conforming to RFC 7396) if the column contains JSON data.
- **Count**: `await c.data.d1.count(table, q = {})` returns the count of matching rows.
- **First**: `await c.data.d1.first(table, q = {})` retrieves the first matching record.

### Advanced Querying (`c.data.d1.query(table, q)`)

The query method accepts a query options object `q` with the following parameters:

- `where`: Filters the query.
  - **Equality Object**: `{ email: 'user@example.com', status: 'active' }` (creates `WHERE email = ? AND status = ?`).
  - **Operator Array**: `[['createdAt', '>', date], ['orgId', '=', orgId]]`.
  - **OR Conditions**: `[[['status', '=', 'pending'], 'or', ['status', '=', 'failed']]]`.
  - **JSON Path Querying**: Query nested JSON properties using dot notation: `[['data.role', '=', 'admin']]` (compiles to SQL `json_extract(data, '$.role')`).
- `order`: Specifies ordering. Accepts a single order `['createdAt', 'desc']`, multiple orders `[['lastName', 'asc'], ['firstName', 'asc']]`, an object `{ lastName: 'asc', firstName: 'asc' }`, or a string `'createdAt desc'`. Supports JSON paths and table prefixes.
- `limit`: Maximum number of records to return, e.g., `100`.
- `offset`: Query offset.
- `columns`: Array of specific columns to retrieve.
- `join`: Join query configuration. Supports joining objects or raw strings.

---

## KV Wrapper (`flaregun/kv.js`)

A wrapper around the Cloudflare KV binding that simplifies reading and writing JSON objects.

- **Usage**: Always use `c.data.kv` in route handlers, middleware, and scheduled jobs (only instantiate with `new KV(env.KV)` in standalone scripts or isolated unit tests).
- **JSON Storage**:
  - Store objects: `await c.data.kv.putJSON(key, { foo: 'bar' })`.
  - Retrieve objects: `const data = await c.data.kv.getJSON(key)`. (Automatically returns `null` or parsed JSON).
- **Standard Operations**: Use `get`, `put`, `delete`, and `list` for standard string values, or `scope(prefix)` for namespaced KV storage.

---

## Logger (`flaregun/logger.js`)

`CloudflareLogger` formats logging messages and includes request metadata.

- **Contextual Logger**: Use `c.data.logger.with(key, value)` to clone the logger and add metadata fields:
  ```js
  const logger = c.data.logger.with('userId', user.id)
  logger.log('User signed in')
  ```
- **Logging Behavior**:
  - Calling `logger.log(...)` behaves like `console.log`.
  - If the last argument is an object, it is serialized under a `data` field in the log.
  - If the last argument is an `Error` object, it is logged with `level: 'error'` and includes the full error message, stack trace, status, and cause.

---

## Error Handler (`flaregun/errors.js`)

Formats errors for Cloudflare Logs, responds with clean JSON errors, and handles webhook alerting.

- **Integration**: Pre-initialized at `c.data.errorHandler` and invoked in the root middleware try-catch block:
  ```js
  try {
    return await c.next()
  } catch (err) {
    return await c.data.errorHandler.handle(c, err)
  }
  ```
- **Alert Webhooks**: Configured via `options.postTo`.
- **Deduplication**: Automatically suppresses duplicate error reports for 2 days by checking and recording occurrences in `c.env.KV` (if bound).

---

## Scheduler (`flaregun/scheduler.js`)

Triggers scheduled functions at custom intervals using a single Cloudflare minute cron trigger.

- **Setup**: Add event listeners for `'minute'`, `'5minutes'`, `'15minutes'`, `'hour'`, or `'day'`:
  ```js
  const scheduler = new Scheduler()
  scheduler.addEventListener('hour', myHourlyJob)
  // Daily tasks default to hour 0 (midnight UTC), or specify target hour (0-23):
  scheduler.addEventListener('day', myDailyJob, { hour: 2 }) // runs at 2:00 AM
  ```
- **Execution**: Trigger the scheduler inside the worker `scheduled` handler:
  ```js
  export async function scheduled(c) {
    await c.data.scheduler.run(c, c.controller)
  }
  ```

---

## Material 3 Web Components (`material-esm`)

The starter app uses standard Material 3 ESM web components via [material-esm/material](https://github.com/material-esm/material) mapped to `material/` in the import map.

### Critical Rule for AI

- **Always use Material components from [https://github.com/material-esm/material/](https://github.com/material-esm/material/) if they are available before making our own.** Only build custom UI controls or components if a suitable component does not exist in `material-esm/material`.
- **NEVER hand-roll custom UI controls** using standard HTML tags (`<button>`, `<select>`, `<input type="checkbox">`, `<input type="radio">`, custom modal `<div>`s, custom alerts, or custom switch toggle divs) when building or modifying user interfaces.
- **ALWAYS use Material 3 components** via `import 'material/...'`.
- **References**:
  - GitHub repository: [https://github.com/material-esm/material/](https://github.com/material-esm/material/)
  - Demo reference: [https://material-esm.github.io/material/demo/](https://material-esm.github.io/material/demo/) and `/demo` in the local app.

### Components Reference & Imports

| Component              | HTML Tag                                | Import Path                                                             | Common Attributes / Slots                                                                               |
| :--------------------- | :-------------------------------------- | :---------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| **Buttons**            | `<md-button>`                           | `material/buttons/button.js`                                            | `color="filled                                                                                          | outlined                                        | tonal      | elevated                                                 | text"`, `size="extra-small | small                                         | medium | large"`, `shape="square"`, `<md-icon slot="icon">` |
| **Button Groups**      | `<md-button-group>`                     | `material/buttons/button-group.js`                                      | `connected`, `checkmark`                                                                                |
| **Split Buttons**      | `<md-split-button>`                     | `material/buttons/split-button.js`                                      | `color="filled                                                                                          | outlined"`, slot `menu`with`<md-menu-item>`     |
| **FAB**                | `<md-fab>`                              | `material/buttons/fab.js`                                               | `variant="primary                                                                                       | secondary"`, `extended`, `lowered`, slot `icon` |
| **Icon Buttons**       | `<md-icon-button>`                      | `material/buttons/icon-button.js`                                       | `color="tonal                                                                                           | filled"`, contains `<md-icon>`                  |
| **Icons**              | `<md-icon>`                             | `material/icon/icon.js`                                                 | Text content is Material Symbol ligature, e.g. `<md-icon>check</md-icon>`                               |
| **Text Fields**        | `<md-text-field>`                       | `material/text/text-field.js`                                           | `label`, `value`, `color="outlined                                                                      | filled"`, `type="text                           | email      | password                                                 | number                     | textarea"`, `error`, `error-text`, `required` |
| **Dropdown Select**    | `<md-select>`                           | `material/select/select.js`<br>`material/select/select-option.js`       | Contains `<md-select-option value="...">` with `<div slot="headline">`                                  |
| **Switches**           | `<md-switch>`                           | `material/switch/switch.js`                                             | `selected`, `icons`, `value`                                                                            |
| **Checkboxes**         | `<md-checkbox>`                         | `material/checkbox/checkbox.js`                                         | `checked`, `indeterminate`                                                                              |
| **Radio Buttons**      | `<md-radio>`                            | `material/radio/radio.js`                                               | `name`, `value`, `checked`                                                                              |
| **Sliders**            | `<md-slider>`                           | `material/slider/slider.js`                                             | `labeled`, `ticks`, `min`, `max`, `step`, `value`, `range`, `value-start`, `value-end`                  |
| **Tabs**               | `<md-tabs>`<br>`<md-tab>`               | `material/tabs/tabs.js`<br>`material/tabs/tab.js`                       | `@change`, `<md-tab type="primary                                                                       | secondary">`with`<md-icon slot="icon">`         |
| **Cards**              | `<md-card>`                             | `material/card/card.js`                                                 | `type="outlined                                                                                         | filled                                          | elevated"` |
| **Chips**              | `<md-chip-set>`<br>`<md-chip>`          | `material/chips/chip-set.js`<br>`material/chips/chip.js`                | `type="assist                                                                                           | filter                                          | input      | suggestion"`, `label`, `selected`, `avatar`, slot `icon` |
| **Badges**             | `<md-badge>`                            | `material/badge/badge.js`                                               | `value="3"`, or empty for status dot                                                                    |
| **Tooltips**           | `<md-tooltip>`                          | `material/tooltip/tooltip.js`                                           | `text="..."` (plain), or `type="rich"` with slots `headline`, `text`, `actions`                         |
| **Dialogs**            | `<md-dialog>`                           | `material/dialog/dialog.js`                                             | Slots: `headline`, `content` (form with `method="dialog"`), `actions`. Call `.show()` and `.close()`    |
| **Snackbars**          | `snack()`<br>`<md-snackbar>`            | `material/snackbar/snackbar.js`                                         | `snack('Message', { action: { label: 'Undo', onClick }, showCloseIcon: true })`                         |
| **Loading & Progress** | `<md-loading>`<br>`<md-progress>`       | `material/indicators/loading.js`<br>`material/indicators/progress.js`   | `<md-loading contained size="...">`, `<md-progress type="circular                                       | linear" indeterminate shape="wavy">`            |
| **Lists**              | `<md-list>`<br>`<md-list-item>`         | `material/list/list.js`<br>`material/list/list-item.js`                 | `headline`, `supporting-text`, slot `start`, slot `end`                                                 |
| **Search**             | `<md-search>`                           | `material/search/search.js`                                             | `@input`, `placeholder`                                                                                 |
| **Carousels**          | `<md-carousel>`<br>`<md-carousel-item>` | `material/carousel/carousel.js`<br>`material/carousel/carousel-item.js` | `layout="multi-browse"`, `indicators`, `loop`, contains `<md-carousel-item interactive headline="...">` |
| **Dividers**           | `<md-divider>`                          | `material/divider/divider.js`                                           | Clean Material surface divider line                                                                     |
