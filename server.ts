import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");

// Ensure DATA_DIR exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const METADATA_PATH = path.join(DATA_DIR, "catalog_metadata.json");
const COMBOS_PATH = path.join(DATA_DIR, "catalog_combos.json");
const MATERIALS_PATH = path.join(DATA_DIR, "catalog_materials.json");

// Admin password (defaults to "admin1234")
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";

async function start() {
  const app = express();
  
  // High limit for uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoints
  app.get("/api/catalog/metadata", (req, res) => {
    if (fs.existsSync(METADATA_PATH)) {
      try {
        const data = fs.readFileSync(METADATA_PATH, "utf-8");
        return res.json(JSON.parse(data));
      } catch (err) {
        return res.status(500).json({ error: "Erro ao ler metadados do catálogo." });
      }
    } else {
      return res.status(404).json({ error: "Catálogo não publicado pelo admin." });
    }
  });

  app.get("/api/catalog/combos", (req, res) => {
    if (fs.existsSync(COMBOS_PATH)) {
      try {
        const data = fs.readFileSync(COMBOS_PATH, "utf-8");
        res.setHeader("Content-Type", "application/json");
        return res.send(data);
      } catch (err) {
        return res.status(500).json({ error: "Erro ao ler combinações do catálogo." });
      }
    } else {
      return res.status(404).json({ error: "Dados de combinações não encontrados." });
    }
  });

  app.get("/api/catalog/materials", (req, res) => {
    if (fs.existsSync(MATERIALS_PATH)) {
      try {
        const data = fs.readFileSync(MATERIALS_PATH, "utf-8");
        res.setHeader("Content-Type", "application/json");
        return res.send(data);
      } catch (err) {
        return res.status(500).json({ error: "Erro ao ler materiais do catálogo." });
      }
    } else {
      return res.status(404).json({ error: "Dados de materiais não encontrados." });
    }
  });

  // Admin Verification endpoint
  app.post("/api/catalog/verify-admin", (req, res) => {
    const { password } = req.body;
    if (password && password === ADMIN_PASSWORD) {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ error: "Senha administrativa incorreta!" });
    }
  });

  // Admin Publish endpoint
  app.post("/api/catalog/publish", (req, res) => {
    const { combos, materials, version, source, password } = req.body;

    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Senha administrativa incorreta!" });
    }

    if (!combos || !materials || !version) {
      return res.status(400).json({ error: "Dados incompletos para publicação." });
    }

    try {
      const updatedAt = new Date().toISOString();
      const metadata = {
        version,
        updatedAt,
        source: source || "Codigos-Base.xlsx",
        published: true
      };

      fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2), "utf-8");
      fs.writeFileSync(COMBOS_PATH, JSON.stringify(combos), "utf-8");
      fs.writeFileSync(MATERIALS_PATH, JSON.stringify(materials), "utf-8");

      return res.json({ success: true, metadata });
    } catch (err: any) {
      return res.status(500).json({ error: "Falha ao gravar ficheiros do catálogo: " + err.message });
    }
  });

  // Serve static assets / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
});
