// 临时本地预览服务器：静态服务 astro/dist（netlify adapter 不支持 astro preview）
// 用法: node scripts/serve-dist.mjs [port]  (默认 4326)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const port = Number(process.argv[2] || 4326);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const filePath = normalize(join(root, urlPath));

    // 防目录穿越
    if (!filePath.startsWith(root)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }

    let info;
    try {
      info = await stat(filePath);
    } catch {
      res.writeHead(404); res.end('404 Not Found'); return;
    }
    if (info.isDirectory()) {
      const indexPath = join(filePath, 'index.html');
      const indexStat = await stat(indexPath).catch(() => null);
      if (!indexStat) { res.writeHead(404); res.end('404 Not Found'); return; }
      return serve(res, indexPath);
    }
    serve(res, filePath);
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
});

function serve(res, filePath) {
  readFile(filePath).then((buf) => {
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(buf);
  });
}

server.listen(port, '0.0.0.0', () => {
  console.log(`Preview server: http://localhost:${port}/`);
});
