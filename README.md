# Halo Download Mirror Service(Serverless Edition)

The serverless [Halo Download Mirror](https://download.halo.run), running on Cloudflare Workers + R2. The download page and the API are served by the same Worker.

Created and maintained by [Nova Kwok](https://github.com/n0vad3v).

Related Chinese post: [Halo 官方镜像源在 Serverless(Cloudflare Workers + R2) 上的实践](https://nova.moe/halo-mirror-serverless/).

## Routes

- `/` — download page, rendered with HonoX
- `/api` — JSON list of all objects in R2
- `/{key}` — download a file (`.jar`, `.jar.sha256`) from R2
- `/github/webhook` — GitHub release webhook that uploads new assets to R2

## Usage

### Preparation

Currently this project is hosted on Halo's Cloudflare Account. If you'd like to host it on your own, you need:

* A Cloudflare account with API token
* Cloudflare R2 and Workers enabled
* `GITHUB_HALO_PRO_PAT` and `GITHUB_WEBHOOK_SECRET` configured as Worker secrets

### Development

```bash
pnpm install
pnpm dev
```

`pnpm preview` runs the built Worker locally, and `pnpm build` writes the Worker bundle and static assets to `dist/`.

### Deploy

```bash
pnpm deploy
```

`wrangler deploy` runs `pnpm build` automatically through `build.command`.

Visiting `https://your-workers.workers.dev/api` will get the results as below:

```json
[
  {
    "uploaded": "2022-11-13T06:34:09.717Z",
    "checksums": {
      "md5": "10e25e056c2bea90a9386e27a9450bfb"
    },
    "size": 61,
    "key": "config/Caddyfile2.x"
  },
...
  {
    "uploaded": "2022-11-13T07:05:29.984Z",
    "checksums": {
      "md5": "44f8a1a6821dbfe69d3577c451862bac"
    },
    "size": 79495690,
    "key": "release/halo-v1.4.14.jar"
  }
]
```

### Layout

- `app/routes/` — HonoX routes: download page, `/api` and the GitHub webhook
- `app/routes/_middleware.ts` — `.jar` / `.jar.sha256` downloads from R2
- `app/lib/` — R2 listing, release grouping and webhook signature helpers
- `public/` — static files served as Worker assets

## License

GPL
