import { computed, reactive, ref } from "vue";

import type { AppState, RepeatMode, Task } from "../types/domain";

const repeatLabels: Record<RepeatMode, string> = {
  none: "不循环",
  daily: "每天",
  weekly: "每周",
  monthly: "每月",
};

function toDateInputValue(date: Date): string {
  const local = new Date(date);
  const offset = local.getTimezoneOffset();
  local.setMinutes(local.getMinutes() - offset);
  return local.toISOString().slice(0, 10);
}

function deadlineFromDateInput(dateValue: string): Date | null {
  if (!dateValue) return null;
  const base = new Date(`${dateValue}T00:00:00`);
  base.setHours(23, 59, 0, 0);
  return base;
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function shiftDeadline(deadline: string, repeat: RepeatMode): string {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return deadline;
  if (repeat === "daily") date.setDate(date.getDate() + 1);
  if (repeat === "weekly") date.setDate(date.getDate() + 7);
  if (repeat === "monthly") date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

export function useTasks(state: AppState) {
  const now = new Date();
  const form = reactive({
    title: "",
    deadline: "",
    repeat: "none" as RepeatMode,
    importance: 3,
    difficulty: 3,
  });

  const calendarOpen = ref(false);
  const repeatOpen = ref(false);
  const selectedDeadlineDate = ref<Date | null>(null);
  const calendarViewYear = ref(now.getFullYear());
  const calendarViewMonth = ref(now.getMonth());

  function rewardForTask(task: Partial<Task>, completedAt: Date = new Date()): number {
    const base = 8;
    const difficulty = Number(task.difficulty || 1);
    const importance = Number(task.importance || 1);
    const repeatBonus = task.repeat === "none" ? 1.1 : 1;
    let reward = Math.round(base * difficulty * importance * repeatBonus);

    if (task.deadline) {
      const deadline = new Date(task.deadline);
      if (!Number.isNaN(deadline.getTime()) && completedAt <= deadline) {
        reward = Math.round(reward * 1.2);
      }
    }
    return Math.round(reward / 5) * 5;
  }

  function formatDate(value: string): string {
    if (!value) return "无截止";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "无截止";
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const rewardPreview = computed(() => {
    const previewDeadline = deadlineFromDateInput(form.deadline);
    return rewardForTask({
      difficulty: form.difficulty,
      importance: form.importance,
      repeat: form.repeat,
      deadline: previewDeadline ? previewDeadline.toISOString() : "",
    });
  });

  const repeatLabel = computed(() => repeatLabels[form.repeat] || repeatLabels.none);

  const deadlineFieldLabel = computed(() => "截止日期（可选）");

  const deadlineLabel = computed(() => {
    if (!selectedDeadlineDate.value) {
      return "不设置截止日期";
    }
    const today = new Date();
    return isSameDate(today, selectedDeadlineDate.value)
      ? `今天 · ${toDateInputValue(selectedDeadlineDate.value)}`
      : toDateInputValue(selectedDeadlineDate.value);
  });

  const calendarTitle = computed(
    () => `${calendarViewYear.value}年 ${calendarViewMonth.value + 1}月`
  );

  const calendarDays = computed(() => {
    const first = new Date(calendarViewYear.value, calendarViewMonth.value, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarViewYear.value, calendarViewMonth.value + 1, 0).getDate();
    const daysPrev = new Date(calendarViewYear.value, calendarViewMonth.value, 0).getDate();
    const today = new Date();

    return Array.from({ length: 42 }).map((_, index) => {
      const n = index - offset + 1;
      let date: Date;
      let other = false;

      if (n < 1) {
        date = new Date(calendarViewYear.value, calendarViewMonth.value - 1, daysPrev + n);
        other = true;
      } else if (n > daysInMonth) {
        date = new Date(calendarViewYear.value, calendarViewMonth.value + 1, n - daysInMonth);
        other = true;
      } else {
        date = new Date(calendarViewYear.value, calendarViewMonth.value, n);
      }

      return {
        key: `${toDateInputValue(date)}-${index}`,
        value: toDateInputValue(date),
        day: date.getDate(),
        isOther: other,
        isToday: isSameDate(date, today),
        isSelected: selectedDeadlineDate.value
          ? isSameDate(date, selectedDeadlineDate.value)
          : false,
      };
    });
  });

  function setSelectedDeadline(date: Date): void {
    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    selectedDeadlineDate.value = selected;
    calendarViewYear.value = selected.getFullYear();
    calendarViewMonth.value = selected.getMonth();
    form.deadline = toDateInputValue(selected);
  }

  function setSelectedDeadlineByValue(value: string): void {
    if (!value) return;
    setSelectedDeadline(new Date(`${value}T00:00:00`));
  }

  function clearSelectedDeadline(): void {
    selectedDeadlineDate.value = null;
    const current = new Date();
    calendarViewYear.value = current.getFullYear();
    calendarViewMonth.value = current.getMonth();
    form.deadline = "";
  }

  function toggleCalendar(open: boolean = !calendarOpen.value): void {
    if (open) {
      repeatOpen.value = false;
    }
    calendarOpen.value = open;
  }

  function setRepeat(value: string): void {
    form.repeat = Object.prototype.hasOwnProperty.call(repeatLabels, value)
      ? (value as RepeatMode)
      : "none";
  }

  function toggleRepeat(open: boolean = !repeatOpen.value): void {
    if (open) {
      calendarOpen.value = false;
    }
    repeatOpen.value = open;
  }

  function prevMonth(): void {
    if (calendarViewMonth.value === 0) {
      calendarViewMonth.value = 11;
      calendarViewYear.value -= 1;
      return;
    }
    calendarViewMonth.value -= 1;
  }

  function nextMonth(): void {
    if (calendarViewMonth.value === 11) {
      calendarViewMonth.value = 0;
      calendarViewYear.value += 1;
      return;
    }
    calendarViewMonth.value += 1;
  }

  function addTask(): void {
    const title = form.title.trim();
    if (!title) return;

    const deadlineDate = deadlineFromDateInput(form.deadline);
    state.tasks.unshift({
      id: crypto.randomUUID(),
      title,
      deadline: deadlineDate ? deadlineDate.toISOString() : "",
      repeat: form.repeat,
      importance: Number(form.importance || 3),
      difficulty: Number(form.difficulty || 3),
      createdAt: new Date().toISOString(),
      completedAt: "",
      reward: 0,
    });

    form.title = "";
    form.importance = 3;
    form.difficulty = 3;
    setRepeat("none");
    clearSelectedDeadline();
    toggleCalendar(false);
    toggleRepeat(false);
  }

  function completeTask(id: string): void {
    const task = state.tasks.find((item) => item.id === id);
    if (!task || task.completedAt) return;

    const nowTime = new Date();
    task.completedAt = nowTime.toISOString();
    task.reward = rewardForTask(task, nowTime);
    state.currency += task.reward;

    if (task.repeat !== "none") {
      state.tasks.unshift({
        ...task,
        id: crypto.randomUUID(),
        completedAt: "",
        reward: 0,
        createdAt: new Date().toISOString(),
        deadline: shiftDeadline(task.deadline, task.repeat),
      });
    }
  }

  function deleteTask(id: string): void {
    state.tasks = state.tasks.filter((task) => task.id !== id);
  }

  clearSelectedDeadline();

  return {
    form,
    repeatLabels,
    calendarOpen,
    repeatOpen,
    rewardPreview,
    repeatLabel,
    deadlineFieldLabel,
    deadlineLabel,
    calendarTitle,
    calendarDays,
    formatDate,
    rewardForTask,
    setRepeat,
    setSelectedDeadlineByValue,
    clearSelectedDeadline,
    toggleCalendar,
    toggleRepeat,
    prevMonth,
    nextMonth,
    addTask,
    completeTask,
    deleteTask,
  };
}
