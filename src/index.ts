import { Octokit } from "@octokit/rest";
import { Hono } from "hono";

type Bindings = {
  dl_halo_run: R2Bucket;
  GITHUB_HALO_PRO_PAT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.redirect("https://download.halo.run", 302);
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
    })
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

export default {
  fetch: app.fetch,
  scheduled: async (_controller, env, _ctx) => {
    const repos = [
      {
        owner: "halo-dev",
        repo: "halo",
      },
      {
        owner: "lxware-dev",
        repo: "halo-pro",
        pat: env.GITHUB_HALO_PRO_PAT,
      },
    ];

    for (const repo of repos) {
      const client = new Octokit({
        auth: repo.pat,
      });

      const releases = await client.paginate(client.repos.listReleases, {
        owner: repo.owner,
        repo: repo.repo,
        per_page: 100,
      });

      const downloadUrls = releases
        .map((release) =>
          release.assets.map((asset) => asset.browser_download_url)
        )
        .flat()
        .filter((url) => url.endsWith(".jar"));

      for (const downloadUrl of downloadUrls) {
        const filename = downloadUrl.substring(
          downloadUrl.lastIndexOf("/") + 1
        );

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

        // Check if exist in R2
        console.log("Checking if exist in R2");

        const checkFile = await env.dl_halo_run.get(downloadFilename);

        console.log("Check file: ", checkFile);

        if (!checkFile) {
          console.log("Downloading file: " + filename);

          const response = await fetch(downloadUrl);
          await env.dl_halo_run.put(downloadFilename, response.body);
        } else {
          console.log("File already exist in R2: " + downloadFilename);
        }
      }
    }
  },
} as ExportedHandler<Bindings>;
