const STORAGE_KEY = "habitbloom:data:v1";

const MOTIVATIONAL_MESSAGES = [
  "Great job! Keep going ✨",
  "One step closer 🌷",
  "Consistency wins 💪",
  "You're building momentum 🚀"
];

const NEW_HABIT_MESSAGE = "Nice! New habit added 🌸";
const REMOVED_MESSAGE = "Habit removed. Fresh start 💜";
const STREAK_SAVED_MESSAGE = "🔥 Streak saved!";

const state = loadState();
hydrateHabits();

let lastAddedId = null;
let pendingDeleteId = null;

const form = document.getElementById("habit-form");
const input = document.getElementById("habit-name");
const startInput = document.getElementById("habit-start");
const habitListEl = document.getElementById("habit-list");
const emptyStateEl = document.getElementById("empty-state");
const statsPercentEl = document.getElementById("stats-percent");
const statsDetailEl = document.getElementById("stats-detail");
const statsBarEl = document.getElementById("stats-bar");
const statsHintEl = document.getElementById("stats-hint");
const toastContainer = document.getElementById("toast-container");
const modalEl = document.getElementById("confirm-modal");

form.addEventListener("submit", handleAddHabit);
habitListEl.addEventListener("change", handleHabitInputChange);
habitListEl.addEventListener("click", handleHabitClick);
modalEl.addEventListener("click", handleModalClick);
document.addEventListener("keydown", handleKeydown);

startInput.value = getTodayKey();
render();

function handleAddHabit(event) {
  event.preventDefault();
  const name = input.value.trim();
  const startDate = startInput.value || getTodayKey();

  if (!name) {
    showToast("Please enter a habit name.", "warn");
    return;
  }

  if (!startDate) {
    showToast("Please select a start date.", "warn");
    return;
  }

  if (name.length > 40) {
    showToast("Keep it under 40 characters.", "warn");
    return;
  }

  const isDuplicate = state.habits.some(
    (habit) => habit.name.trim().toLowerCase() === name.toLowerCase()
  );

  if (isDuplicate) {
    showToast("You already have a habit with that name.", "warn");
  }

  const habit = {
    id: createId(),
    name,
    createdAt: Date.now(),
    firstCompletedAt: null,
    startDate
  };

  state.habits.unshift(habit);
  state.completions[habit.id] = {};
  saveState();
  lastAddedId = habit.id;
  render();
  showToast(NEW_HABIT_MESSAGE, "success");

  form.reset();
  input.focus();
  startInput.value = getTodayKey();
}

function handleHabitInputChange(event) {
  if (event.target.matches("input[data-action='toggle']")) {
    const habitId = event.target.dataset.id;
    const habit = state.habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }

    const todayKey = getTodayKey();
    if (todayKey < habit.startDate) {
      event.target.checked = false;
      return;
    }

    const completions = state.completions[habitId] || {};
    const wasDone = !!completions[todayKey];

    if (event.target.checked) {
      completions[todayKey] = true;
      state.completions[habitId] = completions;

      if (!wasDone) {
        showToast(randomMotivation(), "success");
        const yesterdayKey = formatLocalDate(addDays(new Date(), -1));
        if (yesterdayKey >= habit.startDate && completions[yesterdayKey]) {
          showToast(STREAK_SAVED_MESSAGE, "streak");
        }
      }
    } else {
      delete completions[todayKey];
      state.completions[habitId] = completions;
    }

    syncFirstCompletion(habitId, completions);
    saveState();
    render();
    return;
  }

  if (event.target.matches("input[data-action='edit-start-date']")) {
    const habitId = event.target.dataset.id;
    const habit = state.habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }

    const newStartDate = event.target.value;
    if (!newStartDate) {
      showToast("Please select a start date.", "warn");
      return;
    }

    habit.startDate = newStartDate;
    syncFirstCompletion(habitId, state.completions[habitId] || {});
    saveState();
    render();
  }
}

function handleHabitClick(event) {
  const deleteButton = event.target.closest("[data-action='delete-habit']");
  if (!deleteButton) {
    return;
  }

  const habitId = deleteButton.dataset.id;
  openModal(habitId);
}

