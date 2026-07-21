import { Router } from "express";
import { suggestCategoryName } from "../lib/categorize.js";
import { parseVoiceExpenses } from "../lib/parseVoice.js";

export const router = Router();

router.post("/auto-categorize", (req, res) => {
  const { description = "" } = req.body;
  res.json({ suggestedCategoryName: suggestCategoryName(description) });
});

router.post("/parse-voice", (req, res) => {
  const { text = "" } = req.body;
  const items = parseVoiceExpenses(text).map((item) => ({
    ...item,
    category: suggestCategoryName(item.description),
  }));
  res.json({ items });
});
