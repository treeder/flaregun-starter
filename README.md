# Flaregun Starter Kit

This is a starter kit for running a full-stack app quickly on Cloudflare without a complex framework.

Super lightweight, super fast, easy to understand, no magic (well, just a little). Uses [flaregun](https://github.com/treeder/flaregun) for an awesome Cloudflare experience.

## Getting started

Click `Use this template` button in the top right:

<img width="182" height="124" alt="image" src="https://github.com/user-attachments/assets/cc9dfd42-8add-4e7a-9ba9-38b0107d268b" />

Then clone and run your new repo:

```sh
npm start
```

Now view the demo page at http://localhost:8787. Make some changes and see it change in real-time!

## Database

### Schema / migrations

Define models [models](https://github.com/treeder/models) in the [data](./functions/data) folder, then add the class to [migrations.js](./functions/data/migrations.js) to automatically keep your database schema up to date.

### Using the database

See the [D1 docs](https://github.com/treeder/flaregun/blob/main/README.md#d1-sqlite-database) in the flaregun repository.

## Layout

Edit [layout.js](./functions/layout.js) to update the layout of your app.

## Routes

This uses file based routing from [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/routing/), but runs on Workers because Pages Functions are deprecated. We only use the routing from functions, otherwise, this is all Workers related.

To add a new route, just add a new file to the functions directory and that will be your route.

For UI endpoints:

```js
import { html } from 'rend'

export async function onRequestGet(c) {
  return await c.data.rend.html({
    main: render,
  })
}

function render(d) {
  return html` <div>Hello world!</div> `
}
```

For API endpoints:

```js
export async function onRequestGet(c) {
  return Response.json({
    hello: 'world',
  })
}
```

## Scheduler

NOTE: There are some gotchas here since we're doing some tricks to get this to work:

- To import something like a class or function, it must also be imported seomwhere else in a normal route.
-

## Deploying to Production

This is two steps.

1. Run setup script to create all the resources on Cloudflare.
2. Setup auto deploys

### Setup

This will create all your cloudflare resources such as your database and file storage.

First get an [API token for Cloudflare](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) and get your account ID.

Choose "Edit Cloudflare Workers" template.

![alt text](docs/images/image.png)

Keep all the same settings, but also add `Write` access to D1.

Create a `.env` file with:

```sh
CLOUDFLARE_API_TOKEN=X
CLOUDFLARE_ACCOUNT_ID=Y
```

Then run:

```sh
npm run setup
```

### Auto deploy

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

Set Non-production branch deploy command to:

```sh
npm run deploy:preview
```

### Deploying to production

Create a new Worker app in the Cloudflare console, completely separate from your dev/staging one you already created.

Then your auto deploy configuration should change to:

- `npm run build` - same as above
- `npm run deploy:prod`
- Preview URLs: You may not want to do these on production, so either leave it blank or if you want them, use: `deploy:prod:preview`.
