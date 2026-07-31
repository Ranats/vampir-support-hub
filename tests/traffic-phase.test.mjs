import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReport,
  classifyPageviews,
  currentJstPeriod,
  evaluateTransition,
  parseCliArguments,
  parsePageviews,
  parsePeriod,
  runCli,
} from "../scripts/traffic-phase.mjs";

const AUGUST_2026_JST = new Date("2026-08-01T00:00:00+09:00");

test("classifies every roadmap boundary", () => {
  assert.equal(classifyPageviews(9_999).id, "under-10k");
  assert.equal(classifyPageviews(10_000).id, "10k-50k");
  assert.equal(classifyPageviews(49_999).id, "10k-50k");
  assert.equal(classifyPageviews(50_000).id, "50k-100k");
  assert.equal(classifyPageviews(99_999).id, "50k-100k");
  assert.equal(classifyPageviews(100_000).id, "100k-plus");
});

test("rejects invalid page views and periods", () => {
  for (const value of [-1, "1.5", "abc", ""]) {
    assert.throws(() => parsePageviews(value));
  }
  for (const value of ["2026", "2026-00", "2026-13", "26-07"]) {
    assert.throws(() => parsePeriod(value));
  }
});

test("requires source, period, and page views", () => {
  assert.throws(() => parseCliArguments(["--period", "2026-07"]));
  assert.throws(() =>
    parseCliArguments(["--pageviews", "10000", "--period", "2026-07"]),
  );
  assert.throws(() =>
    parseCliArguments([
      "--pageviews",
      "10000",
      "--source",
      "Cloudflare",
    ]),
  );
});

test("promotes only after two consecutive completed months", () => {
  const oneMonth = evaluateTransition({
    currentStageId: "under-10k",
    records: [{ period: "2026-06", pageviews: 10_000 }],
    asOf: AUGUST_2026_JST,
  });
  assert.equal(oneMonth.action, "hold");

  const consecutiveMonths = evaluateTransition({
    currentStageId: "under-10k",
    records: [
      { period: "2026-06", pageviews: 50_000 },
      { period: "2026-07", pageviews: 55_000 },
    ],
    asOf: AUGUST_2026_JST,
  });
  assert.equal(consecutiveMonths.action, "promote");
  assert.equal(consecutiveMonths.recommendedStage.id, "50k-100k");

  const skippedMonth = evaluateTransition({
    currentStageId: "under-10k",
    records: [
      { period: "2026-05", pageviews: 10_000 },
      { period: "2026-07", pageviews: 12_000 },
    ],
    asOf: AUGUST_2026_JST,
  });
  assert.equal(skippedMonth.action, "hold");
});

test("treats December and January as consecutive completed months", () => {
  const transition = evaluateTransition({
    currentStageId: "under-10k",
    records: [
      { period: "2025-12", pageviews: 10_000 },
      { period: "2026-01", pageviews: 12_000 },
    ],
    asOf: AUGUST_2026_JST,
  });

  assert.equal(transition.action, "promote");
  assert.equal(transition.recommendedStage.id, "10k-50k");
});

test("demotes only after three consecutive months below the current floor", () => {
  const twoMonths = evaluateTransition({
    currentStageId: "50k-100k",
    records: [
      { period: "2026-06", pageviews: 40_000 },
      { period: "2026-07", pageviews: 30_000 },
    ],
    asOf: AUGUST_2026_JST,
  });
  assert.equal(twoMonths.action, "hold");

  const threeMonths = evaluateTransition({
    currentStageId: "50k-100k",
    records: [
      { period: "2026-05", pageviews: 40_000 },
      { period: "2026-06", pageviews: 30_000 },
      { period: "2026-07", pageviews: 20_000 },
    ],
    asOf: AUGUST_2026_JST,
  });
  assert.equal(threeMonths.action, "demote");
  assert.equal(threeMonths.recommendedStage.id, "10k-50k");
});

test("demotes to the highest stage containing all three completed months", () => {
  const transition = evaluateTransition({
    currentStageId: "100k-plus",
    records: [
      { period: "2026-05", pageviews: 60_000 },
      { period: "2026-06", pageviews: 10_000 },
      { period: "2026-07", pageviews: 10_000 },
    ],
    asOf: AUGUST_2026_JST,
  });

  assert.equal(transition.action, "demote");
  assert.equal(transition.recommendedStage.id, "50k-100k");
});

test("rejects unknown stages and duplicate periods", () => {
  assert.throws(() =>
    evaluateTransition({
      currentStageId: "unknown",
      records: [{ period: "2026-07", pageviews: 10_000 }],
      asOf: AUGUST_2026_JST,
    }),
  );
  assert.throws(() =>
    evaluateTransition({
      records: [
        { period: "2026-07", pageviews: 10_000 },
        { period: "2026-07", pageviews: 12_000 },
      ],
      asOf: AUGUST_2026_JST,
    }),
  );
});

test("builds JSON-safe reports without credentials", () => {
  const report = buildReport({
    pageviews: 15_000,
    period: "2026-07",
    source: "Cloudflare Web Analytics",
    history: [{ period: "2026-06", pageviews: 12_000 }],
    currentStageId: "under-10k",
    asOf: AUGUST_2026_JST,
  });

  assert.equal(report.action, "promote");
  assert.equal(report.measuredStage, "10k-50k");
  assert.equal(report.recommendedStage, "10k-50k");
  assert.equal(report.source, "Cloudflare Web Analytics");
});

test("rejects current or future JST months as incomplete", () => {
  assert.equal(currentJstPeriod(AUGUST_2026_JST), "2026-08");
  assert.throws(() =>
    evaluateTransition({
      records: [{ period: "2026-08", pageviews: 10_000 }],
      asOf: AUGUST_2026_JST,
    }),
  );
  assert.throws(() =>
    evaluateTransition({
      records: [{ period: "2099-12", pageviews: 100_000 }],
      asOf: AUGUST_2026_JST,
    }),
  );
});

test("rejects history that is not earlier than the report period", () => {
  assert.throws(() =>
    buildReport({
      pageviews: 15_000,
      period: "2026-06",
      source: "Cloudflare Web Analytics",
      history: [{ period: "2026-07", pageviews: 12_000 }],
      currentStageId: "under-10k",
      asOf: AUGUST_2026_JST,
    }),
  );
});

test("CLI returns JSON on success and a non-zero status on invalid input", () => {
  const successOutput = [];
  const successStatus = runCli(
    [
      "--pageviews",
      "12345",
      "--period",
      "2026-06",
      "--source",
      "Manual",
      "--json",
    ],
    {
      log: (value) => successOutput.push(value),
      error: () => assert.fail("successful CLI call wrote an error"),
    },
  );
  assert.equal(successStatus, 0);
  assert.equal(JSON.parse(successOutput[0]).measuredStage, "10k-50k");

  const errorOutput = [];
  const errorStatus = runCli(
    ["--pageviews", "-1", "--period", "2026-06", "--source", "Manual"],
    {
      log: () => assert.fail("invalid CLI call wrote normal output"),
      error: (value) => errorOutput.push(value),
    },
  );
  assert.equal(errorStatus, 1);
  assert.match(errorOutput[0], /non-negative integer/);
});
