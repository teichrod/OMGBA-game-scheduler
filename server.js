import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
const dataFilePath = path.join(dataDir, "published-schedule.json");

app.use(cors());
app.use(express.json({ limit: "50mb" }));

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(
      dataFilePath,
      JSON.stringify({ payload: null }, null, 2),
      "utf-8"
    );
  }
}

app.get("/api/published-schedule", (req, res) => {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(dataFilePath, "utf-8");
    const json = JSON.parse(raw || "{}");
    res.status(200).json(json);
  } catch (err) {
    console.error("GET /api/published-schedule failed:", err);
    res.status(500).json({ error: "Failed to read published schedule" });
  }
});

app.post("/api/published-schedule", (req, res) => {
  try {
    ensureDataFile();

    const body = req.body ?? {};
    const serialized = JSON.stringify(body, null, 2);

    fs.writeFileSync(dataFilePath, serialized, "utf-8");

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("POST /api/published-schedule failed:", err);
    res.status(500).json({
      error: "Failed to save published schedule",
      message: err?.message || String(err),
    });
  }
});

app.delete("/api/published-schedule", (req, res) => {
  try {
    ensureDataFile();
    fs.writeFileSync(
      dataFilePath,
      JSON.stringify({ payload: null }, null, 2),
      "utf-8"
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("DELETE /api/published-schedule failed:", err);
    res.status(500).json({ error: "Failed to clear published schedule" });
  }
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});