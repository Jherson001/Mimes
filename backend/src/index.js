import express from "express";
import cors from "cors";
import "dotenv/config";
import { router as tx } from "./routes/transactions.js";
import { router as ai } from "./routes/ai.js";
import { router as budgets } from "./routes/budgets.js";
import { router as auth } from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";
import { pool } from "./db/pool.js";

const app = express();
app.use(cors());
app.use(express.json());

const BUILD = "2026-07-26-deploy";

function envSnapshot() {
  const hasUrl = Boolean(process.env.DATABASE_URL || process.env.MYSQL_URL);
  return {
    build: BUILD,
    host: process.env.DB_HOST || (hasUrl ? "(from DATABASE_URL)" : "(missing)"),
    port: process.env.DB_PORT || (hasUrl ? "(from DATABASE_URL)" : "(missing)"),
    dbName: process.env.DB_NAME || (hasUrl ? "(from DATABASE_URL)" : "(missing)"),
    hasPass: Boolean(
      process.env.DB_PASS || process.env.DB_PASSWORD || process.env.DATABASE_URL || process.env.MYSQL_URL
    ),
    hasUrl,
    ssl: process.env.DB_SSL || (String(process.env.DB_HOST || "").includes("aivencloud.com") ? "auto" : "false"),
  };
}

app.get("/health", (_, res) => res.json({ ok: true, build: BUILD }));

app.get("/health/env", (_, res) => res.json({ ok: true, ...envSnapshot() }));

app.get("/health/db", async (_, res) => {
  const snap = envSnapshot();
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({
      ok: true,
      db: true,
      result: rows[0]?.ok === 1,
      ...snap,
    });
  } catch (err) {
    console.error("DB health failed:", err.code || err.message);
    res.status(500).json({
      ok: false,
      db: false,
      code: err.code || "DB_ERROR",
      message: err.message,
      ...snap,
    });
  }
});

app.use("/api/auth", auth);
app.use("/api/tx", requireAuth, tx);
app.use("/api/ai", ai);
app.use("/api/budgets", requireAuth, budgets);

app.listen(process.env.PORT || 8000, () => {
  const snap = envSnapshot();
  console.log(`API on http://localhost:${process.env.PORT || 8000}`);
  console.log(`DB target host=${snap.host} port=${snap.port} hasPass=${snap.hasPass} build=${BUILD}`);
});
