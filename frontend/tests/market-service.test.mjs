import test from "node:test";
import assert from "node:assert/strict";
import { validarHistorico, validarAtivos, buscarHistoricoMercado } from "../src/services/marketService.ts";

const candle = (date, close = 11) => ({ date, open: 10, high: 13, low: 9, close, volume: 0 });
const history = (data) => ({ asset: "petrobras", ticker: "PETR4.SA", period: "1mo", interval: "1d", currency: "BRL", unit: "currency", timezone: "America/Sao_Paulo", source: "teste", count: data.length, data });

test("validação ordena datas e conserva o último duplicado, sem preencher lacunas", () => {
  const result = validarHistorico(history([candle("2026-10-30"), candle("2026-10-26"), candle("2026-10-30", 12)]));
  assert.deepEqual(result.data.map((point) => point.date), ["2026-10-26", "2026-10-30"]);
  assert.equal(result.data[1].close, 12);
  assert.equal(result.discarded, 1);
  assert.equal(result.data[0].volume, 0);
});

test("OHLC inválido é removido e volume ausente não é inventado", () => {
  const result = validarHistorico(history([candle("2026-10-30"), { ...candle("2026-10-29"), high: 8 }, { ...candle("2026-10-28"), volume: -1 }, candle("2026-02-30")]));
  assert.equal(result.discarded, 2);
  assert.equal(result.data[0].volume, null);
  assert.throws(() => validarHistorico(history([{ ...candle("2026-10-30"), close: Infinity }])));
  assert.deepEqual(validarHistorico(history([])).data, []);
});

test("catálogo exige moeda e unidade para evitar valores financeiros ambíguos", () => {
  assert.throws(() => validarAtivos([{ id: "dolar", ticker: "BRL=X" }]));
  const assets = validarAtivos([{ id: "ibovespa", ticker: "^BVSP", name: "Ibovespa", category: "Índices", currency: "BRL", unit: "points" }]);
  assert.equal(assets[0].unit, "points");
});

test("requisições simultâneas compartilham resposta e atualização força uma nova consulta", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    await Promise.resolve();
    return new Response(JSON.stringify(history([candle("2026-10-30")])), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const [first, second] = await Promise.all([buscarHistoricoMercado("petrobras", "1mo", "1d"), buscarHistoricoMercado("petrobras", "1mo", "1d")]);
    assert.equal(calls, 1);
    assert.strictEqual(first, second);
    await buscarHistoricoMercado("petrobras", "1mo", "1d");
    assert.equal(calls, 1);
    await buscarHistoricoMercado("petrobras", "1mo", "1d", { force: true });
    assert.equal(calls, 2);
  } finally { globalThis.fetch = originalFetch; }
});
