export type SourceAuthority = "official" | "supplementary";
export type LocalizedLabel = { ja: string; en: string };

export type GameContentSource = {
  id: string;
  url: string;
  authority: SourceAuthority;
  label: LocalizedLabel;
};

export type SpawnEvent = {
  id: string;
  title: string;
  hour: number;
  minute: number;
  days?: readonly number[];
  minLevel?: number;
  label: string;
  sourceIds: readonly string[];
  verifiedAt: string;
};

export type Routine = {
  id: string;
  title: string;
  note: string;
  priority: number;
  minLevel?: number;
  unlock?: string;
  custom?: boolean;
  sourceIds: readonly string[];
  verifiedAt: string;
};

export type EventObjective = {
  id: string;
  metricId?: string;
  title: string;
  titleEn: string;
  action: string;
  actionEn: string;
  kind: "check" | "count";
  target?: number;
  unit?: string;
  unitEn?: string;
  cadence: "once" | "daily" | "weekly";
};

export type EventMilestone = {
  id: string;
  label: string;
  labelEn: string;
  deadline: Date;
};

export type LimitedEvent = {
  id: string;
  campaignId: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  deadline: Date;
  detailsUrl: string;
  milestones: readonly EventMilestone[];
  objectives: readonly EventObjective[];
  sourceIds: readonly string[];
  verifiedAt: string;
};

export type GameContentDefinition = {
  sources: readonly GameContentSource[];
  spawnEvents: readonly SpawnEvent[];
  dailyTasks: readonly Routine[];
  weeklyTasks: readonly Routine[];
  limitedEvents: readonly LimitedEvent[];
};

const BASE_VERIFIED_AT = "2026-07-30T00:00:00+09:00";
const EVENT_VERIFIED_AT = "2026-08-14T00:00:00+09:00";
export const STALE_AFTER_DAYS = 14;

export const GAME_CONTENT_SOURCES = [
  { id: "official", url: "https://vampirjp.netmarble.com/landing", authority: "official", label: { ja: "VAMPIR 公式サイト", en: "Official VAMPIR site (Japanese)" } },
  { id: "routines", url: "https://gamewith.jp/vampir/567160", authority: "supplementary", label: { ja: "日課・週課・クラン概要（日本語解説）", en: "Daily, weekly, and clan overview (Japanese)" } },
  { id: "clan-official", url: "https://guide.netmarble.com/thered/110", authority: "official", label: { ja: "クラン機能 公式ガイド（韓国語）", en: "Official clan feature guide (Korean)" } },
  { id: "gehenna", url: "https://gamewith.jp/vampir/569771", authority: "supplementary", label: { ja: "ゲヘナ時刻", en: "Gehenna schedule (Japanese)" } },
  { id: "events", url: "https://gamewith.jp/vampir/567177", authority: "supplementary", label: { ja: "イベント一覧（補足）", en: "Event list (Japanese, supplementary)" } },
  { id: "event-overview", url: "https://forum.netmarble.com/vampir_jp/view/20/233", authority: "official", label: { ja: "開催中イベント 公式一覧", en: "Official active-event list" } },
  { id: "event-sigil", url: "https://forum.netmarble.com/vampir_jp/view/20/227", authority: "official", label: { ja: "シギルのレッドムーン闇取引シーズン", en: "Sigil Red Moon Dark Trade Season" } },
  { id: "event-sigil-support", url: "https://forum.netmarble.com/vampir_jp/view/20/228", authority: "official", label: { ja: "シギルのレッドムーン闇取引支援", en: "Sigil Red Moon Dark Trade Support" } },
  { id: "event-bloodline", url: "https://forum.netmarble.com/vampir_jp/view/20/229", authority: "official", label: { ja: "血界進化ペイバック", en: "Bloodline Evolution Payback" } },
  { id: "event-seven-day-growth", url: "https://forum.netmarble.com/vampir_jp/view/20/199", authority: "official", label: { ja: "レッドムーン前夜祭 7日の成長支援", en: "Red Moon Eve 7-Day Growth Support" } },
  { id: "event-100-day", url: "https://forum.netmarble.com/vampir_jp/view/20/201", authority: "official", label: { ja: "100日間の成長達成ミッション", en: "100-Day Growth Mission" } },
  { id: "event-commandments", url: "https://forum.netmarble.com/vampir_jp/view/20/202", authority: "official", label: { ja: "掟支援ペイバック", en: "Commandment Support Payback" } },
  { id: "event-red-login", url: "https://forum.netmarble.com/vampir_jp/view/20/79", authority: "official", label: { ja: "レッドムーン前夜祭ログイン", en: "Red Moon Eve Login" } },
  { id: "event-double-daily", url: "https://forum.netmarble.com/vampir_jp/view/20/80", authority: "official", label: { ja: "デイリークエスト報酬2倍UP", en: "Daily Quest Double Rewards" } },
  { id: "event-special-login", url: "https://forum.netmarble.com/vampir_jp/view/20/62", authority: "official", label: { ja: "リリース記念特別ログイン", en: "Launch Special Login" } },
  { id: "event-basic-growth", url: "https://forum.netmarble.com/vampir_jp/view/20/66", authority: "official", label: { ja: "ヴァンパイア基礎成長支援", en: "Vampire Basic Growth Support" } },
  { id: "event-release-growth", url: "https://forum.netmarble.com/vampir_jp/view/20/63", authority: "official", label: { ja: "リリース記念成長支援", en: "Launch Growth Support" } },
  { id: "event-summon-mission", url: "https://forum.netmarble.com/vampir_jp/view/20/64", authority: "official", label: { ja: "リリース記念召喚ミッション", en: "Launch Summon Mission" } },
  { id: "event-summon-ranking", url: "https://forum.netmarble.com/vampir_jp/view/20/65", authority: "official", label: { ja: "リリース記念召喚ランキング", en: "Launch Summon Ranking" } },
] as const satisfies readonly GameContentSource[];