function handleModalClick(event) {
  const action = event.target.dataset.action;
  if (!action) {
    return;
  }

  if (action === "close-modal" || action === "cancel-delete") {
    closeModal();
    return;
  }

  if (action === "confirm-delete" && pendingDeleteId) {
    deleteHabit(pendingDeleteId);
  }
}

function handleKeydown(event) {
  if (event.key === "Escape" && modalEl.classList.contains("is-open")) {
    closeModal();
  }
}

function openModal(habitId) {
  pendingDeleteId = habitId;
  modalEl.classList.add("is-open");
  modalEl.setAttribute("aria-hidden", "false");
}

function closeModal() {
  pendingDeleteId = null;
  modalEl.classList.remove("is-open");
  modalEl.setAttribute("aria-hidden", "true");
}

function deleteHabit(habitId) {
  state.habits = state.habits.filter((habit) => habit.id !== habitId);
  delete state.completions[habitId];
  saveState();
  render();
  closeModal();
  showToast(REMOVED_MESSAGE, "success");
}

function render() {
  updateStats();
  renderHabits();
}

function updateStats() {
  const days = getLast7Days();
  let totalPossible = 0;
  let completed = 0;

  state.habits.forEach((habit) => {
    const startDate = habit.startDate || getTodayKey();
    const completions = state.completions[habit.id] || {};
    days.forEach((day) => {
      if (day.key >= startDate) {
        totalPossible += 1;
        if (completions[day.key]) {
          completed += 1;
        }
      }
    });
  });

  const percent = totalPossible ? Math.round((completed / totalPossible) * 100) : 0;

  statsPercentEl.textContent = percent;
  statsDetailEl.textContent = `Completed: ${completed} / ${totalPossible} check-ins`;
  statsBarEl.style.width = `${percent}%`;
  if (!state.habits.length) {
    statsHintEl.textContent = "Add habits to start tracking.";
  } else if (totalPossible === 0) {
    statsHintEl.textContent = "No eligible days yet. Check start dates.";
  }
  statsHintEl.classList.toggle("is-hidden", totalPossible > 0);
}

function renderHabits() {
  if (!state.habits.length) {
    emptyStateEl.style.display = "grid";
    habitListEl.innerHTML = "";
    return;
  }

  emptyStateEl.style.display = "none";
  const days = getLast7Days();
  const today = new Date();
  const todayKey = formatLocalDate(today);

  const habitsMarkup = state.habits
    .map((habit) => {
      const completions = state.completions[habit.id] || {};
      const startDate = habit.startDate || getTodayKey();
      const { streak, doneToday, isFutureStart } = calculateStreak(
        completions,
        today,
        startDate
      );
      const isEligibleToday = todayKey >= startDate;
      const streakLabel = `Streak: ${streak} day${streak === 1 ? "" : "s"} 🔥`;
      const startVerb = isFutureStart ? "Starts on" : "Started:";
      const storedFirst =
        habit.firstCompletedAt && habit.firstCompletedAt >= startDate
          ? habit.firstCompletedAt
          : null;
      const firstCompletion =
        storedFirst || getFirstCompletionDate(completions, startDate);
      const firstCompletionText = firstCompletion
        ? formatDisplayDate(firstCompletion)
        : "Not yet completed";
      const dayPills = days
        .map((day) => {
          const isEligible = day.key >= startDate;
          const done = isEligible && !!completions[day.key];
          const status = isEligible ? (done ? "Completed" : "Not completed") : "Not started";
          const label = `${day.long} - ${status}`;
          return `
            <span
              class="day-pill ${done ? "is-complete" : ""} ${
                isEligible ? "" : "is-disabled"
              }"
              title="${label}"
              aria-label="${label}"
            >${day.short}</span>
          `;
        })
        .join("");

      return `
        <article class="habit-card card ${lastAddedId === habit.id ? "is-new" : ""}">
          <div class="habit-card__top">
            <div>
              <h3 class="habit-name">${escapeHtml(habit.name)}</h3>
              <span class="streak-badge">${streakLabel}</span>
              <p class="start-label">
                ${startVerb} <span>${escapeHtml(startDate)}</span>
              </p>
              <label class="date-label" for="start-${habit.id}">Edit start date</label>
              <input
                class="start-date-input"
                type="date"
                id="start-${habit.id}"
                data-action="edit-start-date"
                data-id="${habit.id}"
                value="${startDate}"
              >
              <p class="first-done">First done: ${escapeHtml(firstCompletionText)}</p>
            </div>
            <button
              class="icon-button"
              type="button"
              data-action="delete-habit"
              data-id="${habit.id}"
              aria-label="Delete habit"
            >
              <span aria-hidden="true">🗑</span>
            </button>
          </div>
          <div class="habit-card__actions">
            <label class="toggle">
              <input
                type="checkbox"
                data-action="toggle"
                data-id="${habit.id}"
                ${doneToday ? "checked" : ""}
                ${isEligibleToday ? "" : "disabled"}
              >
              <span class="toggle__track"></span>
              <span class="toggle__text">Done today</span>
            </label>
          </div>
          <div class="habit-card__history">
            <span class="history-label">Last 7 days</span>
            <div class="day-pill-row">${dayPills}</div>
          </div>
        </article>
      `;
    })
    .join("");

  habitListEl.innerHTML = habitsMarkup;
  lastAddedId = null;
}

