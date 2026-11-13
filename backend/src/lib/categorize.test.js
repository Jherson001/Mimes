import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { suggestCategoryName } from "./categorize.js";

describe("suggestCategoryName", () => {
  it("asigna Alimentación si la descripción habla de comida", () => {
    assert.equal(suggestCategoryName("pollo a la brasa"), "Alimentación");
  });

  it("asigna Transporte si menciona uber o taxi", () => {
    assert.equal(suggestCategoryName("viaje en uber"), "Transporte");
  });

  it("asigna Servicios si menciona un recibo o yape", () => {
    assert.equal(suggestCategoryName("pago de luz"), "Servicios");
  });

  it("devuelve Otros cuando no hay coincidencia", () => {
    assert.equal(suggestCategoryName("algo raro xyz"), "Otros");
  });
});