export const SPAWN_EVENTS = [
  { id: "world-noon", title: "ワールドボス", hour: 12, minute: 0, label: "毎日", sourceIds: ["routines"], verifiedAt: BASE_VERIFIED_AT },
  { id: "gehenna-13", title: "ゲヘナ ★1・★2", hour: 13, minute: 0, minLevel: 52, label: "毎日", sourceIds: ["gehenna"], verifiedAt: BASE_VERIFIED_AT },
  { id: "gehenna-17", title: "ゲヘナ ★1", hour: 17, minute: 0, minLevel: 52, label: "毎日", sourceIds: ["gehenna"], verifiedAt: BASE_VERIFIED_AT },
  { id: "world-night", title: "ワールドボス", hour: 20, minute: 0, label: "毎日", sourceIds: ["routines"], verifiedAt: BASE_VERIFIED_AT },
  { id: "gehenna-21", title: "ゲヘナ ★1・★2", hour: 21, minute: 0, minLevel: 52, label: "毎日", sourceIds: ["gehenna"], verifiedAt: BASE_VERIFIED_AT },
  { id: "gehenna-sat-22", title: "ゲヘナ ★3", hour: 22, minute: 0, days: [6], minLevel: 64, label: "土曜", sourceIds: ["gehenna"], verifiedAt: BASE_VERIFIED_AT },
] as const satisfies readonly SpawnEvent[];

export const DAILY_TASKS = [
  { id: "daily-quest", title: "デイリークエスト 10件", note: "オルガの恩寵がある場合は12件", priority: 5, unlock: "解放：エピソード1 act3-101", sourceIds: ["routines"], verifiedAt: BASE_VERIFIED_AT },
  { id: "creation-abyss", title: "創造の深淵 1時間", note: "1日最大1時間", priority: 5, minLevel: 32, sourceIds: ["routines"], verifiedAt: BASE_VERIFIED_AT },
  { id: "faded-legacy", title: "褪せた遺産 1時間", note: "1日最大1時間", priority: 5, minLevel: 34, sourceIds: ["routines"], verifiedAt: BASE_VERIFIED_AT },
  { id: "death-recovery", title: "戦闘不能ペナルティを確認", note: "発生した日に確認。24時間以内、最初の5回は無料", priority: 4, sourceIds: ["routines"], verifiedAt: BASE_VERIFIED_AT },
  { id: "gold-shop", title: "ゴールド交換を確認", note: "ゴールドに余裕がある場合", priority: 3, sourceIds: ["routines"], verifiedAt: BASE_VERIFIED_AT },
] as const satisfies readonly Routine[];

export const WEEKLY_TASKS = [
  { id: "epic-dungeon", title: "エピックダンジョン 3回", note: "週3回まで無料入場", priority: 5, unlock: "解放：対応エピソードの進行", sourceIds: ["routines"], verifiedAt: BASE_VERIFIED_AT },
  { id: "ancient-workshop", title: "古代の工房 8時間", note: "1週間で最大8時間", priority: 5, minLevel: 41, sourceIds: ["routines"], verifiedAt: BASE_VERIFIED_AT },
  { id: "dark-trade", title: "闇取引を確認", note: "対象アイテムと交換上限は毎週更新", priority: 5, minLevel: 38, sourceIds: ["routines"], verifiedAt: BASE_VERIFIED_AT },
  { id: "clan-mission", title: "クラン任務を確認", note: "クラン加入・クランLv3以上が対象", priority: 4, sourceIds: ["routines", "clan-official"], verifiedAt: BASE_VERIFIED_AT },
  { id: "clan-guard", title: "クラン守護を確認", note: "クラン加入・クランLv3以上が対象", priority: 4, sourceIds: ["routines", "clan-official"], verifiedAt: BASE_VERIFIED_AT },
  { id: "farm-diamond", title: "ファームダイヤ 1,000", note: "通常の週間上限。恩寵がある場合は2,000", priority: 4, sourceIds: ["routines"], verifiedAt: BASE_VERIFIED_AT },
  { id: "gehenna-weekly", title: "ゲヘナ週間ポイントを確認", note: "現在のポイントと交換予定を確認", priority: 3, minLevel: 52, sourceIds: ["gehenna"], verifiedAt: BASE_VERIFIED_AT },
] as const satisfies readonly Routine[];

const at = (iso: string) => new Date(iso);
const eventEnd0819 = at("2026-08-18T19:59:00.000Z");
const eventEnd0826 = at("2026-08-25T19:59:00.000Z");
const eventEnd0826Collection = at("2026-08-25T22:59:00.000Z");
const eventEnd0916 = at("2026-09-15T19:59:00.000Z");

function missionCount(
  id: string,
  title: string,
  titleEn: string,
  target: number,
  unit: string,
  unitEn: string,
  metricId?: string,
): EventObjective {
  const jaGoal = unit === "Lv" ? `Lv${target.toLocaleString()}` : `${target.toLocaleString()}${unit}`;
  const enGoal = unitEn === "Lv" ? `Lv${target.toLocaleString()}` : `${target.toLocaleString()}${unitEn}`;
  return {
    id,
    metricId,
    title,
    titleEn,
    action: `${jaGoal}を達成し、イベント画面で報酬を受け取る`,
    actionEn: `Reach ${enGoal}, then claim the reward on the event screen`,
    kind: "count",
    target,
    unit,
    unitEn,
    cadence: "once",
  };
}

