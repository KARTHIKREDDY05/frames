import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const indexPath = join(process.cwd(), "dist", "index.html");
const html = readFileSync(indexPath, "utf8");

const seo = `
    <meta name="description" content="Frames is a social scrapbook app for capturing daily moments, following friends, and turning posts into memories." />
    <meta name="theme-color" content="#F6F0E7" />
    <link rel="canonical" href="https://frames-test-build.vercel.app/" />
    <meta property="og:title" content="Frames - Social Scrapbook App" />
    <meta property="og:description" content="Capture Frames, follow friends, and build memories automatically." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://frames-test-build.vercel.app/" />
    <meta property="og:site_name" content="Frames" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Frames - Social Scrapbook App" />
    <meta name="twitter:description" content="Capture Frames, follow friends, and build memories automatically." />`;

const updated = html
  .replace("<title>Frames</title>", "<title>Frames - Social Scrapbook App</title>")
  .replace("</head>", `${seo}\n  </head>`);

writeFileSync(indexPath, updated);
