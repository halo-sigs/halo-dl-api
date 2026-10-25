import type { RestEndpointMethodTypes } from "@octokit/rest";
import { createRoute } from "honox/factory";
import { signBody, timingSafeEqual } from "../../lib/webhook";

type ReleaseItem =
  RestEndpointMethodTypes["repos"]["listReleases"]["response"]["data"][number];

export const POST = createRoute(async (c) => {
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

  const secret = c.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error("GITHUB_WEBHOOK_SECRET is not configured");
    return c.json({ ok: false, error: "Webhook secret is not configured" }, 500);
  }

  const expectedSignature = await signBody(secret, rawBody);

  if (!timingSafeEqual(signatureHeader, expectedSignature)) {
    return c.json({ ok: false, error: "Invalid signature" }, 401);
  }

  let payload: {
    action?: string;
    repository?: { full_name?: string };
    release?: ReleaseItem;
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const action = payload.action;

  if (!action || !["published", "created", "edited"].includes(action)) {
    return c.json({ ok: true, ignored: true, action });
  }

  if (!payload.release?.assets?.length) {
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
        if (!response.ok || !response.body) {
          console.error(
            `Failed to download ${downloadFilename}: ${response.status}`,
          );
          return c.json(
            { ok: false, error: "Failed to download release asset" },
            502,
          );
        }
        await c.env.dl_halo_run.put(downloadFilename, response.body);
      } else {
        const response = await fetch(downloadUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64; rv:106.0) Gecko/20100101 Firefox/106.0",
          },
        });
        if (!response.ok || !response.body) {
          console.error(
            `Failed to download ${downloadFilename}: ${response.status}`,
          );
          return c.json(
            { ok: false, error: "Failed to download release asset" },
            502,
          );
        }
        await c.env.dl_halo_run.put(downloadFilename, response.body);
      }
    } else {
      console.log("File already exist in R2: " + downloadFilename);
    }
  }

  return c.json({ ok: true, action });
});