export const LIMITED_EVENTS = [
  {
    id: "sigil-red-moon", campaignId: "sigil-red-moon-2026-08", title: "シギルのレッドムーン闇取引シーズン", titleEn: "Sigil Red Moon Dark Trade Season",
    summary: "狩りとワールドボスでイベント装備を集め、強化して闇取引します。", summaryEn: "Collect event gear from hunting and World Bosses, enhance it, then use Dark Trade.",
    deadline: eventEnd0826, detailsUrl: "https://forum.netmarble.com/vampir_jp/view/20/227",
    milestones: [
      { id: "drops-end", label: "フィールド・ゲヘナのドロップ終了", labelEn: "Field and Gehenna drops end", deadline: eventEnd0819 },
      { id: "trade-end", label: "ワールドボス獲得・闇取引・箱使用終了", labelEn: "World Boss rewards, trade, and box use end", deadline: eventEnd0826 },
    ],
    objectives: [
      { id: "collect-gear", title: "イベント装備を集める", titleEn: "Collect event gear", action: "フィールド・ゲヘナで狩りをする", actionEn: "Hunt in the field or Gehenna", kind: "check", cadence: "once" },
      { id: "world-boss", title: "ワールドボス報酬を受け取る", titleEn: "Claim World Boss gear", action: "開催時刻にワールドボスを討伐する", actionEn: "Defeat a World Boss at its scheduled time", kind: "check", cadence: "once" },
      { id: "dark-trade", title: "闇取引を進める", titleEn: "Use Dark Trade", action: "装備を強化し、レッドムーンの宝箱へ交換する", actionEn: "Enhance gear and exchange it for Red Moon boxes", kind: "check", cadence: "once" },
      { id: "use-boxes", title: "イベント箱を使用する", titleEn: "Use event boxes", action: "8月26日04:59までに残った箱を開封する", actionEn: "Open remaining boxes before Aug 26 at 04:59 JST", kind: "check", cadence: "once" },
    ], sourceIds: ["event-sigil", "event-overview"], verifiedAt: EVENT_VERIFIED_AT,
  },
  {
    id: "sigil-red-moon-support", campaignId: "sigil-red-moon-support-2026-08", title: "シギルのレッドムーン闇取引支援", titleEn: "Sigil Red Moon Dark Trade Support",
    summary: "討伐・製作の累積ミッションを進めます。", summaryEn: "Advance cumulative hunt and crafting missions.", deadline: eventEnd0826,
    detailsUrl: "https://forum.netmarble.com/vampir_jp/view/20/228", milestones: [{ id: "event-end", label: "ミッション・報酬受取終了", labelEn: "Missions and reward claims end", deadline: eventEnd0826 }],
    objectives: [
      { id: "monsters", title: "モンスター討伐", titleEn: "Monsters defeated", action: "30,000・60,000・90,000体の報酬を順に受け取る", actionEn: "Claim rewards at 30,000, 60,000, and 90,000", kind: "count", target: 90000, unit: "体", unitEn: "", cadence: "once" },
      { id: "world-bosses", title: "ワールドボス討伐", titleEn: "World Bosses defeated", action: "8・16・24回の報酬を順に受け取る", actionEn: "Claim rewards at 8, 16, and 24", kind: "count", target: 24, unit: "回", unitEn: "", cadence: "once" },
      { id: "crafting", title: "アイテム製作", titleEn: "Items crafted", action: "30・60・120回の報酬を順に受け取る", actionEn: "Claim rewards at 30, 60, and 120", kind: "count", target: 120, unit: "回", unitEn: "", cadence: "once" },
      { id: "claim-all", title: "全達成報酬を受け取る", titleEn: "Claim the all-missions reward", action: "イベント画面で高貴なレッドムーンの宝箱を受け取る", actionEn: "Claim the Noble Red Moon Box from the event screen", kind: "check", cadence: "once" },
    ], sourceIds: ["event-sigil-support", "event-overview"], verifiedAt: EVENT_VERIFIED_AT,
  },
  {
    id: "bloodline-payback", campaignId: "bloodline-payback-2026-08", title: "血界進化ペイバック", titleEn: "Bloodline Evolution Payback",
    summary: "進化石の累積使用数に応じた報酬を受け取ります。", summaryEn: "Claim rewards based on cumulative Evolution Stones spent.", deadline: eventEnd0826,
    detailsUrl: "https://forum.netmarble.com/vampir_jp/view/20/229", milestones: [{ id: "event-end", label: "ミッション・報酬受取終了", labelEn: "Missions and reward claims end", deadline: eventEnd0826 }],
    objectives: [{ id: "stones", title: "進化石を使用", titleEn: "Evolution Stones spent", action: "30・50・70・100・150・200・250・300・400個の報酬を確認する", actionEn: "Check rewards at 30, 50, 70, 100, 150, 200, 250, 300, and 400", kind: "count", target: 400, unit: "個", unitEn: "", cadence: "once" }],
    sourceIds: ["event-bloodline", "event-overview"], verifiedAt: EVENT_VERIFIED_AT,
  },
  {
    id: "seven-day-growth", campaignId: "seven-day-growth-2026-08", title: "レッドムーン前夜祭 7日の成長支援", titleEn: "Red Moon Eve 7-Day Growth Support",
    summary: "35個の個別ミッションを確認し、証と銀貨を期限内に使います。", summaryEn: "Track all 35 missions and spend Growth Tokens and Coins before they expire.", deadline: eventEnd0826Collection,
    detailsUrl: "https://forum.netmarble.com/vampir_jp/view/20/199",
    milestones: [
      { id: "missions-end", label: "ミッション終了", labelEn: "Missions end", deadline: eventEnd0819 },
      { id: "craft-end", label: "レッドムーン銀貨の製作終了", labelEn: "Red Moon Coin crafting ends", deadline: eventEnd0826 },
      { id: "collection-end", label: "成長の証コレクション終了", labelEn: "Growth Token collection ends", deadline: eventEnd0826Collection },
    ],
    objectives: [
      missionCount("day-1-daily", "1日目：デイリークエスト", "Day 1: Daily Quests", 10, "回", " times"),
      missionCount("day-1-monsters", "1日目：モンスター討伐", "Day 1: Monsters defeated", 10_000, "体", " monsters"),
      missionCount("day-1-creation", "1日目：創造の深淵", "Day 1: Abyss of Creation monsters", 3_000, "体", " monsters"),
      missionCount("day-1-legacy", "1日目：褪せた遺産", "Day 1: Faded Legacy monsters", 3_000, "体", " monsters"),
      missionCount("day-1-donations", "1日目：クラン寄付", "Day 1: Clan donations", 3, "回", " times"),
      missionCount("day-2-forms", "2日目：形象獲得", "Day 2: Forms acquired", 20, "回", " times"),
      missionCount("day-2-mounts", "2日目：乗騎獲得", "Day 2: Mounts acquired", 20, "回", " times"),
      missionCount("day-2-gold-1500", "2日目：ゴールド消費①", "Day 2: Gold spent I", 1_500_000, "個", " Gold", "day-2-gold"),
      missionCount("day-2-gold-3000", "2日目：ゴールド消費②", "Day 2: Gold spent II", 3_000_000, "個", " Gold", "day-2-gold"),
      missionCount("day-2-world-bosses", "2日目：ワールドボス討伐", "Day 2: World Bosses defeated", 8, "回", " times"),
      missionCount("day-3-eternal-1000", "3日目：永遠のコイン使用①", "Day 3: Eternal Coins spent I", 1_000, "個", " coins", "day-3-eternal"),
      missionCount("day-3-eternal-2000", "3日目：永遠のコイン使用②", "Day 3: Eternal Coins spent II", 2_000, "個", " coins", "day-3-eternal"),
      missionCount("day-3-eternal-3000", "3日目：永遠のコイン使用③", "Day 3: Eternal Coins spent III", 3_000, "個", " coins", "day-3-eternal"),
      missionCount("day-3-enhance", "3日目：装備強化", "Day 3: Gear enhancements", 150, "回", " times"),
      missionCount("day-3-dismantle", "3日目：装備分解", "Day 3: Gear dismantles", 150, "回", " times"),
      missionCount("day-4-daily-10", "4日目：デイリークエスト①", "Day 4: Daily Quests I", 10, "回", " times", "day-4-daily"),
      missionCount("day-4-daily-20", "4日目：デイリークエスト②", "Day 4: Daily Quests II", 20, "回", " times", "day-4-daily"),
      missionCount("day-4-daily-30", "4日目：デイリークエスト③", "Day 4: Daily Quests III", 30, "回", " times", "day-4-daily"),
      missionCount("day-4-daily-40", "4日目：デイリークエスト④", "Day 4: Daily Quests IV", 40, "回", " times", "day-4-daily"),
      missionCount("day-4-monsters", "4日目：モンスター討伐", "Day 4: Monsters defeated", 13_000, "体", " monsters"),
      missionCount("day-5-trinity", "5日目：トリニティ消費", "Day 5: Trinity spent", 500, "個", " Trinity"),
      missionCount("day-5-crafting", "5日目：装備細工", "Day 5: Gear crafting", 10, "回", " times"),
      missionCount("day-5-creation", "5日目：創造の深淵", "Day 5: Abyss of Creation monsters", 6_000, "体", " monsters"),
      missionCount("day-5-legacy", "5日目：褪せた遺産", "Day 5: Faded Legacy monsters", 6_000, "体", " monsters"),
      missionCount("day-5-gehenna", "5日目：ゲヘナ", "Day 5: Gehenna monsters", 1_000, "体", " monsters"),
      missionCount("day-6-trade-20", "6日目：闇取引交換①", "Day 6: Dark Trades I", 20, "回", " times", "day-6-trades"),
      missionCount("day-6-trade-40", "6日目：闇取引交換②", "Day 6: Dark Trades II", 40, "回", " times", "day-6-trades"),
      missionCount("day-6-farm", "6日目：ファームダイヤ獲得", "Day 6: Farm Diamonds acquired", 1_000, "個", " Diamonds"),
      missionCount("day-6-diamonds", "6日目：ダイヤ消費（取引所対象外）", "Day 6: Diamonds spent (market excluded)", 1_000, "個", " Diamonds"),
      missionCount("day-6-epic", "6日目：エピックダンジョン", "Day 6: Epic Dungeon clears", 3, "回", " times"),
      missionCount("day-7-monsters", "7日目：モンスター討伐", "Day 7: Monsters defeated", 30_000, "体", " monsters"),
      missionCount("day-7-enhance", "7日目：装備強化", "Day 7: Gear enhancements", 150, "回", " times"),
      missionCount("day-7-dismantle", "7日目：装備分解", "Day 7: Gear dismantles", 150, "回", " times"),
      missionCount("day-7-donations", "7日目：クラン寄付", "Day 7: Clan donations", 3, "回", " times"),
      missionCount("day-7-world-bosses", "7日目：ワールドボス討伐", "Day 7: World Bosses defeated", 8, "回", " times"),
      { id: "spend-coins", title: "レッドムーン銀貨を使う", titleEn: "Spend Red Moon Coins", action: "8月26日04:59までにイベント製作を完了する", actionEn: "Finish event crafting before Aug 26 at 04:59 JST", kind: "check", cadence: "once" },
      { id: "register-tokens", title: "レッドムーン成長の証を登録", titleEn: "Register Red Moon Growth Tokens", action: "8月26日07:59までにイベントコレクションへ登録する", actionEn: "Register tokens in the event collection before Aug 26 at 07:59 JST", kind: "check", cadence: "once" },
    ], sourceIds: ["event-seven-day-growth", "event-overview"], verifiedAt: EVENT_VERIFIED_AT,
  },
  {
    id: "red-moon-login", campaignId: "red-moon-login-2026-07", title: "レッドムーン前夜祭ログイン", titleEn: "Red Moon Eve Login",
    summary: "累計ログイン報酬とコイン製作を確認します。", summaryEn: "Track cumulative login rewards and coin crafting.", deadline: eventEnd0819,
    detailsUrl: "https://forum.netmarble.com/vampir_jp/view/20/79", milestones: [{ id: "event-end", label: "ログイン・箱使用・コイン製作終了", labelEn: "Login, box use, and coin crafting end", deadline: eventEnd0819 }],
    objectives: [
      { id: "login-days", title: "累計ログイン", titleEn: "Cumulative login days", action: "毎日05:00以降にログインして報酬を受け取る", actionEn: "Log in after each 05:00 JST reset and claim the reward", kind: "count", target: 21, unit: "日", unitEn: " days", cadence: "once" },
      { id: "spend-coins", title: "前夜祭コインを使う", titleEn: "Spend Eve Festival Coins", action: "期限までにコスチュームなどを製作する", actionEn: "Craft the costume and other items before the deadline", kind: "check", cadence: "once" },
    ], sourceIds: ["event-red-login", "event-overview"], verifiedAt: EVENT_VERIFIED_AT,
  },
  {
    id: "daily-double", campaignId: "daily-double-2026-07", title: "デイリークエスト報酬2倍UP", titleEn: "Daily Quest Double Rewards",
    summary: "毎日のデイリークエスト基本報酬が2倍になります。", summaryEn: "Base rewards from Daily Quests are doubled each day.", deadline: eventEnd0826,
    detailsUrl: "https://forum.netmarble.com/vampir_jp/view/20/80", milestones: [{ id: "event-end", label: "報酬2倍終了", labelEn: "Double rewards end", deadline: eventEnd0826 }],
    objectives: [{ id: "daily-quests", title: "本日の基本デイリー10件", titleEn: "Today's 10 base Daily Quests", action: "05:00のリセット後に基本10件を完了する。恩寵の追加2件は通常の日課メモを確認", actionEn: "Complete the 10 base quests after the 05:00 reset; check the regular routine note for two Blessing extras", kind: "count", target: 10, unit: "件", unitEn: " quests", cadence: "daily" }],
    sourceIds: ["event-double-daily", "event-overview"], verifiedAt: EVENT_VERIFIED_AT,
  },
  {
    id: "special-login", campaignId: "special-login-2026-07", title: "リリース記念特別ログイン", titleEn: "Launch Special Login",
    summary: "累計21日分のログイン報酬を受け取ります。", summaryEn: "Claim 21 cumulative daily login rewards.", deadline: eventEnd0826,
    detailsUrl: "https://forum.netmarble.com/vampir_jp/view/20/62", milestones: [{ id: "event-end", label: "ログイン・報酬受取終了", labelEn: "Login and reward claims end", deadline: eventEnd0826 }],
    objectives: [{ id: "login-days", title: "累計ログイン", titleEn: "Cumulative login days", action: "毎日05:00以降にログインして報酬を受け取る", actionEn: "Log in after each 05:00 JST reset and claim the reward", kind: "count", target: 21, unit: "日", unitEn: " days", cadence: "once" }],
    sourceIds: ["event-special-login", "event-overview"], verifiedAt: EVENT_VERIFIED_AT,
  },
  {
    id: "basic-growth", campaignId: "basic-growth-2026-07", title: "ヴァンパイア基礎成長支援ミッション", titleEn: "Vampire Basic Growth Support",
    summary: "毎週月曜05:00に討伐進捗がリセットされます。", summaryEn: "Hunt progress resets every Monday at 05:00 JST.", deadline: eventEnd0826,
    detailsUrl: "https://forum.netmarble.com/vampir_jp/view/20/66", milestones: [{ id: "event-end", label: "ミッション・箱使用終了", labelEn: "Missions and box use end", deadline: eventEnd0826 }],
    objectives: [
      { id: "world-bosses", title: "今週のワールドボス討伐", titleEn: "World Bosses this week", action: "1・2・3・4回の各報酬を受け取る", actionEn: "Claim each reward at 1, 2, 3, and 4", kind: "count", target: 4, unit: "回", unitEn: "", cadence: "weekly" },
      { id: "monsters", title: "今週のモンスター討伐", titleEn: "Monsters this week", action: "1,000・2,000・3,000・4,000体の各報酬を受け取る", actionEn: "Claim each reward at 1,000, 2,000, 3,000, and 4,000", kind: "count", target: 4000, unit: "体", unitEn: "", cadence: "weekly" },
      { id: "claim-all", title: "今週の全達成報酬", titleEn: "This week's all-missions reward", action: "成長の副葬品ボックスを受け取る", actionEn: "Claim the Growth Burial Goods Box", kind: "check", cadence: "weekly" },
    ], sourceIds: ["event-basic-growth", "event-overview"], verifiedAt: EVENT_VERIFIED_AT,
  },
  {
    id: "release-growth", campaignId: "release-growth-2026-07", title: "リリース記念成長支援", titleEn: "Launch Growth Support",
    summary: "週ごとに解放されるミッションを進めます。", summaryEn: "Complete mission groups unlocked week by week.", deadline: eventEnd0916,
    detailsUrl: "https://forum.netmarble.com/vampir_jp/view/20/63", milestones: [{ id: "event-end", label: "ミッション・箱使用終了", labelEn: "Missions and box use end", deadline: eventEnd0916 }],
    objectives: [
      missionCount("week-1-level", "1週目：レベル到達", "Week 1: Character level", 10, "Lv", " levels"),
      missionCount("week-1-enhance", "1週目：装備強化", "Week 1: Gear enhancements", 50, "回", " times"),
      missionCount("week-1-donations", "1週目：クラン寄付", "Week 1: Clan donations", 9, "回", " times"),
      missionCount("week-1-world-bosses", "1週目：ワールドボス討伐", "Week 1: World Bosses defeated", 3, "回", " times"),
      missionCount("week-1-monsters", "1週目：モンスター討伐", "Week 1: Monsters defeated", 2_000, "体", " monsters"),
      missionCount("week-1-epic", "1週目：エピックダンジョン", "Week 1: Epic Dungeon clears", 3, "回", " times"),
      missionCount("week-1-forms", "1週目：形象獲得", "Week 1: Forms acquired", 10, "回", " times"),
      missionCount("week-1-trinity", "1週目：トリニティ消費", "Week 1: Trinity spent", 300, "個", " Trinity"),
      missionCount("week-2-crafting", "2週目：アイテム製作", "Week 2: Items crafted", 30, "回", " times"),
      missionCount("week-2-gear", "2週目：装備獲得", "Week 2: Gear acquired", 120, "回", " times"),
      missionCount("week-2-gold", "2週目：ゴールド消費", "Week 2: Gold spent", 1_000_000, "個", " Gold"),
      missionCount("week-2-dismantle", "2週目：装備分解", "Week 2: Gear dismantles", 70, "回", " times"),
      missionCount("week-2-creation", "2週目：創造の深淵", "Week 2: Abyss of Creation monsters", 3_000, "体", " monsters"),
      missionCount("week-2-legacy", "2週目：褪せた遺産", "Week 2: Faded Legacy monsters", 3_000, "体", " monsters"),
      missionCount("week-2-commandments", "2週目：掟の刻印", "Week 2: Commandment engravings", 10, "回", " times"),
      missionCount("week-2-farm", "2週目：ファームダイヤ獲得", "Week 2: Farm Diamonds acquired", 1_000, "個", " Diamonds"),
      missionCount("week-3-trades", "3週目：闇取引進行", "Week 3: Dark Trades", 20, "回", " times"),
      missionCount("week-3-workshop", "3週目：古代の工房", "Week 3: Ancient Workshop monsters", 3_000, "体", " monsters"),
      missionCount("week-3-form-combine", "3週目：形象合成", "Week 3: Form combines", 5, "回", " times"),
      missionCount("week-3-mounts", "3週目：乗騎獲得", "Week 3: Mounts acquired", 10, "個", " mounts"),
      missionCount("week-3-sephira", "3週目：セフィラ合成", "Week 3: Sephira combines", 10, "回", " times"),
      missionCount("week-3-daily", "3週目：デイリークエスト", "Week 3: Daily Quests", 40, "回", " times"),
      missionCount("week-3-diamonds", "3週目：ダイヤ消費（取引所対象外）", "Week 3: Diamonds spent (market excluded)", 1_000, "個", " Diamonds"),
      missionCount("week-3-trinity", "3週目：トリニティ消費", "Week 3: Trinity spent", 300, "個", " Trinity"),
      missionCount("week-4-monsters", "4週目：モンスター討伐", "Week 4: Monsters defeated", 3_000, "体", " monsters"),
      missionCount("week-4-donations", "4週目：クラン寄付", "Week 4: Clan donations", 9, "回", " times"),
      missionCount("week-4-sephira", "4週目：セフィラ合成", "Week 4: Sephira combines", 10, "回", " times"),
      missionCount("week-4-epic", "4週目：エピックダンジョン", "Week 4: Epic Dungeon clears", 3, "回", " times"),
      missionCount("week-4-failures", "4週目：装備強化失敗", "Week 4: Failed gear enhancements", 30, "回", " times"),
      missionCount("week-4-artifacts", "4週目：アーティファクト強化", "Week 4: Artifact enhancements", 5, "回", " times"),
      missionCount("week-4-trinity", "4週目：トリニティ消費", "Week 4: Trinity spent", 300, "個", " Trinity"),
      missionCount("week-4-world-bosses", "4週目：ワールドボス討伐", "Week 4: World Bosses defeated", 6, "回", " times"),
    ], sourceIds: ["event-release-growth", "event-overview"], verifiedAt: EVENT_VERIFIED_AT,
  },
  {
    id: "summon-mission", campaignId: "summon-mission-2026-07", title: "リリース記念召喚ミッション", titleEn: "Launch Summon Mission",
    summary: "形象・乗騎の累積召喚回数を追跡します。", summaryEn: "Track cumulative form and mount summons.", deadline: eventEnd0916,
    detailsUrl: "https://forum.netmarble.com/vampir_jp/view/20/64", milestones: [{ id: "event-end", label: "ミッション・報酬受取終了", labelEn: "Missions and reward claims end", deadline: eventEnd0916 }],
    objectives: [{ id: "summons", title: "形象・乗騎召喚", titleEn: "Form and mount summons", action: "50回ごと、最大1,000回まで報酬を受け取る", actionEn: "Claim rewards every 50 summons, up to 1,000", kind: "count", target: 1000, unit: "回", unitEn: "", cadence: "once" }],
    sourceIds: ["event-summon-mission", "event-overview"], verifiedAt: EVENT_VERIFIED_AT,
  },
  {
    id: "summon-ranking", campaignId: "summon-ranking-2026-07", title: "リリース記念召喚ランキング", titleEn: "Launch Summon Ranking",
    summary: "ケアポイントと現在順位をゲーム内で確認します。", summaryEn: "Check Care Points and current rank in game.", deadline: eventEnd0819,
    detailsUrl: "https://forum.netmarble.com/vampir_jp/view/20/65", milestones: [{ id: "event-end", label: "ランキング集計終了", labelEn: "Ranking period ends", deadline: eventEnd0819 }],
    objectives: [
      { id: "check-score", title: "ケアポイントを確認", titleEn: "Check Care Points", action: "イベント画面で現在スコアと順位を確認する", actionEn: "Check your current score and rank on the event screen", kind: "check", cadence: "once" },
      { id: "claim-missions", title: "達成済み報酬を受け取る", titleEn: "Claim completed rewards", action: "受取可能なミッション報酬を回収する", actionEn: "Collect all available mission rewards", kind: "check", cadence: "once" },
    ], sourceIds: ["event-summon-ranking", "event-overview"], verifiedAt: EVENT_VERIFIED_AT,
  },
  {
    id: "commandment-payback", campaignId: "commandment-payback-2026-08", title: "掟支援ペイバック", titleEn: "Commandment Support Payback",
    summary: "掟の刻印回数に応じてトリニティを受け取ります。", summaryEn: "Claim Trinity based on Commandment engravings.", deadline: eventEnd0916,
    detailsUrl: "https://forum.netmarble.com/vampir_jp/view/20/202", milestones: [{ id: "event-end", label: "ミッション・報酬受取終了", labelEn: "Missions and reward claims end", deadline: eventEnd0916 }],
    objectives: [{ id: "engravings", title: "掟の刻印", titleEn: "Commandment engravings", action: "15・30・45・60・80・100・150・200・250・400回の報酬を受け取る", actionEn: "Claim rewards at 15, 30, 45, 60, 80, 100, 150, 200, 250, and 400", kind: "count", target: 400, unit: "回", unitEn: "", cadence: "once" }],
    sourceIds: ["event-commandments", "event-overview"], verifiedAt: EVENT_VERIFIED_AT,
  },
  {
    id: "hundred-day-growth", campaignId: "hundred-day-growth-2026-08", title: "100日間の成長達成ミッション", titleEn: "100-Day Growth Mission",
    summary: "到達レベルごとの報酬を確認します。", summaryEn: "Track rewards at each character-level milestone.", deadline: at("2026-11-17T19:59:00.000Z"),
    detailsUrl: "https://forum.netmarble.com/vampir_jp/view/20/201", milestones: [{ id: "event-end", label: "ミッション・報酬受取終了", labelEn: "Missions and reward claims end", deadline: at("2026-11-17T19:59:00.000Z") }],
    objectives: [{ id: "level", title: "キャラクターレベル", titleEn: "Character level", action: "Lv36・40・44・48・52・55・58・61・64・67・70・75で報酬を受け取る", actionEn: "Claim rewards at Lv36, 40, 44, 48, 52, 55, 58, 61, 64, 67, 70, and 75", kind: "count", target: 75, unit: "Lv", unitEn: "Lv", cadence: "once" }],
    sourceIds: ["event-100-day", "event-overview"], verifiedAt: EVENT_VERIFIED_AT,
  },
] as const satisfies readonly LimitedEvent[];

