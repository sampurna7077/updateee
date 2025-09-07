import { type Express } from "express";
import { type Server } from "http";

// This file dynamically imports vite only when needed
export async function loadViteSetup(): Promise<(app: Express, server: Server) => Promise<void>> {
  const { createServer: createViteServer, createLogger } = await import("vite");
  const viteConfig = await import("../vite.config");
  const { nanoid } = await import("nanoid");
  const fs = await import("fs");
  const path = await import("path");

  const viteLogger = createLogger();

  return async function setupVite(app: Express, server: Server) {
    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as const,
    };

    const vite = await createViteServer({
      ...viteConfig.default,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          process.exit(1);
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html",
        );

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  };
}