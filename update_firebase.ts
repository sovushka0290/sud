import fs from 'fs';

const bpFile = 'firebase-blueprint.json';
const bp = JSON.parse(fs.readFileSync(bpFile, 'utf8'));

bp.entities["Evidence"] = {
  title: "Evidence",
  description: "Testimony and file evidence.",
  type: "object",
  properties: {
    playerId: { type: "string" },
    playerName: { type: "string" },
    testimony: { type: "string" },
    fileBase64: { type: "string" },
    timestamp: { type: "number" }
  },
  required: ["playerId", "playerName", "testimony", "timestamp"]
};

bp.firestore["/evidence/{evidenceId}"] = {
  schema: { "$ref": "#/entities/Evidence" },
  description: "Collected evidence for the case."
};

fs.writeFileSync(bpFile, JSON.stringify(bp, null, 2));