export const GAME_CONTENT = {
  sources: GAME_CONTENT_SOURCES,
  spawnEvents: SPAWN_EVENTS,
  dailyTasks: DAILY_TASKS,
  weeklyTasks: WEEKLY_TASKS,
  limitedEvents: LIMITED_EVENTS,
} as const satisfies GameContentDefinition;

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isValidVerifiedAt(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{3})?(Z|([+-])(\d{2}):(\d{2}))$/);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, zone, , offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return false;
  if (zone !== "Z" && (Number(offsetHourText) > 23 || Number(offsetMinuteText) > 59)) return false;
  return !Number.isNaN(Date.parse(value));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid game content: ${message}`);
}

export function validateGameContent(content: GameContentDefinition) {
  assert(content.sources.length > 0, "at least one source is required");
  const sourceIds = new Set<string>();
  for (const source of content.sources) {
    assert(Boolean(source.id.trim()), "source id must not be empty");
    assert(!sourceIds.has(source.id), `duplicate source id ${source.id}`);
    sourceIds.add(source.id);
    assert(isValidUrl(source.url), `invalid source URL for ${source.id}`);
    assert(source.authority === "official" || source.authority === "supplementary", `invalid source authority for ${source.id}`);
    assert(Boolean(source.label.ja.trim()) && Boolean(source.label.en.trim()), `missing source label for ${source.id}`);
  }

  const itemIds = new Set<string>();
  const campaignIds = new Set<string>();
  const allItems = [...content.spawnEvents, ...content.dailyTasks, ...content.weeklyTasks, ...content.limitedEvents];
  assert(content.spawnEvents.length > 0, "at least one spawn event is required");
  assert(allItems.length > 0, "at least one game-content item is required");
  const validateItem = (item: { id: string; sourceIds: readonly string[]; verifiedAt: string }) => {
    assert(Boolean(item.id.trim()), "item id must not be empty");
    assert(!itemIds.has(item.id), `duplicate item id ${item.id}`);
    itemIds.add(item.id);
    assert(item.sourceIds.length > 0, `missing source id for ${item.id}`);
    assert(new Set(item.sourceIds).size === item.sourceIds.length, `duplicate source ids for ${item.id}`);
    for (const sourceId of item.sourceIds) assert(sourceIds.has(sourceId), `unknown source id ${sourceId} for ${item.id}`);
    assert(isValidVerifiedAt(item.verifiedAt), `invalid verifiedAt for ${item.id}`);
  };

  for (const event of content.spawnEvents) {
    validateItem(event);
    assert(Boolean(event.title.trim()) && Boolean(event.label.trim()), `missing display copy for ${event.id}`);
    assert(Number.isInteger(event.hour) && event.hour >= 0 && event.hour <= 23, `invalid hour for ${event.id}`);
    assert(Number.isInteger(event.minute) && event.minute >= 0 && event.minute <= 59, `invalid minute for ${event.id}`);
    if (event.days) {
      assert(event.days.length > 0 && event.days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6), `invalid weekdays for ${event.id}`);
      assert(new Set(event.days).size === event.days.length, `duplicate weekdays for ${event.id}`);
    }
    if (event.minLevel !== undefined) assert(Number.isInteger(event.minLevel) && event.minLevel >= 1 && event.minLevel <= 200, `invalid level for ${event.id}`);
  }
  for (const task of [...content.dailyTasks, ...content.weeklyTasks]) {
    validateItem(task);
    assert(Boolean(task.title.trim()) && Boolean(task.note.trim()), `missing display copy for ${task.id}`);
    if (task.unlock !== undefined) assert(Boolean(task.unlock.trim()), `empty unlock copy for ${task.id}`);
    assert(Number.isInteger(task.priority) && task.priority >= 1 && task.priority <= 5, `invalid priority for ${task.id}`);
    if (task.minLevel !== undefined) assert(Number.isInteger(task.minLevel) && task.minLevel >= 1 && task.minLevel <= 200, `invalid level for ${task.id}`);
  }
  for (const event of content.limitedEvents) {
    validateItem(event);
    assert(Boolean(event.campaignId.trim()) && !campaignIds.has(event.campaignId), `invalid or duplicate campaign id ${event.campaignId}`);
    campaignIds.add(event.campaignId);
    assert(Boolean(event.title.trim()) && Boolean(event.titleEn.trim()) && Boolean(event.summary.trim()) && Boolean(event.summaryEn.trim()), `missing display copy for ${event.id}`);
    assert(event.deadline instanceof Date && !Number.isNaN(event.deadline.getTime()), `invalid deadline for ${event.id}`);
    assert(isValidUrl(event.detailsUrl), `invalid details URL for ${event.id}`);
    assert(event.sourceIds.some((sourceId) => content.sources.find((source) => source.id === sourceId)?.url === event.detailsUrl), `details URL is not a referenced source for ${event.id}`);
    assert(event.milestones.length > 0 && event.objectives.length > 0, `missing progress definition for ${event.id}`);
    const milestoneIds = new Set<string>();
    for (const milestone of event.milestones) {
      assert(Boolean(milestone.id.trim()) && !milestoneIds.has(milestone.id), `invalid or duplicate milestone for ${event.id}`);
      milestoneIds.add(milestone.id);
      assert(Boolean(milestone.label.trim()) && Boolean(milestone.labelEn.trim()), `missing milestone copy for ${event.id}`);
      assert(milestone.deadline instanceof Date && !Number.isNaN(milestone.deadline.getTime()) && milestone.deadline <= event.deadline, `invalid milestone deadline for ${event.id}`);
    }
    const objectiveIds = new Set<string>();
    for (const objective of event.objectives) {
      assert(Boolean(objective.id.trim()) && !objectiveIds.has(objective.id), `invalid or duplicate objective for ${event.id}`);
      objectiveIds.add(objective.id);
      if (objective.metricId !== undefined) assert(Boolean(objective.metricId.trim()), `invalid metric id for ${event.id}`);
      assert(Boolean(objective.title.trim()) && Boolean(objective.titleEn.trim()) && Boolean(objective.action.trim()) && Boolean(objective.actionEn.trim()), `missing objective copy for ${event.id}`);
      assert(["check", "count"].includes(objective.kind) && ["once", "daily", "weekly"].includes(objective.cadence), `invalid objective type for ${event.id}`);
      if (objective.kind === "count") assert(Number.isInteger(objective.target) && (objective.target ?? 0) > 0, `invalid objective target for ${event.id}`);
      else assert(objective.target === undefined, `check objective must not have a target for ${event.id}`);
    }
  }
  return content;
}

validateGameContent(GAME_CONTENT);

export function oldestGameContentVerifiedAt(content: GameContentDefinition = GAME_CONTENT) {
  return [...content.spawnEvents, ...content.dailyTasks, ...content.weeklyTasks, ...content.limitedEvents]
    .map((item) => item.verifiedAt)
    .reduce<string | null>((oldest, verifiedAt) => oldest === null || Date.parse(verifiedAt) < Date.parse(oldest) ? verifiedAt : oldest, null);
}
