export function dailyCycleKey(now: Date) {
  const effective = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  return `${effective.getUTCFullYear()}-${effective.getUTCMonth() + 1}-${effective.getUTCDate()}`;
}

export function weeklyCycleKey(now: Date) {
  const effective = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const sinceMonday = (effective.getUTCDay() + 6) % 7;
  effective.setUTCDate(effective.getUTCDate() - sinceMonday);
  return `${effective.getUTCFullYear()}-${effective.getUTCMonth() + 1}-${effective.getUTCDate()}`;
}

export function cycleResetState(
  activeDailyCycle: string,
  activeWeeklyCycle: string,
  currentDailyCycle: string,
  currentWeeklyCycle: string,
) {
  return {
    dailyExpired: activeDailyCycle !== currentDailyCycle,
    weeklyExpired: activeWeeklyCycle !== currentWeeklyCycle,
  };
}
