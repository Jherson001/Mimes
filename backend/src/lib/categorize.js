const RULES = [
  { cat: "Alimentación", keys: ["pollo a la brasa", "menú", "menu", "rest", "market", "bodega", "comida", "pizza", "almuerzo", "desayuno", "cena", "pan", "fruta"] },
  { cat: "Transporte", keys: ["uber", "taxi", "bus", "metropolitano", "gasolina", "pasaje", "moto"] },
  { cat: "Servicios", keys: ["luz", "agua", "internet", "movistar", "claro", "entel", "celular", "recibo","yape","deuda"] },
  { cat: "Educación", keys: ["curso", "udemy", "colegiatura", "matrícula", "matricula", "libro"] },
  { cat: "Ocio", keys: ["cine", "netflix", "spotify", "juego", "bar", "cerveza", "chela", "fiesta"] },
  { cat: "Salud", keys: ["farmacia", "medico", "médico", "remedio", "clinica", "clínica", "dental"] },
  { cat: "Vivienda", keys: ["alquiler", "renta", "departamento", "casa"] },
];

export function suggestCategoryName(description = "") {
  const text = String(description).toLowerCase();
  const hit = RULES.find((r) => r.keys.some((k) => text.includes(k.toLowerCase())));
  return hit?.cat || "Otros";
}
