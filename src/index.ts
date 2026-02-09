import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { Hono } from "hono";
import { timingSafeEqual, signBody } from "./utils/webhook";

type Bindings = {
  dl_halo_run: R2Bucket;
  GITHUB_HALO_PRO_PAT: string;
  GITHUB_WEBHOOK_SECRET: string;
};

type ReleaseItem =
  RestEndpointMethodTypes["repos"]["listReleases"]["response"]["data"][number];

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.redirect("https://download.halo.run", 302);
});

app.post("/github/webhook", async (c) => {
  const githubEvent = c.req.header("x-github-event");

  if (githubEvent !== "release") {
    return c.json({ ok: true, ignored: true });
  }

  const rawBody = await c.req.raw.text();
  if (!rawBody) {
    return c.json({ ok: false, error: "Missing request body" }, 400);
  }

  const signatureHeader = c.req.header("x-hub-signature-256");

  if (!signatureHeader) {
    return c.json({ ok: false, error: "Missing signature" }, 401);
  }

  const expectedSignature = await signBody(
    c.env.GITHUB_WEBHOOK_SECRET,
    rawBody,
  );

  if (!timingSafeEqual(signatureHeader, expectedSignature)) {
    return c.json({ ok: false, error: "Invalid signature" }, 401);
  }

  const payload = JSON.parse(rawBody) as {
    action?: string;
    repository?: { full_name?: string };
    release?: ReleaseItem;
  };

  const action = payload.action;

  if (!action || !["published", "created", "edited"].includes(action)) {
    return c.json({ ok: true, ignored: true, action });
  }

  if (!payload.release?.assets.length) {
    return c.json({ ok: true, ignored: true, action });
  }

  for (const asset of payload.release.assets) {
    const downloadUrl = asset.browser_download_url;
    const filename = downloadUrl.substring(downloadUrl.lastIndexOf("/") + 1);

    if (!filename.endsWith(".jar") && !filename.endsWith(".jar.sha256")) {
      continue;
    }

    if (filename.startsWith("pro-api")) {
      continue;
    }

    let downloadFilename = "";

    if (
      filename.includes("beta") ||
      filename.includes("alpha") ||
      filename.includes("rc")
    ) {
      downloadFilename = "prerelease/" + filename;
    } else {
      downloadFilename = "release/" + filename;
    }

    const checkFile = await c.env.dl_halo_run.head(downloadFilename);

    if (!checkFile) {
      if (payload.repository?.full_name === "lxware-dev/halo-pro") {
        const response = await fetch(asset.url, {
          headers: {
            Accept: "application/octet-stream",
            Authorization: `Bearer ${c.env.GITHUB_HALO_PRO_PAT}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64; rv:106.0) Gecko/20100101 Firefox/106.0",
          },
        });
        await c.env.dl_halo_run.put(downloadFilename, response.body);
      } else {
        const response = await fetch(downloadUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64; rv:106.0) Gecko/20100101 Firefox/106.0",
          },
        });
        await c.env.dl_halo_run.put(downloadFilename, response.body);
      }
    } else {
      console.log("File already exist in R2: " + downloadFilename);
    }
  }

  return c.json({ ok: true, action });
});

app.get("/api", async (c) => {
  const options: R2ListOptions = {
    limit: 500,
    include: ["customMetadata"],
  };

  const listed = await c.env.dl_halo_run.list(options);

  const objects = listed.objects;

  return c.json(
    objects.map((object) => {
      return {
        storageClass: object.storageClass,
        uploaded: object.uploaded,
        checksums: object.checksums,
        size: object.size,
        key: object.key,
      };
    }),
  );
});

app.get("/:name{.+\\.jar}", async (c) => {
  const name = c.req.param("name");
  const file = await c.env.dl_halo_run.get(name);
  if (!file) {
    return c.notFound();
  }
  return c.body(file.body, 200, {
    etag: file.httpEtag,
  });
});

app.get("/:name{.+\\.jar.sha256}", async (c) => {
  const name = c.req.param("name");
  console.log("Getting file: ", name);
  const file = await c.env.dl_halo_run.get(name);
  if (!file) {
    return c.notFound();
  }
  return c.text(await file.text());
});

export default {
  fetch: app.fetch,
  scheduled: async (_controller, env, _ctx) => {
    const repos = [
      {
        owner: "lxware-dev",
        repo: "halo-pro",
        pat: env.GITHUB_HALO_PRO_PAT,
      },
      {
        owner: "halo-dev",
        repo: "halo",
      },
    ];

    for (const repo of repos) {
      const client = new Octokit({
        auth: repo.pat,
      });

      const releases = await client.repos.listReleases({
        owner: repo.owner,
        repo: repo.repo,
        per_page: 10,
      });

      const assets = releases.data.map((release) => release.assets).flat();

      for (const asset of assets) {
        const downloadUrl = asset.browser_download_url;
        const filename = downloadUrl.substring(
          downloadUrl.lastIndexOf("/") + 1,
        );

        if (!filename.endsWith(".jar") && !filename.endsWith(".jar.sha256")) {
          continue;
        }

        if (filename.startsWith("pro-api")) {
          continue;
        }

        let downloadFilename = "";

        if (
          filename.includes("beta") ||
          filename.includes("alpha") ||
          filename.includes("rc")
        ) {
          downloadFilename = "prerelease/" + filename;
        } else {
          downloadFilename = "release/" + filename;
        }

        const checkFile = await env.dl_halo_run.head(downloadFilename);

        console.log("Check file: ", checkFile);

        if (!checkFile) {
          console.log("Downloading file: " + filename);

          if (repo.pat) {
            const response = await fetch(asset.url, {
              headers: {
                Accept: "application/octet-stream",
                Authorization: `Bearer ${repo.pat}`,
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent":
                  "Mozilla/5.0 (X11; Linux x86_64; rv:106.0) Gecko/20100101 Firefox/106.0",
              },
            });
            await env.dl_halo_run.put(downloadFilename, response.body);
          } else {
            const response = await fetch(downloadUrl, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (X11; Linux x86_64; rv:106.0) Gecko/20100101 Firefox/106.0",
              },
            });
            await env.dl_halo_run.put(downloadFilename, response.body);
          }
        } else {
          console.log("File already exist in R2: " + downloadFilename);
        }
      }
    }
  },
} as ExportedHandler<Bindings>;
