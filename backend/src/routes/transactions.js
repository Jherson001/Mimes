import { Router } from "express";
import { pool } from "../db/pool.js";
import { suggestCategoryName } from "../lib/categorize.js";
import { parseVoiceExpenses } from "../lib/parseVoice.js";

export const router = Router();

async function resolveCategoryId(description, category_id) {
  if (category_id) return category_id;
  const name = suggestCategoryName(description);
  const [rows] = await pool.query("SELECT id FROM categories WHERE name=? LIMIT 1", [name]);
  return rows[0]?.id ?? null;
}

function tipsFromSummary({ total_expense, total_income, byCat }) {
  const tips = [];
  const expense = Number(total_expense) || 0;
  const income = Number(total_income) || 0;
  const top = (byCat || []).filter((c) => c.name).slice(0, 3);

  if (expense === 0) {
    tips.push("Aún no hay gastos este mes. Anotá con el mic o el formulario para ver el resumen.");
    return tips;
  }

  if (top[0]) {
    const pct = expense > 0 ? Math.round((Number(top[0].total) / expense) * 100) : 0;
    tips.push(
      `${top[0].name} es tu mayor gasto (${pct}% · S/ ${Number(top[0].total).toFixed(2)}). Ahí conviene recortar primero.`
    );
  }

  if (top[1]) {
    tips.push(`También mirá ${top[1].name}: S/ ${Number(top[1].total).toFixed(2)} este mes.`);
  }

  if (income > 0) {
    const saving = income - expense;
    const rate = Math.round((saving / income) * 100);
    if (saving < 0) {
      tips.push(
        `Vas S/ ${Math.abs(saving).toFixed(2)} por encima de tus ingresos. Bajá ocio o comida variable esta semana.`
      );
    } else if (rate < 10) {
      tips.push(`Estás ahorrando solo ${rate}% de tus ingresos. Meta simple: llegar a 15–20%.`);
    } else {
      tips.push(`Vas bien: ahorro estimado ${rate}% (S/ ${saving.toFixed(2)}).`);
    }
  } else {
    tips.push("Registrá también ingresos (sueldo) para comparar cuánto te queda al mes.");
  }

  return tips;
}

router.post("/", async (req, res) => {
  try {
    const {
      type = "expense",
      category_id,
      amount,
      description = "",
      occurred_at,
      is_recurring = 0,
    } = req.body;
    const user_id = req.user.id;

    const value = Number(amount);
    if (!["expense", "income"].includes(type) || !Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ message: "amount y type inválidos" });
    }

    const date = occurred_at || new Date().toISOString().slice(0, 10);
    const catId = type === "expense" ? await resolveCategoryId(description, category_id) : category_id || null;

    const [result] = await pool.execute(
      "INSERT INTO transactions (user_id,type,category_id,amount,description,occurred_at,is_recurring) VALUES (?,?,?,?,?,?,?)",
      [user_id, type, catId, value, description, date, is_recurring]
    );

    res.status(201).json({ ok: true, id: result.insertId, category_id: catId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "No se pudo guardar el gasto" });
  }
});

router.post("/voice", async (req, res) => {
  try {
    const { text = "", occurred_at } = req.body;
    const user_id = req.user.id;
    const items = parseVoiceExpenses(text);
    if (!items.length) {
      return res.status(400).json({
        message: 'No entendí montos. Probá: "gasté 2 soles en agua, 1 sol en comida"',
      });
    }

    const date = occurred_at || new Date().toISOString().slice(0, 10);
    const saved = [];

    for (const item of items) {
      const catId = await resolveCategoryId(item.description, null);
      const [result] = await pool.execute(
        "INSERT INTO transactions (user_id,type,category_id,amount,description,occurred_at,is_recurring) VALUES (?,?,?,?,?,?,?)",
        [user_id, "expense", catId, item.amount, item.description, date, 0]
      );
      saved.push({
        id: result.insertId,
        ...item,
        category_id: catId,
        category: suggestCategoryName(item.description),
      });
    }

    res.status(201).json({ ok: true, count: saved.length, items: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "No se pudo registrar por voz" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: "month requerido (YYYY-MM)" });
    const [rows] = await pool.query(
      `SELECT t.*, c.name AS category_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id=? AND DATE_FORMAT(t.occurred_at,'%Y-%m')=?
       ORDER BY t.occurred_at DESC, t.id DESC`,
      [req.user.id, month]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al listar transacciones" });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: "month requerido (YYYY-MM)" });
    const userId = req.user.id;

    const [[{ total_expense = 0 }]] = await pool.query(
      "SELECT COALESCE(SUM(amount),0) AS total_expense FROM transactions WHERE user_id=? AND type='expense' AND DATE_FORMAT(occurred_at,'%Y-%m')=?",
      [userId, month]
    );
    const [[{ total_income = 0 }]] = await pool.query(
      "SELECT COALESCE(SUM(amount),0) AS total_income FROM transactions WHERE user_id=? AND type='income' AND DATE_FORMAT(occurred_at,'%Y-%m')=?",
      [userId, month]
    );
    const [byCat] = await pool.query(
      `SELECT COALESCE(c.name,'Sin categoría') AS name, SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id=c.id
       WHERE t.user_id=? AND t.type='expense' AND DATE_FORMAT(t.occurred_at,'%Y-%m')=?
       GROUP BY COALESCE(c.name,'Sin categoría')
       ORDER BY total DESC`,
      [userId, month]
    );
    const [byDay] = await pool.query(
      `SELECT DATE_FORMAT(occurred_at,'%Y-%m-%d') AS day, SUM(amount) AS total
       FROM transactions
       WHERE user_id=? AND type='expense' AND DATE_FORMAT(occurred_at,'%Y-%m')=?
       GROUP BY DATE_FORMAT(occurred_at,'%Y-%m-%d')
       ORDER BY day ASC`,
      [userId, month]
    );

    const payload = {
      total_income: Number(total_income),
      total_expense: Number(total_expense),
      saving: Number(total_income) - Number(total_expense),
      byCat: byCat.map((r) => ({ name: r.name, total: Number(r.total) })),
      byDay: byDay.map((r) => ({ day: r.day, total: Number(r.total) })),
    };
    payload.tips = tipsFromSummary(payload);
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al calcular resumen" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: "id inválido" });
    }

    const [result] = await pool.execute(
      "DELETE FROM transactions WHERE id=? AND user_id=?",
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Movimiento no encontrado" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "No se pudo eliminar" });
  }
});
