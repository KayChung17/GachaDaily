const STORAGE_KEY = "starlit-todo-state";

const defaults = {
  currency: 0,
  tasks: [],
  cards: [],
  settings: {
    gachaCost: 100,
    rssUrl: "",
    activePage: "tasks",
    themeMode: "gorgeous",
    syncUrl: "http://127.0.0.1:8788/api/sync",
    syncToken: "",
    cardPool: [],
  },
};

const rarityWeights = [
  { rarity: "UR", weight: 3 },
  { rarity: "SSR", weight: 12 },
  { rarity: "SR", weight: 35 },
  { rarity: "R", weight: 50 },
];

const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const rewardPreview = document.getElementById("rewardPreview");
const gachaButton = document.getElementById("gachaButton");
const gachaCost = document.getElementById("gachaCost");
const cardWall = document.getElementById("cardWall");
const cardPreview = document.getElementById("cardPreview");
const cardGalleryOpen = document.getElementById("cardGalleryOpen");
const cardGalleryModal = document.getElementById("cardGalleryModal");
const cardZoom = document.getElementById("cardZoom");
const cardZoomImage = document.getElementById("cardZoomImage");
const cardZoomClose = document.getElementById("cardZoomClose");
const gachaRevealModal = document.getElementById("gachaRevealModal");
const gachaRevealImage = document.getElementById("gachaRevealImage");
const gachaRevealName = document.getElementById("gachaRevealName");
const gachaRevealClose = document.getElementById("gachaRevealClose");

const rssUrlInput = document.getElementById("rssUrl");
const rssSyncButton = document.getElementById("rssSyncButton");
const syncUrlInput = document.getElementById("syncUrl");
const syncTokenInput = document.getElementById("syncToken");
const syncPullButton = document.getElementById("syncPullButton");
const syncPushButton = document.getElementById("syncPushButton");
const syncStatus = document.getElementById("syncStatus");
const themeModeInput = document.getElementById("themeMode");

const deadlineInput = document.getElementById("taskDeadline");
const deadlinePicker = document.getElementById("deadlinePicker");
const deadlinePickerButton = document.getElementById("deadlinePickerButton");
const deadlinePickerLabel = document.getElementById("deadlinePickerLabel");
const deadlineFieldLabel = document.getElementById("deadlineFieldLabel");
const calendarPanel = document.getElementById("calendarPanel");
const calendarTitle = document.getElementById("calendarTitle");
const calendarDays = document.getElementById("calendarDays");
const calendarPrev = document.getElementById("calendarPrev");
const calendarNext = document.getElementById("calendarNext");
const clearDeadlineButton = document.getElementById("clearDeadlineButton");
const repeatPicker = document.getElementById("repeatPicker");
const repeatPickerButton = document.getElementById("repeatPickerButton");
const repeatPickerLabel = document.getElementById("repeatPickerLabel");
const repeatPanel = document.getElementById("repeatPanel");
const themePicker = document.getElementById("themePicker");
const themePickerButton = document.getElementById("themePickerButton");
const themePickerLabel = document.getElementById("themePickerLabel");
const themePanel = document.getElementById("themePanel");

const pageSections = Array.from(document.querySelectorAll(".page"));
const pageButtons = Array.from(document.querySelectorAll(".bottom-bar__item"));
const bgLayers = Array.from(document.querySelectorAll(".global-bg"));

const taskInputs = {
  title: document.getElementById("taskTitle"),
  deadline: deadlineInput,
  repeat: document.getElementById("taskRepeat"),
  importance: document.getElementById("taskImportance"),
  difficulty: document.getElementById("taskDifficulty"),
};

let state = loadState();
let calendarViewYear = 0;
let calendarViewMonth = 0;
let selectedDeadlineDate = null;
let isGachaAnimating = false;

const repeatLabels = {
  none: "不循环",
  daily: "每天",
  weekly: "每周",
  monthly: "每月",
};

const themeLabels = {
  gorgeous: "华丽",
  minimal: "简约",
};

