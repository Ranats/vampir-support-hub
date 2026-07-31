import { pathToFileURL } from "node:url";

export const TRAFFIC_STAGES = Object.freeze([
  Object.freeze({
    id: "under-10k",
    label: "0〜9,999 PV",
    min: 0,
    max: 9_999,
  }),
  Object.freeze({
    id: "10k-50k",
    label: "10,000〜49,999 PV",
    min: 10_000,
    max: 49_999,
  }),
  Object.freeze({
    id: "50k-100k",
    label: "50,000〜99,999 PV",
    min: 50_000,
    max: 99_999,
  }),
  Object.freeze({
    id: "100k-plus",
    label: "100,000 PV以上",
    min: 100_000,
    max: Number.POSITIVE_INFINITY,
  }),
]);

const HELP = `Usage:
  npm run traffic:phase -- --pageviews <integer> --period <YYYY-MM> --source <name>
    [--history <YYYY-MM:pageviews>]... [--current-stage <stage-id>] [--json]

Stage IDs: ${TRAFFIC_STAGES.map((stage) => stage.id).join(", ")}
`;

export function parsePageviews(value) {
  if (!/^\d+$/.test(String(value))) {
    throw new Error("pageviews must be a non-negative integer");
  }

  const pageviews = Number(value);
  if (!Number.isSafeInteger(pageviews)) {
    throw new Error("pageviews must be a safe integer");
  }

  return pageviews;
}

export function parsePeriod(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value));
  if (!match) {
    throw new Error("period must use YYYY-MM");
  }

  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new Error("period month must be between 01 and 12");
  }

  return `${match[1]}-${match[2]}`;
}

export function classifyPageviews(pageviews) {
  const validatedPageviews = parsePageviews(pageviews);
  return TRAFFIC_STAGES.find((stage) => validatedPageviews <= stage.max);
}

export function parseHistoryEntry(value) {
  const separator = String(value).lastIndexOf(":");
  if (separator === -1) {
    throw new Error("history must use YYYY-MM:pageviews");
  }

  return {
    period: parsePeriod(String(value).slice(0, separator)),
    pageviews: parsePageviews(String(value).slice(separator + 1)),
  };
}

function periodIndex(period) {
  const [year, month] = period.split("-").map(Number);
  return year * 12 + month - 1;
}

export function currentJstPeriod(now = new Date()) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error("as-of time must be a valid Date");
  }

  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1_000);
  return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function normalizeRecords(records) {
  const byPeriod = new Map();

  for (const record of records) {
    const period = parsePeriod(record.period);
    if (byPeriod.has(period)) {
      throw new Error(`duplicate period: ${period}`);
    }

    byPeriod.set(period, {
      period,
      pageviews: parsePageviews(record.pageviews),
    });
  }

  return [...byPeriod.values()].sort(
    (left, right) => periodIndex(left.period) - periodIndex(right.period),
  );
}

export function areConsecutiveMonths(records) {
  return records.every(
    (record, index) =>
      index === 0 ||
      periodIndex(record.period) === periodIndex(records[index - 1].period) + 1,
  );
}

export function assertCompletedRecords(records, asOf = new Date()) {
  const currentPeriodIndex = periodIndex(currentJstPeriod(asOf));

  for (const record of records) {
    if (periodIndex(record.period) >= currentPeriodIndex) {
      throw new Error(
        `period must be a completed JST month before ${currentJstPeriod(asOf)}: ${record.period}`,
      );
    }
  }
}

