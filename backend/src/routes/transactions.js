import { Router } from "express";
import { pool } from "../db/pool.js";
export const router = Router();

router.post("/", async (req,res)=>{
  const { user_id=1, type, category_id, amount, description, occurred_at, is_recurring=0 } = req.body;
  await pool.execute(
    "INSERT INTO transactions (user_id,type,category_id,amount,description,occurred_at,is_recurring) VALUES (?,?,?,?,?,?,?)",
    [user_id, type, category_id||null, amount, description||"", occurred_at, is_recurring]
  );
  res.status(201).json({ok:true});
});

router.get("/", async (req,res)=>{
  const { month } = req.query; // 'YYYY-MM'
  const [rows] = await pool.query(
    "SELECT * FROM transactions WHERE user_id=? AND DATE_FORMAT(occurred_at,'%Y-%m')=? ORDER BY occurred_at DESC",
    [1, month]
  );
  res.json(rows);
});

router.get("/summary", async (req,res)=>{
  const { month } = req.query;
  const [[{ total_expense=0 }]] = await pool.query(
    "SELECT COALESCE(SUM(amount),0) AS total_expense FROM transactions WHERE user_id=? AND type='expense' AND DATE_FORMAT(occurred_at,'%Y-%m')=?",
    [1, month]
  );
  const [[{ total_income=0 }]] = await pool.query(
    "SELECT COALESCE(SUM(amount),0) AS total_income FROM transactions WHERE user_id=? AND type='income' AND DATE_FORMAT(occurred_at,'%Y-%m')=?",
    [1, month]
  );
  const [byCat] = await pool.query(
    `SELECT c.name, SUM(t.amount) total 
     FROM transactions t LEFT JOIN categories c ON t.category_id=c.id
     WHERE t.user_id=? AND t.type='expense' AND DATE_FORMAT(t.occurred_at,'%Y-%m')=?
     GROUP BY c.name ORDER BY total DESC`,
    [1, month]
  );
  res.json({ total_income, total_expense, saving: total_income-total_expense, byCat });
});
