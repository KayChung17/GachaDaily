<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

import { useAppStore } from "../../store/appStore";

const store = useAppStore();
const {
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
} = store.taskModule;

const deadlinePickerRef = ref<HTMLElement | null>(null);
const repeatPickerRef = ref<HTMLElement | null>(null);

function closePanelsOnOutsideClick(event: MouseEvent): void {
  const target = event.target as Node | null;

  if (
    calendarOpen.value &&
    deadlinePickerRef.value &&
    target &&
    !deadlinePickerRef.value.contains(target)
  ) {
    toggleCalendar(false);
  }

  if (repeatOpen.value && repeatPickerRef.value && target && !repeatPickerRef.value.contains(target)) {
    toggleRepeat(false);
  }
}

function closePanelsOnEscape(event: KeyboardEvent): void {
  if (event.key !== "Escape") return;

  if (repeatOpen.value) {
    toggleRepeat(false);
    return;
  }

  if (calendarOpen.value) {
    toggleCalendar(false);
  }
}

onMounted(() => {
  document.addEventListener("click", closePanelsOnOutsideClick);
  document.addEventListener("keydown", closePanelsOnEscape);
});

onUnmounted(() => {
  document.removeEventListener("click", closePanelsOnOutsideClick);
  document.removeEventListener("keydown", closePanelsOnEscape);
});
</script>

<template>
  <div class="tasks-layout">
    <section class="tasks-left chiseled-panel glass-panel">
      <div class="panel-inner">
        <div class="panel__header">
          <h2><span class="diamond">◆</span> 任 务 列 表 <span class="diamond">◆</span></h2>
        </div>
        <div class="task-list">
          <div v-if="!store.state.tasks.length" class="note-box">还没有任务，快创建一个吧。</div>

          <div v-for="task in store.state.tasks" :key="task.id" class="task-card">
            <div class="task-card__title">{{ task.title }}</div>
            <div class="task-card__footer">
              <div class="task-card__actions">
                <button
                  class="btn btn--hollow"
                  :disabled="Boolean(task.completedAt)"
                  :aria-disabled="Boolean(task.completedAt)"
                  @click="completeTask(task.id)"
                >
                  {{ task.completedAt ? "已完成" : "完成任务" }}
                </button>
                <button class="btn btn--outline" @click="deleteTask(task.id)">删除</button>
              </div>
              <div class="task-card__info">
                <div class="task-card__status-row">
                  <span class="task-card__status" :class="{ 'is-done': Boolean(task.completedAt) }">
                    {{ task.completedAt ? "已完成" : `${rewardForTask(task)}◆` }}
                  </span>
                  <span class="task-card__info-item">截止：{{ formatDate(task.deadline) }}</span>
                  <span class="task-card__info-item">
                    {{ task.completedAt ? `奖励 +${task.reward}` : "未结算" }}
                  </span>
                </div>
                <div class="task-card__meta-row">
                  <span class="badge">{{ task.repeat === "none" ? "不循环" : task.repeat }}</span>
                  <span class="badge">重要度 {{ task.importance }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="tasks-right">
      <section class="chiseled-panel info-bar">
        <div class="panel-inner bar-inner-center">
          <span class="currency-card__label">CURRENT POINTS / 当前积分</span>
          <div class="currency-card__value-box">
            <span class="star-icon large">✦</span>
            <span class="currency-card__value">{{ store.state.currency }}</span>
          </div>
        </div>
      </section>

      <section class="chiseled-panel glass-panel">
        <div class="panel-inner">
          <div class="panel__header">
            <h2><span class="diamond">◆</span> 创 建 任 务 <span class="diamond">◆</span></h2>
          </div>

          <form class="task-form" @submit.prevent="addTask">
            <div class="form-group">
              <label>任务名称</label>
              <div class="input-wrapper glass-input">
                <input v-model="form.title" type="text" placeholder="如：研习魔书" required />
                <span class="input-line"></span>
              </div>
            </div>

            <div class="form-group">
              <label>{{ deadlineFieldLabel }}</label>
              <div ref="deadlinePickerRef" class="date-picker">
                <div class="input-wrapper glass-input">
                  <button class="date-picker__button" type="button" @click="toggleCalendar()">
                    <span>{{ deadlineLabel }}</span>
                    <span class="diamond small">◆</span>
                  </button>
                  <span class="input-line"></span>
                </div>
                <input v-model="form.deadline" type="hidden" />

                <div class="calendar-panel chiseled-panel glass-effect" :class="{ 'is-open': calendarOpen }">
                  <div class="calendar-header">
                    <button class="calendar-nav glass-btn" type="button" @click="prevMonth">‹</button>
                    <div class="calendar-title">{{ calendarTitle }}</div>
                    <button class="calendar-nav glass-btn" type="button" @click="nextMonth">›</button>
                  </div>
                  <div class="calendar-weekdays">
                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                  </div>
                  <div class="calendar-days">
                    <button
                      v-for="day in calendarDays"
                      :key="day.key"
                      type="button"
                      class="calendar-day"
                      :class="{
                        'is-other': day.isOther,
                        'is-today': day.isToday,
                        'is-selected': day.isSelected,
                      }"
                      @click="setSelectedDeadlineByValue(day.value); toggleCalendar(false)"
                    >
                      {{ day.day }}
                    </button>
                  </div>
                  <div class="calendar-actions">
                    <button
                      class="btn btn--outline calendar-clear-btn"
                      type="button"
                      @click="clearSelectedDeadline(); toggleCalendar(false)"
                    >
                      不设置截止日期
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>循环周期</label>
              <div ref="repeatPickerRef" class="repeat-picker">
                <div class="input-wrapper glass-input">
                  <button class="date-picker__button" type="button" @click="toggleRepeat()">
                    <span>{{ repeatLabel }}</span>
                    <span class="diamond small">◆</span>
                  </button>
                  <span class="input-line"></span>
                </div>
                <input v-model="form.repeat" type="hidden" />
                <div class="repeat-panel chiseled-panel" :class="{ 'is-open': repeatOpen }">
                  <div class="panel-inner">
                    <div class="repeat-options">
                      <button
                        v-for="(label, key) in repeatLabels"
                        :key="key"
                        type="button"
                        class="repeat-option"
                        :class="{ 'is-selected': form.repeat === key }"
                        @click="setRepeat(key); toggleRepeat(false)"
                      >
                        {{ label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="task-form__row">
              <div class="form-group flex-1">
                <label>重要程度</label>
                <div class="range-wrapper">
                  <input v-model.number="form.importance" type="range" min="1" max="5" />
                </div>
              </div>
              <div class="form-group flex-1">
                <label>任务难度</label>
                <div class="range-wrapper">
                  <input v-model.number="form.difficulty" type="range" min="1" max="5" />
                </div>
              </div>
            </div>

            <div class="task-form__footer">
              <div class="reward-preview">
                <span class="text-dim">预计奖励积分：</span>
                <span class="star-icon small">✦</span>
                <strong>{{ rewardPreview }}</strong>
              </div>
              <button class="btn btn--outline" type="submit">
                创 建 任 务 <span class="diamond">◆</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  </div>
</template>
