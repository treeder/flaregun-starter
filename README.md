# Flaregun Starter Kit

This is a starter kit for running a full-stack app quickly on Cloudflare without using a framework.

First clone this repo then run it to start:

```sh
npm start
```

Now you can modify things to make it your own.

## Database

### Schema

Edit [models.js](./functions/models.js) to update your database schema. It uses mostly the same syntax as Lit properties.

### Using the database

See the [D1 docs](https://github.com/treeder/flaregun/blob/main/README.md#d1-sqlite-database) in the flaregun repository.

## Layout

Edit [layout.js](./functions/layout.js) to update the layout of your app.

## Routes

This uses file based routing from [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/routing/), but runs on Workers because Pages Functions are deprecated. We only use the routing from functions, otherwise, this is all Workers related.

To add a new route, just add a new file to the functions directory and that will be your route.

For UI endpoints:

```js
import { html } from "rend";

export async function onRequestGet(c) {
  return await c.data.rend.html({
    main: render,
  });
}

function render(d) {
  return html` <div>Hello world!</div> `;
}
```

For API endpoints:

```js
export async function onRequestGet(c) {
  return Response.json({
    hello: "world",
  });
}
```

## Deploying to Production

This is two steps.

1. Run setup script to create resources.
2. Manual deploy OR setup auto deploy

### Setup

This will create all your cloudflare resources such as your database and file storage.

First get an [API token for Cloudflare](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) and get your account ID.

Choose "Edit Cloudflare Workers" template.

![alt text](docs/images/image.png)

Keep all the same settings, but add `Write` access to D1.

Create a `.env` file with:

```sh
CLOUDFLARE_API_TOKEN=X
CLOUDFLARE_ACCOUNT_ID=Y
```

Then run:

```sh
npm run setup
```

### Deploy

Setup auto deploy in the Cloudflare Dashboard so every commit to main will deploy and other
branches will get a preview URL.

Set build command to:

```sh
npm run build
```

Set deploy command to:

```sh
npm run deploy
```

Set deploy command to:

```sh
npx wrangler deploy --env dev
```

Set Non-production branch deploy command to:

```sh
npx wrangler versions upload --env dev
```

### Deploying to prod

Create a new Worker app in cloudflare console and change the commands above to use `--env prod`.