function normalizeState(raw) {
  return {
    ...structuredClone(defaults),
    ...(raw || {}),
    settings: {
      ...structuredClone(defaults.settings),
      ...((raw && raw.settings) || {}),
    },
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaults);
  try {
    return normalizeState(JSON.parse(saved));
  } catch (error) {
    console.warn("本地数据解析失败，已重置。", error);
    return structuredClone(defaults);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDate(value) {
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

function toDateInputValue(date) {
  const local = new Date(date);
  const offset = local.getTimezoneOffset();
  local.setMinutes(local.getMinutes() - offset);
  return local.toISOString().slice(0, 10);
}

function deadlineFromDateInput(dateValue) {
  if (!dateValue) return null;
  const base = new Date(`${dateValue}T00:00:00`);
  base.setHours(23, 59, 0, 0);
  return base;
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function rewardForTask(task, completedAt = new Date()) {
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

function setSyncStatus(message) {
  if (syncStatus) syncStatus.textContent = message;
}

function updateSettings() {
  if (rssUrlInput) state.settings.rssUrl = rssUrlInput.value.trim();
  if (syncUrlInput) state.settings.syncUrl = syncUrlInput.value.trim();
  if (syncTokenInput) state.settings.syncToken = syncTokenInput.value.trim();
  if (themeModeInput) state.settings.themeMode = themeModeInput.value;
  saveState();
}

function updateRewardPreview() {
  if (!rewardPreview || !taskInputs.importance || !taskInputs.difficulty) return;
  const previewDeadline = taskInputs.deadline
    ? deadlineFromDateInput(taskInputs.deadline.value)
    : null;
  const previewTask = {
    difficulty: taskInputs.difficulty.value,
    importance: taskInputs.importance.value,
    repeat: taskInputs.repeat ? taskInputs.repeat.value : "none",
    deadline: previewDeadline ? previewDeadline.toISOString() : "",
  };
  rewardPreview.textContent = rewardForTask(previewTask);
}

function shiftDeadline(deadline, repeat) {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return deadline;
  if (repeat === "daily") date.setDate(date.getDate() + 1);
  if (repeat === "weekly") date.setDate(date.getDate() + 7);
  if (repeat === "monthly") date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

function addTask(event) {
  event.preventDefault();
  if (!taskInputs.title || !taskInputs.deadline) return;
  const title = taskInputs.title.value.trim();
  if (!title) return;
  const repeatValue = taskInputs.repeat ? taskInputs.repeat.value : "none";
  const deadlineValue = taskInputs.deadline.value;
  if (repeatValue !== "none" && !deadlineValue) {
    alert("循环任务请先设置循环截止时间。");
    return;
  }
  const deadlineDate = deadlineFromDateInput(deadlineValue);

  const task = {
    id: crypto.randomUUID(),
    title,
    deadline: deadlineDate ? deadlineDate.toISOString() : "",
    repeat: repeatValue,
    importance: Number(taskInputs.importance ? taskInputs.importance.value : 3),
    difficulty: Number(taskInputs.difficulty ? taskInputs.difficulty.value : 3),
    createdAt: new Date().toISOString(),
    completedAt: "",
    reward: 0,
  };

  state.tasks.unshift(task);
  saveState();
  if (taskForm) taskForm.reset();
  setSelectedRepeat("none", false);
  if (taskInputs.importance) taskInputs.importance.value = "3";
  if (taskInputs.difficulty) taskInputs.difficulty.value = "3";
  clearSelectedDeadline();
  render();
  updateRewardPreview();
}

function completeTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task || task.completedAt) return;

  const now = new Date();
  task.completedAt = now.toISOString();
  task.reward = rewardForTask(task, now);
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

  saveState();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  saveState();
  render();
}

function chooseRarity() {
  const total = rarityWeights.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of rarityWeights) {
    if (roll < item.weight) return item.rarity;
    roll -= item.weight;
  }
  return "SR";
}

function drawCard() {
  if (isGachaAnimating) return;
  const pool = state.settings.cardPool.filter((card) => card.imageUrl && card.imageUrl.trim());
  if (!pool.length) {
    alert("先去同步RSS把老婆们装进卡池啊");
    return;
  }

  const drawnImageSet = new Set(
    state.cards
      .map((card) => (card.imageUrl || "").trim())
      .filter(Boolean)
  );
  const availablePool = pool.filter((card) => !drawnImageSet.has((card.imageUrl || "").trim()));
  if (!availablePool.length) {
    alert("本期卡池真的一滴也不剩了~请前往配置页更新轮换池");
    return;
  }

  if (state.currency < state.settings.gachaCost) {
    alert("赶紧滚去<del>打工</del>做任务攒积分");
    return;
  }

  state.currency -= state.settings.gachaCost;
  const rarity = chooseRarity();
  const rarityPool = availablePool.filter((card) => card.rarity === rarity);
  const sourcePool = rarityPool.length ? rarityPool : availablePool;
  const source = sourcePool[Math.floor(Math.random() * sourcePool.length)];

  const drawnCard = {
    id: crypto.randomUUID(),
    name: source.name || "未知卡面",
    rarity,
    imageUrl: source.imageUrl,
    obtainedAt: new Date().toISOString(),
  };
  state.cards.unshift(drawnCard);
  saveState();
  render();
  isGachaAnimating = true;
  openGachaReveal(drawnCard);
}

function parseRssItems(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");
  const items = Array.from(xml.querySelectorAll("item"));
  return items.flatMap((item) => {
    const title = item.querySelector("title")?.textContent?.trim() || "未命名";
    const link = item.querySelector("link")?.textContent?.trim() || "";
    const author = item.querySelector("author")?.textContent?.trim() || "";
    const desc = item.querySelector("description")?.textContent || "";
    const html = new DOMParser().parseFromString(desc, "text/html");
    const images = Array.from(html.querySelectorAll("img"))
      .map((img) => img.getAttribute("src"))
      .filter(Boolean);
    return images.map((src, i) => ({
      name: images.length > 1 ? `${title} #${i + 1}` : title,
      imageUrl: src,
      rarity: "SR",
      sourceLink: link,
      author,
    }));
  });
}

async function syncRssToPool() {
  if (!rssUrlInput) return;
  const url = rssUrlInput.value.trim();
  if (!url) {
    alert("请先填写 RSS 订阅链接。");
    return;
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      alert(`RSS 请求失败: ${res.status}`);
      return;
    }
    const cards = parseRssItems(await res.text());
    if (!cards.length) {
      alert("没有解析到可用图片。");
      return;
    }

    const existing = new Set(state.settings.cardPool.map((card) => card.imageUrl));
    const newCards = cards.filter((card) => !existing.has(card.imageUrl));
    if (!newCards.length) {
      alert("画师还在摸鱼，去干点别的吧。");
      return;
    }

    newCards.forEach((card) => {
      state.settings.cardPool.unshift({
        id: crypto.randomUUID(),
        name: card.name,
        imageUrl: card.imageUrl,
        rarity: card.rarity,
        sourceLink: card.sourceLink,
        author: card.author,
      });
    });
    saveState();
    render();
    alert(`已加入 ${newCards.length} 张新卡面。`);
  } catch (error) {
    alert(`RSS 同步失败: ${error.message}`);
  }
}

function getSyncPayload() {
  const payload = normalizeState(state);
  payload.settings.syncToken = "";
  return payload;
}

async function syncPull() {
  if (!syncUrlInput) return;
  const url = syncUrlInput.value.trim();
  if (!url) {
    alert("请先填写同步服务地址。");
    return;
  }
  setSyncStatus("正在拉取...");
  try {
    const token = syncTokenInput ? syncTokenInput.value.trim() : "";
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) {
      setSyncStatus(`拉取失败: ${res.status}`);
      return;
    }
    const data = await res.json();
    if (!data || !data.payload) {
      setSyncStatus("服务器无有效数据");
      return;
    }
    if (!confirm("将覆盖本地数据，是否继续？")) {
      setSyncStatus("已取消");
      return;
    }
    const incoming = normalizeState(data.payload);
    incoming.settings.syncUrl = state.settings.syncUrl;
    incoming.settings.syncToken = state.settings.syncToken;
    state = incoming;
    saveState();
    render();
    setActivePage(state.settings.activePage || "tasks");
    updateRewardPreview();
    setSyncStatus("拉取完成");
  } catch (error) {
    setSyncStatus(`拉取失败: ${error.message}`);
  }
}

async function syncPush() {
  if (!syncUrlInput) return;
  const url = syncUrlInput.value.trim();
  if (!url) {
    alert("请先填写同步服务地址。");
    return;
  }
  setSyncStatus("正在上传...");
  try {
    const token = syncTokenInput ? syncTokenInput.value.trim() : "";
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        updatedAt: new Date().toISOString(),
        payload: getSyncPayload(),
      }),
    });
    if (!res.ok) {
      setSyncStatus(`上传失败: ${res.status}`);
      return;
    }
    setSyncStatus("上传完成");
  } catch (error) {
    setSyncStatus(`上传失败: ${error.message}`);
  }
}

