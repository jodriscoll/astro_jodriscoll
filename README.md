# jodriscoll.com

Portfolio ver. 3. Astro 7 site in `site/`, hosted on Cloudflare Workers.

## Run locally

Needs Node 24 (`site/.nvmrc`).

```sh
cd site
npm install
npm run dev        # http://127.0.0.1:4321
```

The contact form needs `RESEND_API_KEY` and `RESEND_FROM` in `site/.env` (see `.env.example`).

## Deploy

All from `site/`:

```sh
npx wrangler login   # once per machine
npm run deploy       # astro build, then wrangler deploy
```

Pushing to GitHub doesn't deploy. `npm run deploy` publishes to jodriscoll.com.

Update the contact form keys on the Worker after changing `.env`:

```sh
npx wrangler secret bulk .env
```

## Where things live

- `site/content/`: projects, resume, blog posts (one JSON spec per project)
- `site/src/`: pages, components and styles
- `site/wrangler.jsonc`: Worker name, domain and runtime flags

Portfolio ver. 2 (Angular 13 on Cloudflare Pages) is commit `d385d99`.
