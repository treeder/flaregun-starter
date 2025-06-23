This is a starter kit for running a full-stack app quickly on Cloudflare without using a framework. 

First clone this repo and get this directory. 

Then run it to start:

```
make run
```

Now you can modify things to make it your own. 

## Database

### Schema

Edit [models.js](./functions/models.js) to update your database schema. It uses mostly the same syntax as Lit properties.

### Using the database

See the D1 docs in the main README.

## Layout

Edit [layout.js](./functions/layout.js) to update the layout of your app.

## Routes

This uses file based routing based on [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/routing/). But since Pages Functions are deprecated, we only use the same routing as functions, otherwise, this is all Workers focused. 

## Deploying to Production

This is two steps. 

1. Run setup script to create resources.
2. Setup auto deployment

### Setup

This will create all your cloudflare resources such as your database and file storage. 

First get an [API token for Cloudflare](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) and get your account ID.

Choose "Edit Cloudflare Workers" template.

![alt text](image.png)

Keep all the same settings, but add `Read` access to D1.

Create a `.env` file with:

```sh
CLOUDFLARE_API_TOKEN=X
CLOUDFLARE_ACCOUNT_ID=Y
```

Then run `make setup`.
