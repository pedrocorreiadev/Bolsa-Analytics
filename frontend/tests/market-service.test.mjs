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

test("1 dia mostra a última sessão real e compartilha consulta/cache com 5 dias sem alterar OHLC", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  const payload = { ...history([candle("2026-10-30", 12), candle("2026-10-26"), candle("2026-10-29")]), period: "5d" };
  globalThis.fetch = async (url) => {
    calls += 1;
    const params = new URL(String(url), "http://localhost").searchParams;
    assert.equal(params.get("period"), "5d", "a API continua recebendo um período suportado");
    assert.equal(params.get("interval"), "1d");
    return new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } });
  };
  try {
    const [day, fiveDays] = await Promise.all([
      buscarHistoricoMercado("petrobras", "1d", "1d", { force: true }),
      buscarHistoricoMercado("petrobras", "5d", "1d"),
    ]);
    assert.equal(calls, 1);
    assert.equal(day.period, "1d");
    assert.equal(day.count, 1);
    assert.deepEqual(day.data, [candle("2026-10-30", 12)]);
    assert.equal(day.timezone, "America/Sao_Paulo");
    assert.equal(fiveDays.period, "5d");
    assert.equal(fiveDays.data.length, 3, "a visualização diária não altera o histórico compartilhado");
    await buscarHistoricoMercado("petrobras", "1d", "1d");
    assert.equal(calls, 1);
    payload.data.push(candle("2026-11-03"));
    const updated = await buscarHistoricoMercado("petrobras", "1d", "1d", { force: true });
    assert.equal(calls, 2);
    assert.equal(updated.data[0].date, "2026-11-03", "a atualização acompanha a sessão mais recente da fonte");
  } finally { globalThis.fetch = originalFetch; }
});

test("1 dia não inventa sessão quando a fonte está vazia e rejeita intervalos incompatíveis", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify({ ...history([]), period: "5d" }), { headers: { "Content-Type": "application/json" } });
  };
  try {
    const result = await buscarHistoricoMercado("petrobras", "1d", "1d", { force: true });
    assert.deepEqual(result.data, []);
    assert.equal(result.count, 0);
    for (const interval of ["1wk", "1mo"]) {
      await assert.rejects(buscarHistoricoMercado("petrobras", "1d", interval), (error) => error.status === 400);
    }
    assert.equal(calls, 1, "intervalos inválidos não consultam a API");
  } finally { globalThis.fetch = originalFetch; }
});
