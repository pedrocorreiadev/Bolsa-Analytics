import assert from "node:assert/strict";
import test from "node:test";
import { compareHistories, comparisonDate, comparisonIntervals } from "../src/utils/comparison.ts";

// Synthetic observations exercise math and missing-session behavior only.
// These fixtures are never imported by the application.
const point = (date, close) => ({ date, open: close, high: close + 1, low: close - 1, close, volume: null });
const history = (data, overrides = {}) => ({
  asset: "test", ticker: "TEST", period: "1mo", interval: "1d", currency: "BRL", unit: "currency",
  timezone: "America/Sao_Paulo", source: "unit-test", count: data.length, data, ...overrides,
});

test("uses common dates for the base, return and paired OHLC without filling gaps", () => {
  const first = history([point("2026-01-01", 10), point("2026-01-03", 30), point("2026-01-04", 33)]);
  const second = history([point("2026-01-02", 200), point("2026-01-03", 300), point("2026-01-04", 330)]);
  const before = JSON.stringify([first, second]);
  const result = compareHistories(first, second);
  assert.equal(result.count, 2);
  assert.deepEqual(result.points.map(({ date }) => date), ["2026-01-03", "2026-01-04"]);
  assert.equal(result.firstSummary.initial, 30);
  assert.equal(result.secondSummary.initial, 300);
  assert.equal(result.firstSummary.changePercent, 10);
  assert.equal(result.secondSummary.changePercent, 10);
  assert.equal(result.points[0].firstBase, 100);
  assert.ok(Math.abs(result.points[1].firstBase - 110) < 1e-10);
  assert.equal(result.excludedFirst, 1);
  assert.equal(result.excludedSecond, 1);
  assert.equal(result.firstData[0], first.data[1]);
  assert.equal(JSON.stringify([first, second]), before);
});

test("sorts matched dates and returns no comparison for disjoint histories", () => {
  const unordered = history([point("2026-01-03", 3), point("2026-01-01", 1)]);
  const result = compareHistories(unordered, unordered);
  assert.equal(result.start, "2026-01-01");
  assert.equal(result.end, "2026-01-03");
  assert.equal(compareHistories(unordered, history([point("2026-01-02", 2)])), null);
  assert.equal(compareHistories(history([]), unordered), null);
});

test("allows absolute price overlay only for matching currencies and units", () => {
  const data = [point("2026-01-01", 10), point("2026-01-02", 11)];
  assert.equal(compareHistories(history(data), history(data)).comparablePrices, true);
  assert.equal(compareHistories(history(data), history(data, { currency: "USD" })).comparablePrices, false);
  assert.equal(compareHistories(history(data), history(data, { unit: "points" })).comparablePrices, false);
  assert.equal(compareHistories(history(data, { unit: "points" }), history(data, { unit: "points", currency: "USD" })).comparablePrices, false);
});

test("one observation or zero initial close cannot produce a misleading percentage", () => {
  const single = compareHistories(history([point("2026-01-01", 10)]), history([point("2026-01-01", 20)]));
  assert.equal(single.firstSummary.change, null);
  assert.equal(single.firstSummary.changePercent, null);
  assert.equal(single.normalizable, false);
  const zero = history([point("2026-01-01", 0), point("2026-01-02", 1)]);
  const nonzero = history([point("2026-01-01", 10), point("2026-01-02", 11)]);
  const result = compareHistories(zero, nonzero);
  assert.equal(result.firstSummary.changePercent, null);
  assert.equal(result.differencePercentagePoints, null);
  assert.equal(result.normalizable, false);
  assert.ok(result.points.every((item) => item.firstBase === null));
});

test("correlation requires three varying return pairs and stays within bounds", () => {
  const same = history([100, 110, 99, 118.8].map((value, index) => point(`2026-01-0${index + 1}`, value)));
  assert.ok(Math.abs(compareHistories(same, same).correlation - 1) < 1e-10);
  const constant = history([100, 100, 100, 100].map((value, index) => point(`2026-01-0${index + 1}`, value)));
  assert.equal(compareHistories(same, constant).correlation, null);
  assert.equal(compareHistories(history(same.data.slice(0, 3)), history(same.data.slice(0, 3))).correlation, null);
});

test("interval controls share API restrictions and daily labels do not shift timezone", () => {
  assert.deepEqual(comparisonIntervals("5d").map(({ value }) => value), ["1d"]);
  assert.deepEqual(comparisonIntervals("1mo").map(({ value }) => value), ["1d", "1wk"]);
  assert.deepEqual(comparisonIntervals("3mo").map(({ value }) => value), ["1d", "1wk", "1mo"]);
  assert.equal(comparisonDate("2026-01-01"), "01/01/2026");
});
