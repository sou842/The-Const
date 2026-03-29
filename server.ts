// server.js — Custom Next.js + Socket.io server
// Per Next.js docs: https://nextjs.org/docs/app/building-your-application/configuring/custom-server
// NOTE: This file is NOT processed by the Next.js compiler. Use CommonJS/ESM compatible syntax.

import { createServer } from 'http';
import next from 'next';
import pkg from '@next/env';
const { loadEnvConfig } = pkg;

// Load environment variables from .env.local before anything else
const projectDir = process.cwd();
loadEnvConfig(projectDir);

// Now we can safely import modules that depend on environment variables
const { initSocketServer } = await import('./src/lib/socketServer.js');

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Attach Socket.io to the same HTTP server
  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(
      `> Server listening at http://localhost:${port} as ${dev ? 'development' : 'production'}`
    );
  });
});
