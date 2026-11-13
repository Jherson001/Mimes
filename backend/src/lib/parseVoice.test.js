import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseVoiceExpenses } from "./parseVoice.js";

describe("parseVoiceExpenses", () => {
  it("separa varios gastos en una frase", () => {
    const items = parseVoiceExpenses(
      "gaste 2 soles en agua, 1 sol en comida, 10 soles en cerveza"
    );
    assert.equal(items.length, 3);
    assert.equal(items[0].amount, 2);
    assert.equal(items[0].description, "agua");
    assert.equal(items[1].amount, 1);
    assert.equal(items[2].amount, 10);
    assert.equal(items[2].description, "cerveza");
  });

  it("entiende montos con decimales", () => {
    const items = parseVoiceExpenses("anota 0.50 taxi");
    assert.equal(items.length, 1);
    assert.equal(items[0].amount, 0.5);
    assert.match(items[0].description, /taxi/i);
  });

  it("devuelve lista vacía si el texto no trae montos", () => {
    assert.deepEqual(parseVoiceExpenses("hola"), []);
    assert.deepEqual(parseVoiceExpenses(""), []);
  });
});