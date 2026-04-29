import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to load state
function loadState() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (e) {
      return { phase: "IDLE", players: {} };
    }
  }
  return { phase: "IDLE", players: {} };
}

// Helper to save state
function saveState(state: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Load initial state
  let { phase, players } = loadState();

  // --- API Routes ---
  
  app.get("/api/state", (req, res) => {
    res.json({ phase, players: Object.values(players) });
  });

  app.get("/api/players/:id", (req, res) => {
    const { id } = req.params;
    res.json(players[id] || null);
  });

  app.post("/api/admin/phase", (req, res) => {
    const { newPhase } = req.body;
    phase = newPhase;
    saveState({ phase, players });
    res.json({ success: true, phase });
  });

  app.post("/api/players/:id", (req, res) => {
    const { id } = req.params;
    players[id] = { ...players[id], ...req.body, id };
    saveState({ phase, players });
    res.json({ success: true, player: players[id] });
  });

  app.post("/api/admin/calculate", (req, res) => {
    const ROLES_LIMITS: Record<string, number> = {
      judge: 1, prosecutor: 1, lawyer: 1, secretary: 1, witness: 99
    };

    const candidates = Object.values(players)
      .filter((p: any) => p.status === 'finished')
      .sort((a: any, b: any) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timeTaken - b.timeTaken;
      });

    const roleAllocations: Record<string, number> = {
      judge: 0, prosecutor: 0, lawyer: 0, secretary: 0, witness: 0
    };

    for (const p of candidates) {
      let assigned = 'witness';
      for (const choice of p.choices) {
        if (roleAllocations[choice] < ROLES_LIMITS[choice]) {
          assigned = choice;
          roleAllocations[choice]++;
          break;
        }
      }
      players[p.id].assignedRole = assigned;
    }

    phase = 'RESULTS';
    saveState({ phase, players });
    res.json({ success: true, players: Object.values(players) });
  });

  app.post("/api/admin/reset", (req, res) => {
    phase = "IDLE";
    players = {};
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
    res.json({ success: true });
  });

  // --- Vite Middleware ---
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
