export type SelectableTask = {
  id: string;
  priority: number;
  minLevel?: number;
};

function eligibleTasks<T extends SelectableTask>(
  tasks: readonly T[],
  completed: ReadonlySet<string>,
  level: number,
) {
  return tasks
    .map((task, index) => ({ task, index }))
    .filter(
      ({ task }) =>
        !completed.has(task.id) &&
        (!task.minLevel || task.minLevel <= level),
    )
    .sort(
      (a, b) =>
        b.task.priority - a.task.priority || a.index - b.index,
    )
    .map(({ task }) => task);
}

export function selectTodayTasks<T extends SelectableTask>(
  daily: readonly T[],
  weekly: readonly T[],
  dailyDone: readonly string[],
  weeklyDone: readonly string[],
  level: number,
  take = 3,
) {
  const dailyTasks = eligibleTasks(daily, new Set(dailyDone), level);
  const weeklyTasks = eligibleTasks(weekly, new Set(weeklyDone), level);
  return [...dailyTasks, ...weeklyTasks].slice(0, take);
}
