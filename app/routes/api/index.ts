import { createRoute } from "honox/factory";
import { listObjects } from "../../lib/releases";

export default createRoute(async (c) => {
  const objects = await listObjects(c.env.dl_halo_run);

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
