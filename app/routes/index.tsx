import { createRoute } from "honox/factory";
import { formatSize, groupReleases, listObjects } from "../lib/releases";

export default createRoute(async (c) => {
  const objects = await listObjects(c.env.dl_halo_run);
  const groups = groupReleases(objects);

  return c.render(
    <div class="mx-auto max-w-7xl px-4 md:px-8 py-10">
      <main>
        <h1 class="text-2xl font-semibold">Halo 资源下载</h1>

        <div class="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {groups.map((group) => (
            <div key={group.title}>
              <h5 class="text-lg font-medium">{group.title}</h5>

              <ul class="mt-5 space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item.key}
                    class="hover:ring-1 hover:ring-[#3b82f680] group transition-all rounded cursor-pointer -mx-2 px-2 py-2 hover:bg-indigo-50"
                  >
                    <div class="flex justify-between items-center gap-1" title={item.key}>
                      <span class="text-sm line-clamp-1 flex-1 shrink text-zinc-900">
                        {item.key.split("/").pop()}
                      </span>
                      <div class="hidden group-hover:inline-flex pointer-coarse:inline-flex text-sm gap-1.5">
                        <a href={`/${item.key}`} class="text-indigo-600 hover:text-indigo-500">
                          下载
                        </a>
                        <button
                          type="button"
                          data-copy={item.key}
                          class="text-indigo-600 hover:text-indigo-500"
                        >
                          复制链接
                        </button>
                        <button
                          type="button"
                          data-copy-sha={item.key}
                          class="text-indigo-600 hover:text-indigo-500"
                        >
                          复制 SHA256
                        </button>
                      </div>
                      <span class="flex-none text-xs text-zinc-500 inline-block group-hover:hidden pointer-coarse:hidden">
                        {formatSize(item.size)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <footer class="mt-10 text-zinc-700 text-sm flex flex-col space-y-1.5 text-center">
          <p>
            Crafted with{" "}
            <svg
              class="inline w-4 h-4 align-middle text-red-600"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037.033l.034-.03a6 6 0 0 1 4.733-1.44l.246.036a6 6 0 0 1 3.364 10.008l-.18.185l-.048.041l-7.45 7.379a1 1 0 0 1-1.313.082l-.094-.082l-7.493-7.422A6 6 0 0 1 6.979 3.074" />
            </svg>{" "}
            by{" "}
            <a
              class="font-medium text-zinc-900 hover:text-zinc-600 hover:underline underline-offset-4"
              href="https://nova.moe"
              target="_blank"
              rel="noreferrer"
            >
              Nova Kwok
            </a>{" "}
            &{" "}
            <a
              class="font-medium text-zinc-900 hover:text-zinc-600 hover:underline underline-offset-4"
              href="https://tuki.moe"
              target="_blank"
              rel="noreferrer"
            >
              Tuki Deng
            </a>{" "}
            in Shanghai.
          </p>
          <p>
            This service is serverless, hosted on{" "}
            <a
              href="https://www.cloudflare.com/"
              target="_blank"
              rel="noreferrer"
              class="font-medium text-zinc-900 hover:text-zinc-600 hover:underline underline-offset-4"
            >
              Cloudflare
            </a>
            , built with Workers, HonoX and R2.
          </p>
          <div class="space-x-2">
            <a
              href="https://github.com/halo-sigs/halo-dl-api"
              class="repo-link"
              target="_blank"
              rel="noreferrer"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span> halo-sigs/halo-dl-api </span>
            </a>
          </div>
        </footer>
      </main>
    </div>,
  );
});