function applyBackgroundTheme(activePage) {
  const mode = state.settings.themeMode === "minimal" ? "minimal" : "gorgeous";
  const targetPage = activePage || state.settings.activePage || "tasks";
  document.body.dataset.theme = mode;

  bgLayers.forEach((bg) => {
    bg.classList.remove("is-active");
  });

  if (mode === "minimal") {
    const minimalLayer = document.getElementById("bg-minimal");
    if (minimalLayer) minimalLayer.classList.add("is-active");
    return;
  }

  const pageLayer = document.getElementById(`bg-${targetPage}`);
  if (pageLayer) pageLayer.classList.add("is-active");
}

function setActivePage(page) {
  const target = page || "tasks";
  state.settings.activePage = target;
  saveState();
  if (target !== "cards") {
    closeCardGallery();
    closeGachaReveal();
  }

  pageSections.forEach((section) => {
    section.classList.toggle("is-active", section.dataset.page === target);
  });
  pageButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.target === target);
  });
  applyBackgroundTheme(target);
  if (target === "cards") renderCards();
}

function updateDeadlineLabel() {
  if (!deadlinePickerLabel) return;
  if (!selectedDeadlineDate) {
    deadlinePickerLabel.textContent = taskInputs.repeat && taskInputs.repeat.value !== "none"
      ? "请选择循环截止时间"
      : "不设置截止日期";
    return;
  }
  const today = new Date();
  deadlinePickerLabel.textContent = isSameDate(today, selectedDeadlineDate)
    ? `今天 · ${toDateInputValue(selectedDeadlineDate)}`
    : toDateInputValue(selectedDeadlineDate);
}

