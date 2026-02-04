import type {
  CoreTask,
  TodoItem,
  ScheduledTask,
  DaySchedule,
  Timeframe,
} from '../types';
import { TIMEFRAME_CONFIG } from '../types';
import {
  addMinutes,
  getDay,
  setHours,
  setMinutes,
  startOfWeek,
  endOfWeek,
  addWeeks,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';

const generateId = () => crypto.randomUUID().split('-')[0];

// Check if a core task should run today
function shouldCoreTaskRunToday(task: CoreTask): boolean {
  const today = new Date();
  const dayOfWeek = getDay(today); // 0 = Sunday, 6 = Saturday
  const dayOfMonth = today.getDate();

  switch (task.recurrence.type) {
    case 'daily':
      // If daysOfWeek specified, check if today is one of them
      if (task.recurrence.daysOfWeek && task.recurrence.daysOfWeek.length > 0) {
        return task.recurrence.daysOfWeek.includes(dayOfWeek);
      }
      return true; // Every day

    case 'weekly':
      return task.recurrence.daysOfWeek?.includes(dayOfWeek) ?? false;

    case 'monthly':
      return task.recurrence.dayOfMonth === dayOfMonth;

    default:
      return false;
  }
}

// Get time slot based on preferred time
function getTimeSlot(
  preferredTime: string,
  startTime: Date,
  endTime: Date
): { start: Date; end: Date } {
  const totalMinutes =
    (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  const thirdDuration = totalMinutes / 3;

  switch (preferredTime) {
    case 'morning':
      return {
        start: startTime,
        end: addMinutes(startTime, thirdDuration),
      };
    case 'midday':
      return {
        start: addMinutes(startTime, thirdDuration),
        end: addMinutes(startTime, thirdDuration * 2),
      };
    case 'afternoon':
      return {
        start: addMinutes(startTime, thirdDuration * 2),
        end: endTime,
      };
    default:
      return { start: startTime, end: endTime };
  }
}

// Check if a todo should be scheduled today based on its timeframe
function isTodoEligibleToday(todo: TodoItem): boolean {
  const today = new Date();
  const timeframe = todo.timeframe || 'this_week'; // Default for legacy todos

  switch (timeframe) {
    case 'today':
      return true;
    case 'tomorrow':
      // Only show tomorrow tasks if it's actually tomorrow
      return false; // Will be eligible tomorrow
    case 'this_week': {
      // Include if we're within the current week
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      return isWithinInterval(today, { start: weekStart, end: weekEnd });
    }
    case 'next_week': {
      // Only include if we're actually in next week
      const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
      const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
      return isWithinInterval(today, { start: nextWeekStart, end: nextWeekEnd });
    }
    case 'this_month': {
      // Include if we're within the current month
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      return isWithinInterval(today, { start: monthStart, end: monthEnd });
    }
    case 'someday':
      // Someday tasks are only scheduled if there's extra time (lowest priority)
      return true;
    default:
      return true;
  }
}

// Sort todos by timeframe urgency
function sortTodosByTimeframe(todos: TodoItem[]): TodoItem[] {
  const timeframeOrder: Record<Timeframe, number> = {
    today: 0,
    tomorrow: 1,
    this_week: 2,
    next_week: 3,
    this_month: 4,
    someday: 5,
  };

  return [...todos].sort((a, b) => {
    const aTimeframe = a.timeframe || 'this_week';
    const bTimeframe = b.timeframe || 'this_week';
    const timeframeDiff = timeframeOrder[aTimeframe] - timeframeOrder[bTimeframe];
    if (timeframeDiff !== 0) return timeframeDiff;
    // Secondary sort by created date
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

// Create a break task
function createBreak(startTime: Date, duration: number): ScheduledTask {
  return {
    id: generateId(),
    sourceId: 'break',
    sourceType: 'break',
    title: 'Break',
    scheduledStart: startTime.toISOString(),
    scheduledEnd: addMinutes(startTime, duration).toISOString(),
    status: 'pending',
    duration,
    color: '#64748b',
  };
}

// Parse time string to Date object for today
function parseTimeToday(timeStr: string): Date {
  const today = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);
  return setMinutes(setHours(today, hours), minutes);
}

// Calculate time slots for spread tasks (tasks done multiple times per day)
function getSpreadSlots(
  timesPerDay: number,
  startTime: Date,
  endTime: Date
): Date[] {
  const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  const slots: Date[] = [];

  if (timesPerDay < 1) {
    return slots;
  }

  if (timesPerDay === 1) {
    slots.push(startTime);
    return slots;
  }

  // Distribute evenly throughout the day
  // For N times, we create N slots with equal gaps
  const gap = totalMinutes / timesPerDay;

  for (let i = 0; i < timesPerDay; i++) {
    const slotTime = addMinutes(startTime, gap * i + gap / 2);
    slots.push(slotTime);
  }

  return slots;
}

export function generateDailySchedule(
  coreTasks: CoreTask[],
  todos: TodoItem[],
  dayConfig: DaySchedule
): ScheduledTask[] {
  if (!dayConfig.enabled) {
    return [];
  }

  const schedule: ScheduledTask[] = [];
  const startTime = parseTimeToday(dayConfig.startTime);
  const endTime = parseTimeToday(dayConfig.endTime);
  const breakDuration = dayConfig.breakDuration;

  // Filter tasks for today
  const todaysCoreTasks = coreTasks.filter(shouldCoreTaskRunToday);
  const eligibleTodos = sortTodosByTimeframe(
    todos.filter((t) => !t.completed && isTodoEligibleToday(t))
  );

  // Handle tasks with timesPerDay > 1 (spread tasks)
  // These get distributed evenly throughout the day
  const spreadTasks = todaysCoreTasks.filter((t) => t.preferredTime === 'spread' || (t.timesPerDay && t.timesPerDay > 1));
  const regularTasks = todaysCoreTasks.filter((t) => t.preferredTime !== 'spread' && (!t.timesPerDay || t.timesPerDay === 1));

  // Group regular core tasks by preferred time
  const morningTasks = regularTasks.filter((t) => t.preferredTime === 'morning');
  const middayTasks = regularTasks.filter((t) => t.preferredTime === 'midday');
  const afternoonTasks = regularTasks.filter((t) => t.preferredTime === 'afternoon');
  const remainingAnytimeTasks = [...regularTasks.filter((t) => t.preferredTime === 'anytime')];

  // Track scheduled todo IDs to avoid duplicates
  const scheduledTodoIds = new Set<string>();

  // Pre-calculate spread task slots and create placeholder entries
  interface SpreadSlot {
    time: Date;
    task: CoreTask;
    instanceNumber: number;
  }
  const spreadSlots: SpreadSlot[] = [];

  for (const task of spreadTasks) {
    const times = task.timesPerDay || 1;
    const slots = getSpreadSlots(times, startTime, endTime);
    slots.forEach((slotTime, index) => {
      spreadSlots.push({
        time: slotTime,
        task,
        instanceNumber: index + 1,
      });
    });
  }

  // Sort spread slots by time
  spreadSlots.sort((a, b) => a.time.getTime() - b.time.getTime());

  let currentTime = new Date(startTime);
  let spreadSlotIndex = 0;

  // Helper to add a task with break
  const addTask = (
    sourceId: string,
    sourceType: 'core' | 'todo',
    title: string,
    duration: number,
    timeframe?: Timeframe,
    color?: string
  ) => {
    if (currentTime >= endTime) return false;

    const taskEnd = addMinutes(currentTime, duration);
    const actualEnd = taskEnd > endTime ? endTime : taskEnd;
    const actualDuration = (actualEnd.getTime() - currentTime.getTime()) / (1000 * 60);

    schedule.push({
      id: generateId(),
      sourceId,
      sourceType,
      title,
      scheduledStart: currentTime.toISOString(),
      scheduledEnd: actualEnd.toISOString(),
      status: 'pending',
      duration: actualDuration,
      timeframe,
      color,
    });

    currentTime = actualEnd;

    // Add break after task if there's time
    if (breakDuration > 0 && currentTime < endTime) {
      const breakEnd = addMinutes(currentTime, breakDuration);
      if (breakEnd <= endTime) {
        schedule.push(createBreak(currentTime, breakDuration));
        currentTime = breakEnd;
      }
    }

    return true;
  };

  // Helper to check if we should insert a spread task now
  const shouldInsertSpreadTask = (): SpreadSlot | null => {
    if (spreadSlotIndex >= spreadSlots.length) return null;
    const nextSpread = spreadSlots[spreadSlotIndex];
    // Insert spread task if we're at or past its scheduled time
    if (currentTime >= nextSpread.time ||
        // Or if there's not enough time for another task before the spread slot
        addMinutes(currentTime, 30).getTime() > nextSpread.time.getTime()) {
      return nextSpread;
    }
    return null;
  };

  // Helper to insert spread task
  const insertSpreadTask = (slot: SpreadSlot) => {
    const times = slot.task.timesPerDay || 1;
    const title = times > 1
      ? `${slot.task.title} (${slot.instanceNumber}/${times})`
      : slot.task.title;
    addTask(slot.task.id, 'core', title, slot.task.duration, undefined, slot.task.color || '#6366f1');
    spreadSlotIndex++;
  };

  // Schedule morning core tasks
  for (const task of morningTasks) {
    // Check if spread task should come first - insert ALL pending spread tasks
    let spreadSlot = shouldInsertSpreadTask();
    while (spreadSlot && currentTime < endTime) {
      insertSpreadTask(spreadSlot);
      spreadSlot = shouldInsertSpreadTask();
    }
    addTask(task.id, 'core', task.title, task.duration, undefined, task.color || '#6366f1');
  }

  // Fill with "today" todos in morning slot (most urgent)
  const morningSlotEnd = getTimeSlot('morning', startTime, endTime).end;
  for (const todo of eligibleTodos) {
    if (currentTime >= morningSlotEnd) break;
    if (scheduledTodoIds.has(todo.id)) continue;

    // Check if spread task should come first
    const spreadSlot = shouldInsertSpreadTask();
    if (spreadSlot) {
      insertSpreadTask(spreadSlot);
    }

    if (currentTime >= morningSlotEnd) break;

    const timeframe = todo.timeframe || 'this_week';
    if (timeframe === 'today') {
      addTask(
        todo.id,
        'todo',
        todo.title,
        todo.duration,
        timeframe,
        TIMEFRAME_CONFIG[timeframe].color
      );
      scheduledTodoIds.add(todo.id);
    }
  }

  // Move to midday if needed
  const middaySlotStart = getTimeSlot('midday', startTime, endTime).start;
  if (currentTime < middaySlotStart && middayTasks.length > 0) {
    // Fill gap with anytime tasks or todos
    while (currentTime < middaySlotStart && remainingAnytimeTasks.length > 0) {
      // Check if spread task should come first
      const spreadSlot = shouldInsertSpreadTask();
      if (spreadSlot) {
        insertSpreadTask(spreadSlot);
        continue;
      }
      const task = remainingAnytimeTasks.shift()!;
      addTask(task.id, 'core', task.title, task.duration, undefined, task.color || '#6366f1');
    }
  }

  // Schedule midday core tasks
  for (const task of middayTasks) {
    // Check if spread task should come first - insert ALL pending spread tasks
    let spreadSlot = shouldInsertSpreadTask();
    while (spreadSlot && currentTime < endTime) {
      insertSpreadTask(spreadSlot);
      spreadSlot = shouldInsertSpreadTask();
    }
    addTask(task.id, 'core', task.title, task.duration, undefined, task.color || '#6366f1');
  }

  // Move to afternoon if needed
  const afternoonSlotStart = getTimeSlot('afternoon', startTime, endTime).start;
  if (currentTime < afternoonSlotStart && afternoonTasks.length > 0) {
    // Fill gap with remaining anytime tasks
    while (currentTime < afternoonSlotStart && remainingAnytimeTasks.length > 0) {
      // Check if spread task should come first
      const spreadSlot = shouldInsertSpreadTask();
      if (spreadSlot) {
        insertSpreadTask(spreadSlot);
        continue;
      }
      const task = remainingAnytimeTasks.shift()!;
      addTask(task.id, 'core', task.title, task.duration, undefined, task.color || '#6366f1');
    }
  }

  // Schedule afternoon core tasks
  for (const task of afternoonTasks) {
    // Check if spread task should come first - insert ALL pending spread tasks
    let spreadSlot = shouldInsertSpreadTask();
    while (spreadSlot && currentTime < endTime) {
      insertSpreadTask(spreadSlot);
      spreadSlot = shouldInsertSpreadTask();
    }
    addTask(task.id, 'core', task.title, task.duration, undefined, task.color || '#6366f1');
  }

  // Add remaining anytime core tasks
  for (const task of remainingAnytimeTasks) {
    // Check if spread task should come first - insert ALL pending spread tasks
    let spreadSlot = shouldInsertSpreadTask();
    while (spreadSlot && currentTime < endTime) {
      insertSpreadTask(spreadSlot);
      spreadSlot = shouldInsertSpreadTask();
    }
    addTask(task.id, 'core', task.title, task.duration, undefined, task.color || '#6366f1');
  }

  // Fill remaining time with todos by timeframe urgency
  const remainingTodos = sortTodosByTimeframe(
    eligibleTodos.filter((t) => !scheduledTodoIds.has(t.id))
  );
  for (const todo of remainingTodos) {
    if (currentTime >= endTime) break;

    // Check if spread task should come first - insert ALL pending spread tasks
    let spreadSlot = shouldInsertSpreadTask();
    while (spreadSlot && currentTime < endTime) {
      insertSpreadTask(spreadSlot);
      spreadSlot = shouldInsertSpreadTask();
    }

    if (currentTime >= endTime) break;

    const timeframe = todo.timeframe || 'this_week';
    addTask(
      todo.id,
      'todo',
      todo.title,
      todo.duration,
      timeframe,
      TIMEFRAME_CONFIG[timeframe].color
    );
  }

  // Insert any remaining spread tasks at the end
  // This ensures ALL spread task instances get scheduled even if there are no other tasks
  while (spreadSlotIndex < spreadSlots.length && currentTime < endTime) {
    const slot = spreadSlots[spreadSlotIndex];
    const times = slot.task.timesPerDay || 1;
    const title = times > 1
      ? `${slot.task.title} (${slot.instanceNumber}/${times})`
      : slot.task.title;
    addTask(slot.task.id, 'core', title, slot.task.duration, undefined, slot.task.color || '#6366f1');
    spreadSlotIndex++;
  }

  return schedule;
}

// Calculate total scheduled time
export function getTotalScheduledMinutes(schedule: ScheduledTask[]): number {
  return schedule
    .filter((t) => t.sourceType !== 'break')
    .reduce((sum, t) => sum + t.duration, 0);
}

// Calculate completed time
export function getCompletedMinutes(schedule: ScheduledTask[]): number {
  return schedule
    .filter((t) => t.status === 'completed' && t.sourceType !== 'break')
    .reduce((sum, t) => sum + t.duration, 0);
}

// Get progress percentage
export function getDayProgress(schedule: ScheduledTask[]): number {
  const total = getTotalScheduledMinutes(schedule);
  const completed = getCompletedMinutes(schedule);
  return total > 0 ? (completed / total) * 100 : 0;
}
