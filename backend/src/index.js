import express from "express";
import cors from "cors";
import "dotenv/config";
import { router as tx } from "./routes/transactions.js";
import { router as budgets } from "./routes/budgets.js";
import { router as blocks } from "./routes/blocks.js";
import { router as ai } from "./routes/ai.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_,res)=>res.json({ok:true}));
app.use("/api/tx", tx);
app.use("/api/budgets", budgets);
app.use("/api/blocks", blocks);
app.use("/api", ai);

app.listen(8000, () => console.log("API http://localhost:8000"));