function updateDeadlineFieldLabel() {
  if (!deadlineFieldLabel) return;
  deadlineFieldLabel.textContent =
    taskInputs.repeat && taskInputs.repeat.value !== "none"
      ? "循环截止时间"
      : "截止日期（可选）";
}

function renderCalendar() {
  if (!calendarTitle || !calendarDays) return;
  calendarTitle.textContent = `${calendarViewYear}年 ${calendarViewMonth + 1}月`;

  const first = new Date(calendarViewYear, calendarViewMonth, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
  const daysPrev = new Date(calendarViewYear, calendarViewMonth, 0).getDate();
  const today = new Date();
  calendarDays.innerHTML = "";

  for (let i = 0; i < 42; i += 1) {
    const n = i - offset + 1;
    let date;
    let other = false;
    if (n < 1) {
      date = new Date(calendarViewYear, calendarViewMonth - 1, daysPrev + n);
      other = true;
    } else if (n > daysInMonth) {
      date = new Date(calendarViewYear, calendarViewMonth + 1, n - daysInMonth);
      other = true;
    } else {
      date = new Date(calendarViewYear, calendarViewMonth, n);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "calendar-day";
    btn.textContent = String(date.getDate());
    btn.dataset.date = toDateInputValue(date);
    if (other) btn.classList.add("is-other");
    if (isSameDate(date, today)) btn.classList.add("is-today");
    if (selectedDeadlineDate && isSameDate(date, selectedDeadlineDate)) btn.classList.add("is-selected");
    calendarDays.appendChild(btn);
  }
}

function setSelectedDeadline(date) {
  const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  selectedDeadlineDate = selected;
  calendarViewYear = selected.getFullYear();
  calendarViewMonth = selected.getMonth();
  if (deadlineInput) deadlineInput.value = toDateInputValue(selected);
  updateDeadlineLabel();
  renderCalendar();
  updateRewardPreview();
}

function clearSelectedDeadline() {
  selectedDeadlineDate = null;
  const now = new Date();
  calendarViewYear = now.getFullYear();
  calendarViewMonth = now.getMonth();
  if (deadlineInput) deadlineInput.value = "";
  updateDeadlineLabel();
  renderCalendar();
  updateRewardPreview();
}

function toggleCalendar(open) {
  if (!calendarPanel) return;
  const nextOpen = open ?? !calendarPanel.classList.contains("is-open");
  if (nextOpen) {
    toggleRepeatPanel(false);
    toggleThemePanel(false);
  }
  calendarPanel.classList.toggle("is-open", nextOpen);
  calendarPanel.setAttribute("aria-hidden", nextOpen ? "false" : "true");
  if (nextOpen) renderCalendar();
}

function setSelectedRepeat(value, emitChange = true) {
  const next = Object.prototype.hasOwnProperty.call(repeatLabels, value) ? value : "none";
  if (taskInputs.repeat) taskInputs.repeat.value = next;
  if (repeatPickerLabel) repeatPickerLabel.textContent = repeatLabels[next];
  updateDeadlineFieldLabel();
  updateDeadlineLabel();
  if (repeatPanel) {
    repeatPanel.querySelectorAll(".repeat-option").forEach((btn) => {
      if (!(btn instanceof HTMLButtonElement)) return;
      btn.classList.toggle("is-selected", btn.dataset.repeat === next);
    });
  }
  if (emitChange && taskInputs.repeat) {
    taskInputs.repeat.dispatchEvent(new Event("change"));
  }
}

function toggleRepeatPanel(open) {
  if (!repeatPanel) return;
  const nextOpen = open ?? !repeatPanel.classList.contains("is-open");
  if (nextOpen) {
    toggleCalendar(false);
    toggleThemePanel(false);
  }
  repeatPanel.classList.toggle("is-open", nextOpen);
  repeatPanel.setAttribute("aria-hidden", nextOpen ? "false" : "true");
}

function setSelectedTheme(value, emitChange = true) {
  const next = Object.prototype.hasOwnProperty.call(themeLabels, value) ? value : "gorgeous";
  if (themeModeInput) themeModeInput.value = next;
  if (themePickerLabel) themePickerLabel.textContent = themeLabels[next];
  if (themePanel) {
    themePanel.querySelectorAll(".theme-option").forEach((btn) => {
      if (!(btn instanceof HTMLButtonElement)) return;
      btn.classList.toggle("is-selected", btn.dataset.theme === next);
    });
  }
  if (emitChange && themeModeInput) {
    themeModeInput.dispatchEvent(new Event("change"));
  }
}

function toggleThemePanel(open) {
  if (!themePanel) return;
  const nextOpen = open ?? !themePanel.classList.contains("is-open");
  if (nextOpen) {
    toggleCalendar(false);
    toggleRepeatPanel(false);
  }
  themePanel.classList.toggle("is-open", nextOpen);
  themePanel.setAttribute("aria-hidden", nextOpen ? "false" : "true");
}

function openCardGallery() {
  if (!cardGalleryModal) return;
  cardGalleryModal.classList.add("is-open");
  cardGalleryModal.setAttribute("aria-hidden", "false");
}

function closeCardGallery() {
  if (!cardGalleryModal) return;
  closeCardZoom();
  cardGalleryModal.classList.remove("is-open");
  cardGalleryModal.setAttribute("aria-hidden", "true");
}

function openCardZoom(imageUrl, imageName = "卡面大图") {
  if (!cardZoom || !cardZoomImage) return;
  cardZoomImage.src = imageUrl;
  cardZoomImage.alt = imageName;
  cardZoom.classList.add("is-open");
  cardZoom.setAttribute("aria-hidden", "false");
}

function closeCardZoom() {
  if (!cardZoom || !cardZoomImage) return;
  cardZoom.classList.remove("is-open");
  cardZoom.setAttribute("aria-hidden", "true");
  cardZoomImage.src = "";
}

function openGachaReveal(card) {
  if (!gachaRevealModal || !gachaRevealImage || !gachaRevealName) {
    isGachaAnimating = false;
    if (gachaButton) gachaButton.disabled = false;
    return;
  }
  if (gachaButton) gachaButton.disabled = true;
  gachaRevealName.textContent = "";
  gachaRevealImage.src = "img/waiting.png";
  gachaRevealImage.classList.remove("is-spinning");
  gachaRevealModal.classList.add("is-open");
  gachaRevealModal.setAttribute("aria-hidden", "false");

  // Force reflow so animation restarts every draw.
  void gachaRevealImage.offsetWidth;
  gachaRevealImage.classList.add("is-spinning");

  window.setTimeout(() => {
    gachaRevealImage.classList.remove("is-spinning");
    gachaRevealImage.src = card.imageUrl;
    gachaRevealName.textContent = `${card.rarity} · ${card.name}`;
    isGachaAnimating = false;
  }, 2200);
}

function closeGachaReveal() {
  if (!gachaRevealModal || !gachaRevealImage || !gachaRevealName) return;
  gachaRevealModal.classList.remove("is-open");
  gachaRevealModal.setAttribute("aria-hidden", "true");
  gachaRevealImage.classList.remove("is-spinning");
  gachaRevealImage.src = "";
  gachaRevealName.textContent = "";
  isGachaAnimating = false;
  if (gachaButton) gachaButton.disabled = false;
}

function getCardPreviewLayout() {
  if (!cardPreview) return { cols: 4, count: 4 };
  const minWidth = 88;
  const gap = 10;
  const ratio = 2 / 3;
  const width = cardPreview.clientWidth;
  const height = cardPreview.clientHeight;
  if (!width || !height) return { cols: 4, count: 4 };

  const cols = Math.max(1, Math.floor((width + gap) / (minWidth + gap)));
  const itemWidth = (width - (cols - 1) * gap) / cols;
  const itemHeight = itemWidth / ratio;
  const rows = Math.max(1, Math.floor((height + gap) / (itemHeight + gap)));
  return { cols, count: Math.max(1, cols * rows) };
}

function dedupeCardsByImage(cards) {
  const seen = new Set();
  const unique = [];
  cards.forEach((card) => {
    const key = (card.imageUrl || "").trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(card);
  });
  return unique;
}

function renderTasks() {
  if (!taskList) return;
  if (!state.tasks.length) {
    taskList.innerHTML = `<div class="note-box">还没有任务，快创建一个吧。</div>`;
    return;
  }

  taskList.innerHTML = "";
  state.tasks.forEach((task) => {
    const card = document.createElement("div");
    card.className = "task-card";

    const pendingReward = `${rewardForTask(task)}◆`;
    const statusText = task.completedAt ? "已完成" : pendingReward;
    const statusClass = task.completedAt ? " is-done" : "";
    const rewardText = task.completedAt ? `奖励 +${task.reward}` : "未结算";
    const deadlineText = formatDate(task.deadline);
    const completeDisabledAttr = task.completedAt ? 'disabled aria-disabled="true"' : "";
    const completeLabel = task.completedAt ? "已完成" : "完成任务";

    card.innerHTML = `
      <div class="task-card__title">${task.title}</div>
      <div class="task-card__footer">
        <div class="task-card__actions">
          <button class="btn btn--hollow" data-action="complete" data-id="${task.id}" ${completeDisabledAttr}>
            ${completeLabel}
          </button>
          <button class="btn btn--outline" data-action="delete" data-id="${task.id}">
            删除
          </button>
        </div>
        <div class="task-card__info">
          <div class="task-card__status-row">
            <span class="task-card__status${statusClass}">${statusText}</span>
            <span class="task-card__info-item">截止：${deadlineText}</span>
            <span class="task-card__info-item">${rewardText}</span>
          </div>
          <div class="task-card__meta-row">
            <span class="badge">${task.repeat === "none" ? "不循环" : task.repeat}</span>
            <span class="badge">重要度 ${task.importance}</span>
          </div>
        </div>
      </div>
    `;
    taskList.appendChild(card);
  });
}

function renderCards() {
  if (!cardWall || !cardPreview) return;
  const displayCards = dedupeCardsByImage(state.cards);

  if (!displayCards.length) {
    const emptyText = `<div class="note-box">还没有卡面，小资历真丢人啊</div>`;
    cardPreview.style.setProperty("--preview-count", "1");
    cardPreview.style.setProperty("--preview-cols", "1");
    cardPreview.innerHTML = emptyText;
    cardWall.innerHTML = emptyText;
    return;
  }

  cardPreview.innerHTML = "";
  const previewLayout = getCardPreviewLayout();
  cardPreview.style.setProperty("--preview-count", String(previewLayout.count));
  cardPreview.style.setProperty("--preview-cols", String(previewLayout.cols));
  displayCards.slice(0, previewLayout.count).forEach((card) => {
    const item = document.createElement("div");
    item.className = "card-preview-item";
    item.innerHTML = `<img src="${card.imageUrl}" alt="${card.name}" />`;
    cardPreview.appendChild(item);
  });

  cardWall.innerHTML = "";
  displayCards.forEach((card) => {
    const item = document.createElement("div");
    item.className = "card-item";
    item.innerHTML = `
      <img src="${card.imageUrl}" alt="${card.name}" />
      <div class="rarity-tag rarity-${card.rarity}"><span>${card.rarity}</span></div>
      <div class="card-item__body">
        <div class="card-item__title">${card.name}</div>
      </div>
    `;
    cardWall.appendChild(item);
  });
}

function renderHeader() {
  document.querySelectorAll(".currency-amount").forEach((node) => {
    node.textContent = String(state.currency);
  });
  if (gachaCost) gachaCost.textContent = String(state.settings.gachaCost);
  if (rssUrlInput) rssUrlInput.value = state.settings.rssUrl || "";
  if (syncUrlInput) syncUrlInput.value = state.settings.syncUrl || "";
  if (syncTokenInput) syncTokenInput.value = state.settings.syncToken || "";
  setSelectedTheme(state.settings.themeMode || "gorgeous", false);
}

function render() {
  renderHeader();
  renderTasks();
  renderCards();
}

if (taskForm) taskForm.addEventListener("submit", addTask);
if (gachaButton) gachaButton.addEventListener("click", drawCard);
if (rssUrlInput) rssUrlInput.addEventListener("change", updateSettings);
if (rssSyncButton) rssSyncButton.addEventListener("click", syncRssToPool);
if (syncUrlInput) syncUrlInput.addEventListener("change", updateSettings);
if (syncTokenInput) syncTokenInput.addEventListener("change", updateSettings);
if (themeModeInput) {
  themeModeInput.addEventListener("change", () => {
    updateSettings();
    applyBackgroundTheme(state.settings.activePage || "tasks");
  });
}
if (syncPullButton) syncPullButton.addEventListener("click", syncPull);
if (syncPushButton) syncPushButton.addEventListener("click", syncPush);

if (taskInputs.importance) taskInputs.importance.addEventListener("input", updateRewardPreview);
if (taskInputs.difficulty) taskInputs.difficulty.addEventListener("input", updateRewardPreview);
if (taskInputs.repeat) taskInputs.repeat.addEventListener("change", updateRewardPreview);

if (taskList) {
  taskList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const id = target.dataset.id;
    const action = target.dataset.action;
    if (!id) return;
    if (action === "complete") completeTask(id);
    if (action === "delete") deleteTask(id);
  });
}

