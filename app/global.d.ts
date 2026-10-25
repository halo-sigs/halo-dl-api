import type {} from "hono";

declare module "hono" {
  interface Env {
    Bindings: {
      dl_halo_run: R2Bucket;
      GITHUB_HALO_PRO_PAT: string;
      GITHUB_WEBHOOK_SECRET: string;
    };
    Variables: {};
  }
}
