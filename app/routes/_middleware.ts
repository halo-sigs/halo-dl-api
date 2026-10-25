import { createRoute } from "honox/factory";

export default createRoute(async (c, next) => {
  const path = c.req.path;

  if (!path.endsWith(".jar") && !path.endsWith(".jar.sha256")) {
    return next();
  }

  if (c.req.method !== "GET" && c.req.method !== "HEAD") {
    return next();
  }

  let name: string;
  try {
    name = decodeURIComponent(path.slice(1));
  } catch {
    return c.notFound();
  }

  const file = await c.env.dl_halo_run.get(name);

  if (!file) {
    return c.notFound();
  }

  if (path.endsWith(".sha256")) {
    console.log("Getting file: ", name);
    return c.text(await file.text());
  }

  return c.body(file.body, 200, {
    etag: file.httpEtag,
  });
});
