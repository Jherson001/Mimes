import { Router } from "express";
export const router = Router();

const rules = [
  { cat: "Alimentación", keys: ["pollo","menú","rest","market","bodega","comida","pizza"] },
  { cat: "Transporte",  keys: ["uber","taxi","bus","metropolitano","gasolina"] },
  { cat: "Servicios",   keys: ["luz","agua","internet","movistar","claro","entel","celular"] },
  { cat: "Educación",   keys: ["curso","udemy","colegiatura","matrícula"] },
  { cat: "Ocio",        keys: ["cine","netflix","spotify","juego","bar"] }
];

router.post("/tx/auto-categorize",(req,res)=>{
  const { description="" } = req.body;
  const text = description.toLowerCase();
  const hit = rules.find(r => r.keys.some(k => text.includes(k)));
  res.json({ suggestedCategoryName: hit?.cat || "Ocio" });
});

router.get("/schedule/suggest",(req,res)=>{
  const { date, hours=1 } = req.query;
  // v1: propone 19:00–20:00 por defecto (hora común de estudio)
  res.json({ date, start_time: "19:00", end_time: "20:00", title: "Estudio (IA sugerencia)", tag: "estudio", priority: 1 });
});
