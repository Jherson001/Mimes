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

app.get("/health", (_, res) => res.json({ ok: true }));

app.get("/health/db", async (_, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({
      ok: true,
      db: true,
      result: rows[0]?.ok === 1,
      host: process.env.DB_HOST || "(from DATABASE_URL)",
      hasPass: Boolean(process.env.DB_PASS || process.env.DB_PASSWORD || process.env.DATABASE_URL),
      ssl: process.env.DB_SSL || (String(process.env.DB_HOST || "").includes("aivencloud.com") ? "auto" : "false"),
    });
  } catch (err) {
    console.error("DB health failed:", err.code || err.message);
    res.status(500).json({
      ok: false,
      db: false,
      code: err.code || "DB_ERROR",
      message: err.message,
      host: process.env.DB_HOST || "(missing)",
      port: process.env.DB_PORT || "(missing)",
      hasPass: Boolean(process.env.DB_PASS || process.env.DB_PASSWORD || process.env.DATABASE_URL),
      dbName: process.env.DB_NAME || "(missing)",
    });
  }
});

app.use("/api/auth", auth);
app.use("/api/tx", requireAuth, tx);
app.use("/api/ai", ai);
app.use("/api/budgets", requireAuth, budgets);

app.listen(process.env.PORT || 8000, () => {
  console.log(`API on http://localhost:${process.env.PORT || 8000}`);
});
