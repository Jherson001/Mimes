import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

export const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: "7d" }
  );
}

// Registro
router.post("/register", async (req, res) => {
  try {
    const { name = "", email = "", password = "" } = req.body;
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    if (!cleanName || !cleanEmail || password.length < 6) {
      return res.status(400).json({
        message: "Nombre, email y contraseña (mín. 6) son requeridos",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?,?,?)",
      [cleanName, cleanEmail, password_hash]
    );

    const user = { id: result.insertId, name: cleanName, email: cleanEmail };
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Ese email ya está registrado" });
    }
    console.error(err);
    res.status(500).json({
      message: "No se pudo registrar",
      code: err.code || "REGISTER_ERROR",
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email=? LIMIT 1",
      [email]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "Email o contraseña incorrectos" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Email o contraseña incorrectos" });
    }

    const token = signToken(user);
    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "No se pudo iniciar sesión",
      code: err.code || "LOGIN_ERROR",
    });
  }
});

// Quién soy (opcional, para probar el token)
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});