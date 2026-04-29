import express from "express";
import cors from "cors";

// --- In-Memory State (Note: Resets on serverless cold start) ---
let phase = "IDLE";
let players: Record<string, any> = {};

const app = express();
app.use(cors());
app.use(express.json());

// --- API Routes ---

app.get("/api/state", (req, res) => {
  res.json({
    phase,
    players: Object.values(players)
  });
});

app.get("/api/phase", (req, res) => {
  res.json({ phase });
});

app.post("/api/admin/phase", (req, res) => {
  const { newPhase } = req.body;
  phase = newPhase;
  res.json({ success: true, phase });
});

app.post("/api/players/:id", (req, res) => {
  const { id } = req.params;
  players[id] = { ...players[id], ...req.body, id };
  res.json({ success: true, player: players[id] });
});

app.get("/api/players/:id", (req, res) => {
  const { id } = req.params;
  res.json(players[id] || null);
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
  res.json({ success: true, players: Object.values(players) });
});

app.post("/api/admin/reset", (req, res) => {
  phase = "IDLE";
  players = {};
  res.json({ success: true });
});

export default app;
