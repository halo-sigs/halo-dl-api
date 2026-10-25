import { filesize } from "filesize";
import Head from "next/head";
import toast, { Toaster } from "react-hot-toast";
import { BarLoader } from "react-spinners";
import semver from "semver";
import useSWR from "swr";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

function versionCompare(a, b) {
  const versionA = a.key.match(/halo(?:-pro)?-(.+?)\.jar/)?.[1];
  const versionB = b.key.match(/halo(?:-pro)?-(.+?)\.jar/)?.[1];
  return semver.rcompare(versionA, versionB);
}

function Home() {
  const { data, error } = useSWR("https://dl.halo.run/api", fetcher);

  if (error) return <div>Failed to load</div>;

  if (!data)
    return (
      <div className="flex justify-center py-10">
        <BarLoader color="#36d7b7" />
      </div>
    );

  // Filter beta items, key containes "beta" or "alpha"
  const beta_items = data
    .filter(
      (item) =>
        item.key.startsWith("prerelease/") &&
        !item.key.includes("halo-1") &&
        !item.key.includes("sha256"),
    )
    .sort(versionCompare);

  const release_items = data
    .filter(
      (item) =>
        item.key.startsWith("release/") &&
        !item.key.includes("pro") &&
        !item.key.includes("halo-1") &&
        !item.key.includes("v") &&
        !item.key.includes("sha256"),
    )
    .sort(versionCompare);

  const pro_items = data
    .filter(
      (item) =>
        item.key.startsWith("release/") &&
        item.key.includes("pro") &&
        !item.key.includes("sha256"),
    )
    .sort(versionCompare);

  const combinedItems = [
    { title: "Releases（社区版）", items: release_items },
    { title: "Releases（付费版）", items: pro_items },
    { title: "Releases（预发布版）", items: beta_items },
  ];

  function handleCopy(key) {
    navigator.clipboard.writeText(`https://dl.halo.run/${key}`);

    toast.success("已复制下载链接");
  }

  async function handleCopySHA256(key) {
    const response = await fetch(`https://dl.halo.run/${key}.sha256`);

    if (!response.ok) {
      toast.error("获取 SHA256 值失败");
      return;
    }

    const data = await response.text();
    navigator.clipboard.writeText(data);
    toast.success("已复制 SHA256 值");
  }

  return (
    <div>
      <Head>
        <title>Halo 资源下载</title>
        <meta name="description" content="Halo Download Mirror" />
        <link rel="shortcut icon" href="/favicon.png" />
        <script
          async
          defer
          data-website-id="2b41f81a-37e0-48fe-875b-3907e1913667"
          src="https://analytics.halo.run/umami.js"
        ></script>
      </Head>
      <Toaster />
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-10">
        <main>
          <h1 className="text-2xl font-semibold">Halo 资源下载</h1>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {combinedItems.map((group) => (
              <div key={group.title}>
                <h5 className="text-lg font-medium">{group.title}</h5>

                <ul className="mt-5 space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item.key}
                      className="hover:ring-1 group transition-all rounded cursor-pointer -mx-2 px-2 py-2 hover:bg-indigo-50"
                    >
                      <div
                        className="flex justify-between items-center gap-1"
                        title={item.key}
                      >
                        <span className="text-sm line-clamp-1 flex-1 shrink text-zinc-900">
                          {item.key.split("/").pop()}
                        </span>
                        <div className="hidden group-hover:inline-flex text-sm gap-1.5">
                          <a
                            href={"https://dl.halo.run/" + item.key}
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            下载
                          </a>
                          <button
                            onClick={() => handleCopy(item.key)}
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            复制链接
                          </button>
                          <button
                            onClick={() => handleCopySHA256(item.key)}
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            复制 SHA256
                          </button>
                        </div>
                        <span className="flex-none text-xs text-zinc-500 inline-block group-hover:hidden">
                          {filesize(item.size)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <footer className="mt-10 text-zinc-700 text-sm flex flex-col space-y-1.5 text-center">
            <p>
              Crafted with{" "}
              <i className="icon-[tabler--heart-filled] align-middle text-red-600"></i>{" "}
              by{" "}
              <a
                className="font-medium text-zinc-900 hover:text-zinc-600 hover:underline underline-offset-4"
                href="https://nova.moe"
                target="_blank"
                rel="noreferrer"
              >
                Nova Kwok
              </a>{" "}
              &{" "}
              <a
                className="font-medium text-zinc-900 hover:text-zinc-600 hover:underline underline-offset-4"
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
                className="font-medium text-zinc-900 hover:text-zinc-600 hover:underline underline-offset-4"
              >
                Cloudflare
              </a>
              , built with Workers, Cloudflare Pages and R2.
            </p>
            <div className="space-x-2">
              <GitHubLink href="https://github.com/halo-sigs/halo-dl-fe" />
              <GitHubLink href="https://github.com/halo-sigs/halo-dl-api" />
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function GitHubLink({ href }) {
  const match = href.match(/https:\/\/github.com\/(.*)/);

  const shortName = match[1];

  return (
    <a href={href} className="repo-link" target="_blank" rel="noreferrer">
      <i className="icon-[simple-icons--github]"></i>
      <span> {shortName} </span>
    </a>
  );
}

export default Home;
