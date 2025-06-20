This is a starter kit for running a full-stack app quickly on Cloudflare without using a framework. 

First clone this repo and get this directory. 

Then run it to start:

```
make run
```

Now we can modify things to make it your own. 

## Database

### Schema

Edit [models.js](./models.js) to update your database schema. It uses mostly the same syntax as Lit properties.

### Using the database

See the D1 docs in the main README.

## Layout

Edit [layout.js](./layout.js) to update the layout of your app.

## Routes

This uses file based routing based on [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/routing/). But since Pages Functions are deprecated, we only use the same routing as functions, otherwise, this is all Workers focused. 
