import assert from "node:assert/strict";
import test from "node:test";
import SlenderCandles from "../src/components/charts/SlenderCandles.ts";

const candle = (overrides = {}) => ({
  time: "2026-11-02", open: 10, high: 16, low: 8, close: 12, ...overrides,
});
const toCoordinate = (price) => 200 - price * 5;

function rendererData({ spacing = 40, count = 3, point = candle(), visibleRange = { from: 0, to: count } } = {}) {
  return {
    barSpacing: spacing,
    conflationFactor: 1,
    visibleRange,
    bars: Array.from({ length: count }, (_, index) => ({
      x: 20 + index * spacing,
      time: index,
      originalData: point,
      barColor: index % 2 === 0 ? "#089981" : "#f23645",
    })),
  };
}

function draw(view, pixelRatio = 1, convert = toCoordinate) {
  const rectangles = [];
  const context = {
    fillStyle: "",
    fillRect(x, y, width, height) {
      rectangles.push({ x, y, width, height, color: this.fillStyle });
    },
  };
  view.renderer().draw({
    useBitmapCoordinateSpace(callback) {
      callback({ context, horizontalPixelRatio: pixelRatio, verticalPixelRatio: pixelRatio });
    },
  }, convert, false);
  return rectangles;
}

test("sparse histories and fullscreen spacing keep narrow, sharp candles at every display density", () => {
  for (const pixelRatio of [1, 1.25, 2]) {
    for (const spacing of [12, 40, 200]) {
      const view = new SlenderCandles();
      const data = rendererData({ spacing });
      const before = JSON.stringify(data);
      view.update(data);
      const rectangles = draw(view, pixelRatio);

      assert.ok(rectangles.length > 0);
      for (const rectangle of rectangles) {
        assert.ok(rectangle.width > 0 && rectangle.width <= 7 * pixelRatio, "candle width must stay within 7 CSS pixels");
        assert.ok(rectangle.height > 0);
        assert.ok([rectangle.x, rectangle.y, rectangle.width, rectangle.height].every(Number.isInteger), "bitmap edges must stay crisp");
        assert.ok(data.bars.some((bar) => Math.round(bar.x * pixelRatio) === rectangle.x + Math.floor(rectangle.width / 2)), "narrow bodies must stay on their original time coordinate");
      }
      assert.equal(JSON.stringify(data), before, "rendering must not change prices or time spacing");
      assert.ok(rectangles.some((rectangle) => rectangle.color === "#089981"));
      assert.ok(rectangles.some((rectangle) => rectangle.color === "#f23645"));
    }
  }
});

test("zoomed-out candle bodies shrink to avoid overlap", () => {
  for (const pixelRatio of [1, 1.25, 2]) {
    for (const spacing of [1, 2, 3, 6]) {
      const view = new SlenderCandles();
      view.update(rendererData({ spacing }));
      const bodyTop = Math.round(toCoordinate(12) * pixelRatio);
      const bodies = draw(view, pixelRatio).filter((rectangle) => rectangle.y === bodyTop);
      assert.equal(bodies.length, 3);
      for (let index = 1; index < bodies.length; index += 1) {
        assert.ok(bodies[index - 1].x + bodies[index - 1].width <= bodies[index].x, "adjacent sessions must remain visually separate");
      }
    }
  }
});

test("doji candles remain visible and retain their full high-low wick", () => {
  const view = new SlenderCandles();
  view.update(rendererData({ count: 1, point: candle({ open: 0, close: 0, high: 2, low: -2 }) }));
  for (const pixelRatio of [1, 2]) {
    const rectangles = draw(view, pixelRatio);
    assert.ok(rectangles.some((rectangle) => rectangle.y === 200 * pixelRatio && rectangle.height >= 1), "an unchanged price must have a visible body");
    assert.ok(rectangles.some((rectangle) => rectangle.y <= 190 * pixelRatio && rectangle.y + rectangle.height > 210 * pixelRatio), "the wick must include both extrema");
  }
});

test("autoscale includes the real extrema and the price line uses the closing value", () => {
  const view = new SlenderCandles();
  const point = candle({ low: -8, high: 19, open: 0, close: 4 });
  const prices = view.priceValueBuilder(point);
  assert.equal(Math.min(...prices), point.low);
  assert.equal(Math.max(...prices), point.high);
  assert.equal(prices.at(-1), point.close);
  assert.equal(view.isWhitespace(point), false, "zero opening prices are valid");
  assert.equal(view.isWhitespace({ time: point.time }), true);
  assert.equal(view.isWhitespace({ time: point.time, open: 0 }), true);
});

test("only visible sessions are drawn and unavailable coordinates are skipped", () => {
  const view = new SlenderCandles();
  assert.deepEqual(draw(view), []);
  const data = rendererData({ visibleRange: { from: 1, to: 2 } });
  view.update(data);
  const rectangles = draw(view);
  assert.ok(rectangles.length > 0);
  assert.ok(rectangles.every((rectangle) => rectangle.x + Math.floor(rectangle.width / 2) === data.bars[1].x));
  assert.deepEqual(draw(view, 1, (price) => price === 16 ? null : toCoordinate(price)), []);
  view.update({ ...data, visibleRange: null });
  assert.deepEqual(draw(view), []);
});
