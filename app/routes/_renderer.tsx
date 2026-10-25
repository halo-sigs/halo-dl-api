import { jsxRenderer } from "hono/jsx-renderer";
import { Link } from "honox/server";

export default jsxRenderer(({ children }) => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Halo 资源下载</title>
        <meta name="description" content="Halo Download Mirror" />
        <link rel="shortcut icon" href="/favicon.png" />
        <Link href="/app/style.css" rel="stylesheet" />
        <script src="/copy.js" defer></script>
        <script
          async
          defer
          data-website-id="2b41f81a-37e0-48fe-875b-3907e1913667"
          src="https://analytics.halo.run/umami.js"
        ></script>
      </head>
      <body>{children}</body>
    </html>
  );
});