if (cardGalleryOpen) {
  cardGalleryOpen.addEventListener("click", openCardGallery);
  cardGalleryOpen.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCardGallery();
    }
  });
}
if (cardGalleryModal) {
  cardGalleryModal.addEventListener("click", (event) => {
    if (event.target === cardGalleryModal) closeCardGallery();
  });
}
if (cardWall) {
  cardWall.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const image = target.closest(".card-item img");
    if (!(image instanceof HTMLImageElement)) return;
    if (!image.src) return;
    openCardZoom(image.src, image.alt || "卡面大图");
  });
}
if (cardZoomClose) {
  cardZoomClose.addEventListener("click", closeCardZoom);
}
if (cardZoom) {
  cardZoom.addEventListener("click", (event) => {
    if (event.target === cardZoom) closeCardZoom();
  });
}
if (gachaRevealClose) {
  gachaRevealClose.addEventListener("click", closeGachaReveal);
}
if (gachaRevealModal) {
  gachaRevealModal.addEventListener("click", (event) => {
    if (event.target === gachaRevealModal) closeGachaReveal();
  });
}

pageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.target;
    if (target) setActivePage(target);
  });
});

if (deadlinePickerButton) {
  deadlinePickerButton.addEventListener("click", () => toggleCalendar());
}
if (clearDeadlineButton) {
  clearDeadlineButton.addEventListener("click", () => {
    clearSelectedDeadline();
    toggleCalendar(false);
  });
}
if (repeatPickerButton) {
  repeatPickerButton.addEventListener("click", () => toggleRepeatPanel());
}
if (repeatPanel) {
  repeatPanel.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest(".repeat-option");
    if (!(button instanceof HTMLButtonElement)) return;
    const value = button.dataset.repeat || "none";
    setSelectedRepeat(value);
    toggleRepeatPanel(false);
  });
}
if (themePickerButton) {
  themePickerButton.addEventListener("click", () => toggleThemePanel());
}
if (themePanel) {
  themePanel.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest(".theme-option");
    if (!(button instanceof HTMLButtonElement)) return;
    const value = button.dataset.theme || "gorgeous";
    setSelectedTheme(value);
    toggleThemePanel(false);
  });
}
if (calendarPrev) {
  calendarPrev.addEventListener("click", () => {
    if (calendarViewMonth === 0) {
      calendarViewMonth = 11;
      calendarViewYear -= 1;
    } else {
      calendarViewMonth -= 1;
    }
    renderCalendar();
  });
}
if (calendarNext) {
  calendarNext.addEventListener("click", () => {
    if (calendarViewMonth === 11) {
      calendarViewMonth = 0;
      calendarViewYear += 1;
    } else {
      calendarViewMonth += 1;
    }
    renderCalendar();
  });
}
if (calendarDays) {
  calendarDays.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const value = target.dataset.date;
    if (!value) return;
    setSelectedDeadline(new Date(`${value}T00:00:00`));
    toggleCalendar(false);
  });
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (calendarPanel && calendarPanel.classList.contains("is-open")) {
    if (!(deadlinePicker && deadlinePicker.contains(target))) toggleCalendar(false);
  }
  if (repeatPanel && repeatPanel.classList.contains("is-open")) {
    if (!(repeatPicker && repeatPicker.contains(target))) toggleRepeatPanel(false);
  }
  if (themePanel && themePanel.classList.contains("is-open")) {
    if (!(themePicker && themePicker.contains(target))) toggleThemePanel(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (themePanel && themePanel.classList.contains("is-open")) {
    toggleThemePanel(false);
    return;
  }
  if (repeatPanel && repeatPanel.classList.contains("is-open")) {
    toggleRepeatPanel(false);
    return;
  }
  if (gachaRevealModal && gachaRevealModal.classList.contains("is-open")) {
    closeGachaReveal();
    return;
  }
  if (cardZoom && cardZoom.classList.contains("is-open")) {
    closeCardZoom();
    return;
  }
  closeCardGallery();
});

window.addEventListener("resize", () => {
  if (state.settings.activePage === "cards") renderCards();
});

render();
setActivePage(state.settings.activePage || "tasks");
setSelectedRepeat(taskInputs.repeat ? taskInputs.repeat.value : "none", false);
if (deadlineInput && deadlineInput.value) {
  const initialDeadline = deadlineFromDateInput(deadlineInput.value);
  if (initialDeadline) {
    setSelectedDeadline(initialDeadline);
  } else {
    clearSelectedDeadline();
  }
} else {
  clearSelectedDeadline();
}
updateRewardPreview();
