# Halo Download Mirror Service(Serverless Edition)

The workers script with deployment for the serverless [Halo Download Mirror](https://download.halo.run), created and maintained by [Nova Kwok](https://github.com/n0vad3v).

Related Chinese post: [Halo 官方镜像源在 Serverless(Cloudflare Workers + R2) 上的实践](https://nova.moe/halo-mirror-serverless/).

## Usage

### Preparation

Currently this script is hosted on Halo's Cloudflare Account, if you'd like to host on your own, you need the following requirements.

* A Cloudflare account with API token
* Cloudflare R2 and Workers enabled
* `wrangler` installed (`npm i @cloudflare/wrangler -g`)

Clone this repo and do the following steps:

```
cp .env.example .env
cp wrangler.toml.example wrangler.toml
```

Now edit the related variables in the files above.

### Deploy

```
wrangler publish
```

Now the worker is available on your Cloudflare account with cron setup, wait for 10 minutes and you should see files being downloaded to your R2 bucket.

Visiting `https://your-workers.workers.dev/api` will get the results as below:

```
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

This is helpful for Frontend projects to list all the files and display on website.

## License

GPL