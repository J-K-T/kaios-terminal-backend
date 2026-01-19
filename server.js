import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Render provides PORT at runtime; many services default to 10000 if not set,
// so always read from process.env.PORT. :contentReference[oaicite:2]{index=2}
const PORT = Number(process.env.PORT || 10000);

const API_TOKEN = process.env.API_TOKEN || "";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: "32kb" }));
app.use(morgan("tiny"));

function requireToken(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!API_TOKEN || token !== API_TOKEN) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  next();
}

const nowISO = () => new Date().toISOString();

app.get("/api/ping", requireToken, (req, res) => {
  res.json({ ok: true, ts: nowISO(), server: "kaios-terminal-backend", status: "ONLINE" });
});

app.get("/api/brief", requireToken, (req, res) => {
  res.json({
    ok: true,
    ts: nowISO(),
    title: "DAILY BRIEF",
    lines: [
      "NODE: ORBITAL-07",
      "LINK: STABLE",
      "TASK: Build the terminal.",
      "NOTE: Short lines read best on flip screens."
    ]
  });
});

app.post("/api/cmd", requireToken, (req, res) => {
  const input = String(req.body?.cmd || "").trim().toLowerCase();
  const allowed = new Set(["help", "ping", "brief", "time", "echo"]);
  const parts = input.split(/\s+/);
  const base = parts[0];

  if (!allowed.has(base)) {
    return res.json({ ok: true, ts: nowISO(), output: `ERR: unknown command "${base}". Type "help".` });
  }

  if (base === "help") {
    return res.json({
      ok: true,
      ts: nowISO(),
      output: "AVAILABLE:\n  help  ping  brief  time  echo <text>"
    });
  }
  if (base === "ping") return res.json({ ok: true, ts: nowISO(), output: "PONG" });
  if (base === "brief") return res.json({ ok: true, ts: nowISO(), output: "Use BRIEF for the full message." });
  if (base === "time") return res.json({ ok: true, ts: nowISO(), output: `SERVER TIME: ${nowISO()}` });
  if (base === "echo") {
    const msg = input.slice("echo".length).trim();
    return res.json({ ok: true, ts: nowISO(), output: msg || "(empty)" });
  }
});

app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
