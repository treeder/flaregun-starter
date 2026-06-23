# Flaregun Library Usage Rules

Guidelines and instructions for using the `flaregun` library on Cloudflare.

## D1 Database Wrapper (`flaregun/d1.js`)

The `D1` class wraps the native Cloudflare D1 Database binding to add advanced object mapping, query builders, and automated field formatting.

### Instantiation
- Instantiate with `new D1(env.D1)` or retrieve from context if pre-initialized (e.g. `c.data.d1`).
- You can enable debugging by setting `d1.debug = true`.

### Table Names and Models
- Database operations accept either a string table name or a model class (using the `models` npm library):
  ```js
  import { User } from './models/User.js'
  // Resolves the table name from User.table and parses fields automatically
  const user = await d1.get(User, userId)
  ```
- Always prefer using model classes when retrieving or querying data. This ensures date strings, booleans, and JSON properties are parsed into native JavaScript types based on the model's static properties.

### Database Operations
- **Get**: `await d1.get(table, id, q = {})` retrieves a single record by ID.
- **Delete**: `await d1.delete(table, id)` deletes a record by ID.
- **Insert**: `await d1.insert(table, obj)` inserts a new record.
  - Automatically generates an alphanumeric ID using `nanoid()` if `id` is omitted.
  - Automatically inserts `createdAt` and `updatedAt` timestamps.
- **Update**: `await d1.update(table, id, obj)` updates a record by ID.
  - Automatically updates the `updatedAt` field to the current timestamp.
  - **JSON Merge Patch**: Object properties inside the update payload are automatically patched on the database using SQL `json_patch(COALESCE(field, '{}'), ?)` (conforming to RFC 7396) if the column contains JSON data.
- **Count**: `await d1.count(table, q = {})` returns the count of matching rows.
- **First**: `await d1.first(table, q = {})` retrieves the first matching record.

### Advanced Querying (`d1.query(table, q)`)
The query method accepts a query options object `q` with the following parameters:
- `where`: Filters the query.
  - **Equality Object**: `{ email: 'user@example.com', status: 'active' }` (creates `WHERE email = ? AND status = ?`).
  - **Operator Array**: `[['createdAt', '>', date], ['orgId', '=', orgId]]`.
  - **OR Conditions**: `[[['status', '=', 'pending'], 'or', ['status', '=', 'failed']]]`.
  - **JSON Path Querying**: Query nested JSON properties using dot notation: `[['data.role', '=', 'admin']]` (compiles to SQL `json_extract(data, '$.role')`).
- `order`: Array specifying the field and order, e.g. `['createdAt', 'desc']`.
- `limit`: Maximum number of records to return, e.g., `100`.
- `offset`: Query offset.
- `columns`: Array of specific columns to retrieve.
- `join`: Join query configuration. Supports joining objects or raw strings.

---

## KV Wrapper (`flaregun/kv.js`)

A wrapper around the Cloudflare KV binding that simplifies reading and writing JSON objects.

- **Instantiation**: Instantiate with `new KV(env.KV)` or retrieve from context (e.g. `c.data.kv`).
- **JSON Storage**:
  - Store objects: `await kv.putJSON(key, { foo: 'bar' })`.
  - Retrieve objects: `const data = await kv.getJSON(key)`. (Automatically returns `null` or parsed JSON).
- **Standard Operations**: Use `get`, `put`, `delete`, and `list` for standard string values.

---

## Logger (`flaregun/logger.js`)

`CloudflareLogger` formats logging messages and includes request metadata.

- **Contextual Logger**: Use `logger.with(key, value)` to clone the logger and add metadata fields:
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

- **Integration**: Typically invoked in a global wrapper or middleware try-catch block:
  ```js
  try {
    await c.next()
  } catch (err) {
    return errorHandler.handle(c, err)
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
  ```
- **Execution**: Trigger the scheduler inside the worker `scheduled` handler:
  ```js
  export async function scheduled(c) {
    await c.data.globals.scheduler.run(c, c.controller)
  }
  ```
