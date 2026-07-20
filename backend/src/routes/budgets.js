import { Router } from "express";
import { pool } from "../db/pool.js";

export const router = Router();

router.get("/", async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: "month requerido (YYYY-MM)" });

    const [rows] = await pool.query(
      `SELECT b.id, b.amount AS limit_amount, b.month, c.id AS category_id, c.name AS category_name,
              COALESCE((
                SELECT SUM(t.amount) FROM transactions t
                WHERE t.user_id=b.user_id AND t.type='expense'
                  AND t.category_id=b.category_id
                  AND DATE_FORMAT(t.occurred_at,'%Y-%m')=b.month
              ), 0) AS spent
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       WHERE b.user_id=? AND b.month=?
       ORDER BY c.name`,
      [req.user.id, month]
    );

    res.json(
      rows.map((r) => ({
        id: r.id,
        category_id: r.category_id,
        category_name: r.category_name,
        month: r.month,
        limit_amount: Number(r.limit_amount),
        spent: Number(r.spent),
        remaining: Number(r.limit_amount) - Number(r.spent),
        over: Number(r.spent) > Number(r.limit_amount),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al listar topes" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { category_id, month, amount } = req.body;
    const user_id = req.user.id;
    const value = Number(amount);
    if (!category_id || !month || !Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ message: "category_id, month y amount inválidos" });
    }

    await pool.execute(
      `INSERT INTO budgets (user_id, category_id, month, amount)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE amount=VALUES(amount)`,
      [user_id, category_id, month, value]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "No se pudo guardar el tope" });
  }
});