function calculateStreak(completions, todayDate, startDate) {
  const todayKey = formatLocalDate(todayDate);
  const isFutureStart = todayKey < startDate;
  const doneToday = !isFutureStart && !!completions[todayKey];
  let streak = 0;
  let cursor = doneToday ? todayDate : addDays(todayDate, -1);

  while (cursor) {
    const key = formatLocalDate(cursor);
    if (key < startDate) {
      break;
    }
    if (completions[key]) {
      streak += 1;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }

  return { streak, doneToday, isFutureStart };
}

function getLast7Days() {
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i -= 1) {
    const date = addDays(today, -i);
    days.push({
      key: formatLocalDate(date),
      short: date.toLocaleDateString("en-US", { weekday: "short" }),
      long: date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric"
      })
    });
  }

  return days;
}

function randomMotivation() {
  const index = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
  return MOTIVATIONAL_MESSAGES[index];
}

function showToast(message, variant = "default") {
  const toast = document.createElement("div");
  toast.className = "toast";

  if (variant === "warn") {
    toast.classList.add("toast--warn");
  }

  if (variant === "success") {
    toast.classList.add("toast--success");
  }

  if (variant === "streak") {
    toast.classList.add("toast--streak");
  }

  toast.textContent = message;
  toast.setAttribute("role", "status");
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function loadState() {
  const defaultState = { habits: [], completions: {} };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }

    const parsed = JSON.parse(raw);

    return {
      habits: Array.isArray(parsed.habits) ? parsed.habits : [],
      completions:
        parsed.completions && typeof parsed.completions === "object"
          ? parsed.completions
          : {}
    };
  } catch (error) {
    return defaultState;
  }
}

function hydrateHabits() {
  let updated = false;
  const todayKey = getTodayKey();

  state.habits.forEach((habit) => {
    if (!habit.startDate) {
      if (habit.createdAt) {
        habit.startDate = formatLocalDate(new Date(habit.createdAt));
      } else {
        habit.startDate = todayKey;
      }
      updated = true;
    }

    const completions = state.completions[habit.id] || {};
    const first = getFirstCompletionDate(completions, habit.startDate);

    if (habit.firstCompletedAt !== first) {
      habit.firstCompletedAt = first;
      updated = true;
    }
  });

  if (updated) {
    saveState();
  }
}

function syncFirstCompletion(habitId, completions) {
  const habit = state.habits.find((item) => item.id === habitId);
  if (!habit) {
    return;
  }

  habit.firstCompletedAt = getFirstCompletionDate(completions, habit.startDate);
}

function getFirstCompletionDate(completions, startDate) {
  const keys = Object.keys(completions).filter((key) => completions[key]);
  const eligibleKeys = startDate ? keys.filter((key) => key >= startDate) : keys;
  if (!eligibleKeys.length) {
    return null;
  }

  eligibleKeys.sort();
  return eligibleKeys[0];
}

function formatDisplayDate(dateKey) {
  const parts = dateKey.split("-").map((value) => Number.parseInt(value, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return dateKey;
  }

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTodayKey() {
  return formatLocalDate(new Date());
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, offset) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const lookup = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };
    return lookup[char] || char;
  });
}
