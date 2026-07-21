/**
 * Parse phrases like:
 * "gaste 2 soles en agua, 1 sol en comida, 10 soles en cerveza"
 * "anota 0.50 taxi"
 */
export function parseVoiceExpenses(text = "") {
  const cleaned = String(text)
    .toLowerCase()
    .replace(/[¡!¿?]/g, " ")
    .replace(/\bgast[eé]\b|\banota\b|\bregistra\b|\bpagué\b|\bpague\b/gi, " ")
    .trim();

  if (!cleaned) return [];

  const chunks = cleaned
    .split(/\s*,\s*|\s+y\s+/i)
    .map((c) => c.trim())
    .filter(Boolean);

  const items = [];
  for (const chunk of chunks) {
    const m = chunk.match(
      /(\d+(?:[.,]\d+)?)\s*(?:sol(?:es)?|s\/\.?|centavos?|c[eé]ntimos?)?\s*(?:en\s+)?(.+)?/i
    );
    if (!m) continue;

    let amount = Number(String(m[1]).replace(",", "."));
    const unit = chunk.match(/centavos?|c[eé]ntimos?/i);
    if (unit && amount >= 1) amount = amount / 100;

    const description = (m[2] || chunk.replace(m[0], "").trim() || "gasto").trim();
    if (!Number.isFinite(amount) || amount <= 0) continue;

    items.push({
      type: "expense",
      amount: Math.round(amount * 100) / 100,
      description: description.replace(/\s+/g, " "),
    });
  }

  return items;
}