export function evaluateTransition({
  currentStageId,
  records,
  asOf = new Date(),
}) {
  const normalizedRecords = normalizeRecords(records);
  if (normalizedRecords.length === 0) {
    throw new Error("at least one completed monthly record is required");
  }
  assertCompletedRecords(normalizedRecords, asOf);

  const latest = normalizedRecords.at(-1);
  const measuredStage = classifyPageviews(latest.pageviews);

  if (!currentStageId) {
    return {
      action: "baseline",
      currentStage: null,
      measuredStage,
      recommendedStage: measuredStage,
      reason:
        "No current stage was supplied; this is a measured baseline, not a promotion decision.",
    };
  }

  const currentIndex = TRAFFIC_STAGES.findIndex(
    (stage) => stage.id === currentStageId,
  );
  if (currentIndex === -1) {
    throw new Error(`unknown current stage: ${currentStageId}`);
  }

  const currentStage = TRAFFIC_STAGES[currentIndex];
  const lastTwo = normalizedRecords.slice(-2);
  if (lastTwo.length === 2 && areConsecutiveMonths(lastTwo)) {
    const promotionIndex = TRAFFIC_STAGES.findLastIndex(
      (stage, stageIndex) =>
        stageIndex > currentIndex &&
        lastTwo.every((record) => record.pageviews >= stage.min),
    );

    if (promotionIndex !== -1) {
      return {
        action: "promote",
        currentStage,
        measuredStage,
        recommendedStage: TRAFFIC_STAGES[promotionIndex],
        reason: `Two consecutive completed months met the ${TRAFFIC_STAGES[promotionIndex].min.toLocaleString("en-US")} PV threshold.`,
      };
    }
  }

  const lastThree = normalizedRecords.slice(-3);
  if (
    currentIndex > 0 &&
    lastThree.length === 3 &&
    areConsecutiveMonths(lastThree) &&
    lastThree.every((record) => record.pageviews < currentStage.min)
  ) {
    const highestPageviews = Math.max(
      ...lastThree.map((record) => record.pageviews),
    );
    const recommendedStage = classifyPageviews(highestPageviews);

    return {
      action: "demote",
      currentStage,
      measuredStage,
      recommendedStage,
      reason: `Three consecutive completed months were below the current ${currentStage.min.toLocaleString("en-US")} PV floor.`,
    };
  }

  return {
    action: "hold",
    currentStage,
    measuredStage,
    recommendedStage: currentStage,
    reason:
      "The two-month promotion or three-month demotion rule has not been met.",
  };
}

export function parseCliArguments(argv) {
  const options = {
    history: [],
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--json") {
      options.json = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} requires a value`);
    }
    index += 1;

    if (argument === "--pageviews") {
      options.pageviews = parsePageviews(value);
    } else if (argument === "--period") {
      options.period = parsePeriod(value);
    } else if (argument === "--source") {
      options.source = value.trim();
    } else if (argument === "--history") {
      options.history.push(parseHistoryEntry(value));
    } else if (argument === "--current-stage") {
      options.currentStageId = value;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }

  if (options.help) {
    return options;
  }
  if (options.pageviews === undefined) {
    throw new Error("--pageviews is required");
  }
  if (!options.period) {
    throw new Error("--period is required");
  }
  if (!options.source) {
    throw new Error("--source is required");
  }

  return options;
}

export function buildReport(options) {
  for (const historyRecord of options.history) {
    if (periodIndex(historyRecord.period) >= periodIndex(options.period)) {
      throw new Error(
        `history period must be earlier than the report period: ${historyRecord.period}`,
      );
    }
  }

  const records = normalizeRecords([
    ...options.history,
    {
      period: options.period,
      pageviews: options.pageviews,
    },
  ]);
  const transition = evaluateTransition({
    currentStageId: options.currentStageId,
    records,
    asOf: options.asOf,
  });

  return {
    source: options.source,
    period: options.period,
    pageviews: options.pageviews,
    records,
    action: transition.action,
    currentStage: transition.currentStage?.id ?? null,
    measuredStage: transition.measuredStage.id,
    recommendedStage: transition.recommendedStage.id,
    reason: transition.reason,
  };
}

export function formatHumanReport(report) {
  const stage = TRAFFIC_STAGES.find(
    (candidate) => candidate.id === report.measuredStage,
  );
  const recommended = TRAFFIC_STAGES.find(
    (candidate) => candidate.id === report.recommendedStage,
  );

  return [
    `Source: ${report.source}`,
    `Period: ${report.period}`,
    `Page views: ${report.pageviews.toLocaleString("en-US")}`,
    `Measured stage: ${stage.label} (${stage.id})`,
    `Decision: ${report.action}`,
    `Recommended stage: ${recommended.label} (${recommended.id})`,
    `Reason: ${report.reason}`,
  ].join("\n");
}

export function runCli(argv, io = console) {
  try {
    const options = parseCliArguments(argv);
    if (options.help) {
      io.log(HELP);
      return 0;
    }

    const report = buildReport(options);
    io.log(
      options.json
        ? JSON.stringify(report, null, 2)
        : formatHumanReport(report),
    );
    return 0;
  } catch (error) {
    io.error(`Error: ${error.message}\n\n${HELP}`);
    return 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runCli(process.argv.slice(2));
}
