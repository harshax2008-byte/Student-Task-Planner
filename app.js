let tasks = JSON.parse(localStorage.getItem("student_tasks")) || [],
  currentFilter = "all",
  currentStreak = parseInt(localStorage.getItem("student_streak")) || 0,
  lastTaskDate = localStorage.getItem("student_last_task_date") || null,
  totalStudyTime = parseInt(localStorage.getItem("student_study_time")) || 0,
  lastStudyDate =
    localStorage.getItem("student_last_study_date") ||
    new Date().toDateString(),
  timerInterval = null,
  timerTimeLeft = 1500;
const taskContainer = document.getElementById("task-container"),
  addTaskBtn = document.getElementById("add-task-btn"),
  taskNameInput = document.getElementById("task-name"),
  taskCategorySelect = document.getElementById("task-category"),
  taskRecurringSelect = document.getElementById("task-recurring"),
  taskDateInput = document.getElementById("task-date"),
  taskTimeInput = document.getElementById("task-time"),
  notifyBtn = document.getElementById("btn-notifications"),
  progressBar = document.getElementById("daily-progress"),
  progressText = document.getElementById("progress-text"),
  welcomeText = document.getElementById("welcome-text"),
  currentDateDisplay = document.getElementById("current-date"),
  filterBtns = document.querySelectorAll(".filter-btn"),
  toast = document.getElementById("toast"),
  timeDisplay = document.getElementById("time-display"),
  btnStartTimer = document.getElementById("btn-start-timer"),
  btnPauseTimer = document.getElementById("btn-pause-timer"),
  btnResetTimer = document.getElementById("btn-reset-timer"),
  toggleTimerVisibility = document.getElementById("toggle-timer-visibility"),
  timerWidget = document.getElementById("focus-timer-widget"),
  totalTimeDisplay = document.getElementById("total-time-display"),
  currentStreakDisplay = document.getElementById("current-streak"),
  reminderSoundSelect = document.getElementById("reminder-sound"),
  previewSoundBtn = document.getElementById("preview-sound"),
  customSoundContainer = document.getElementById("custom-sound-container"),
  customSoundUrlInput = document.getElementById("custom-sound-url"),
  soundFiles = {
    classic:
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    elegant:
      "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
    digital:
      "https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3",
    success:
      "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
  };
(document.addEventListener("DOMContentLoaded", () => {
  if ("true" !== localStorage.getItem("student_logged_in"))
    return (
      (document.getElementById("login-section").style.display = "flex"),
      (document.getElementById("app-section").style.display = "none"),
      void ("function" == typeof initLoginBlock && initLoginBlock())
    );
  ((document.getElementById("login-section").style.display = "none"),
    (document.getElementById("app-section").style.display = "flex"),
    "function" == typeof checkDailyResets && checkDailyResets(),
    updateDateDisplay(),
    updateWelcomeMessage(),
    renderTasks(),
    renderCalendar(),
    updateProgress(),
    checkNotificationPermission(),
    "function" == typeof updateStreakDisplay && updateStreakDisplay(),
    "function" == typeof updateTotalTimeDisplay && updateTotalTimeDisplay());
  const e = new Date().toISOString().split("T")[0];
  taskDateInput.value = e;
  setInterval(checkUpcomingTasks, 5e3);
}),
  previewSoundBtn &&
    previewSoundBtn.addEventListener("click", playReminderSound),
  addTaskBtn.addEventListener("click", addTask),
  taskNameInput.addEventListener("keypress", (e) => {
    "Enter" === e.key && addTask();
  }),
  notifyBtn.addEventListener("click", requestNotificationPermission));
const logoutBtn = document.getElementById("btn-logout");
function addTask() {
  const e = taskNameInput.value.trim(),
    t = taskCategorySelect.value,
    n = taskRecurringSelect ? taskRecurringSelect.value : "none",
    a = taskDateInput.value,
    i = taskTimeInput.value;
  if (!e) return void showToast("Please enter a task name!", "error");
  i && "default" === Notification.permission && requestNotificationPermission();
  const s = {
    id: Date.now(),
    name: e,
    category: t,
    recurring: n,
    date: a,
    time: i,
    completed: !1,
    notified: !1,
    createdAt: new Date().toISOString(),
  };
  (tasks.push(s),
    saveTasks(),
    renderTasks(),
    renderCalendar(),
    updateProgress(),
    (taskNameInput.value = ""));
  let o = "Task added to your missions!";
  (i &&
    (o =
      "granted" === Notification.permission
        ? `Mission scheduled! We'll notify you at ${i}`
        : "denied" === Notification.permission
          ? "Task added, but notifications are blocked."
          : "Task added. Please allow notifications for reminders."),
    showToast(o));
}
function toggleTask(e) {
  let t = !1,
    n = null;
  ((tasks = tasks.map((a) => {
    if (a.id === e) {
      const e = !a.completed;
      return (e && ((t = !0), (n = a)), { ...a, completed: e });
    }
    return a;
  })),
    t &&
      ("function" == typeof updateStreak && updateStreak(),
      "function" == typeof handleRecurringTask && handleRecurringTask(n)),
    saveTasks(),
    renderTasks(),
    updateProgress());
}
function deleteTask(e) {
  const t = document.querySelector(`[data-id="${e}"]`);
  (t && (t.style.animation = "slideOut 0.3s ease-in forwards"),
    setTimeout(() => {
      ((tasks = tasks.filter((t) => t.id !== e)),
        saveTasks(),
        renderTasks(),
        renderCalendar(),
        updateProgress(),
        showToast("Task removed."));
    }, 300));
}
function saveTasks() {
  localStorage.setItem("student_tasks", JSON.stringify(tasks));
}
function renderTasks() {
  let e = tasks;
  ("pending" === currentFilter && (e = tasks.filter((e) => !e.completed)),
    "completed" === currentFilter && (e = tasks.filter((e) => e.completed)),
    e.sort((e, t) => {
      const n = new Date(e.date) - new Date(t.date);
      if (0 !== n) return n;
      const a = e.time || "00:00",
        i = t.time || "00:00";
      return a < i ? -1 : a > i ? 1 : e.completed - t.completed;
    }),
    0 !== e.length
      ? (taskContainer.innerHTML = e
          .map((e) => {
            let t = "";
            if ("Exam" === e.category && e.date) {
              const n = new Date();
              n.setHours(0, 0, 0, 0);
              const a = new Date(e.date);
              a.setHours(0, 0, 0, 0);
              const i = a - n,
                s = Math.ceil(i / 864e5);
              if (s >= 0) {
                t = `<span class="countdown-badge ${s <= 3 ? "urgent" : ""}">⏳ ${s} day${1 !== s ? "s" : ""} left</span>`;
              } else t = '<span class="countdown-badge">⏳ Passed</span>';
            }
            const n =
              e.recurring && "none" !== e.recurring
                ? `<span class="recurring-icon" title="Repeats ${e.recurring}">🔁</span>`
                : "";
            return `\n        <div class="task-card ${e.completed ? "completed" : ""}" data-id="${e.id}">\n            <div class="task-header">\n                <span class="tag tag-${e.category.toLowerCase()}">${e.category}</span>\n                <div class="checkbox-custom ${e.completed ? "checked" : ""}" onclick="toggleTask(${e.id})">\n                    ${e.completed ? "✓" : ""}\n                </div>\n            </div>\n            <div class="task-title">${e.name} ${n} ${t}</div>\n            <div class="task-footer">\n                <div class="task-date">\n                    📅 ${formatDate(e.date)} ${e.time ? `at ${e.time}` : ""}\n                </div>\n                <div class="task-actions">\n                    <button class="action-btn delete" onclick="deleteTask(${e.id})">🗑️</button>\n                </div>\n            </div>\n        </div>\n        `;
          })
          .join(""))
      : (taskContainer.innerHTML = `\n            <div class="empty-state">\n                <p>No ${"all" === currentFilter ? "" : currentFilter} tasks found. Plan your first mission above!</p>\n            </div>\n        `));
}
function requestNotificationPermission() {
  "Notification" in window
    ? Notification.requestPermission().then((e) => {
        "granted" === e
          ? (showToast("Notifications enabled!"),
            (notifyBtn.innerText = "Notifications Enabled ✓"),
            notifyBtn.classList.add("enabled"),
            testNotification())
          : showToast("Notification permission denied.");
      })
    : showToast("This browser does not support desktop notifications.");
}
function testNotification() {
  ("granted" === Notification.permission
    ? new Notification("Student Planner: Test", {
        body: "Great! Your browser is correctly sending notifications.",
        icon: "https://cdn-icons-png.flaticon.com/512/3589/3589030.png",
      })
    : showToast(
        "System notifications are blocked, but in-app reminders will still work!",
      ),
    showReminderModal("Test Notification Demo", "Right Now"));
}
function checkNotificationPermission() {
  "granted" === Notification.permission &&
    ((notifyBtn.innerText = "Notifications Enabled ✓"),
    notifyBtn.classList.add("enabled"));
}
function checkUpcomingTasks() {
  const e = new Date(),
    t =
      e.getFullYear() +
      "-" +
      String(e.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(e.getDate()).padStart(2, "0"),
    n = `${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`;
  tasks.forEach((e) => {
    e.completed ||
      e.notified ||
      e.date !== t ||
      e.time !== n ||
      ("granted" === Notification.permission &&
        new Notification(`Task Alert: ${e.name}`, {
          body: `Scheduled for now (${e.time}). Don't forget your mission!`,
          icon: "https://cdn-icons-png.flaticon.com/512/3589/3589030.png",
          requireInteraction: !0,
        }),
      showReminderModal(e.name, e.time),
      (e.notified = !0),
      saveTasks());
  });
}
function showReminderModal(e, t) {
  const n = document.getElementById("reminder-modal"),
    a = document.getElementById("reminder-title"),
    i = document.getElementById("reminder-desc");
  ((a.innerText = `Task Reminder: ${e}`),
    (i.innerText = `Your task is scheduled for now (${t}). Keep up the great work!`),
    n.classList.remove("hidden"),
    playReminderSound());
}
function playReminderSound() {
  const e = reminderSoundSelect ? reminderSoundSelect.value : "classic";
  let url = soundFiles[e];
  if (e === "custom" && customSoundUrlInput) {
    url = customSoundUrlInput.value;
  }
  if (!url) return;
  new Audio(url)
    .play()
    .catch((e) => console.log("Audio playback failed:", e));
}
function closeReminderModal() {
  document.getElementById("reminder-modal").classList.add("hidden");
}
function updateProgress() {
  const e = tasks.length,
    t = tasks.filter((e) => e.completed).length,
    n = 0 === e ? 0 : (t / e) * 100;
  ((progressBar.style.width = `${n}%`),
    (progressText.innerText = `${t}/${e} Tasks Completed`));
}
function updateWelcomeMessage() {
  const e = new Date().getHours();
  welcomeText.innerText =
    e < 12
      ? "Good Morning, Scholar!"
      : e < 18
        ? "Good Afternoon, Scholar!"
        : "Good Evening, Scholar!";
}
function updateDateDisplay() {
  currentDateDisplay.innerText = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
function formatDate(e) {
  if (!e) return "No Date";
  return new Date(e).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
function showToast(e) {
  ((toast.innerText = e),
    toast.classList.add("show"),
    setTimeout(() => toast.classList.remove("show"), 3e3));
}
function renderCalendar() {
  const e = document.getElementById("calendar-grid"),
    t = document.getElementById("month-year"),
    n = new Date(),
    a = n.getFullYear(),
    i = n.getMonth(),
    s = new Date(a, i, 1).getDay(),
    o = new Date(a, i + 1, 0).getDate();
  t.innerText = n.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  let r = "";
  for (let e = 0; e < s; e++) r += '<div class="calendar-day empty"></div>';
  for (let e = 1; e <= o; e++) {
    const t = `${a}-${String(i + 1).padStart(2, "0")}-${String(e).padStart(2, "0")}`;
    r += `\n            <div class="calendar-day ${e === n.getDate() ? "today" : ""} ${tasks.some((e) => e.date === t) ? "has-task" : ""}">\n                ${e}\n            </div>\n        `;
  }
  e.innerHTML = r;
}
function checkDailyResets() {
  const e = new Date().toDateString();
  if (lastStudyDate !== e) {
    ((totalStudyTime = 0),
      localStorage.setItem("student_study_time", totalStudyTime),
      (lastStudyDate = e),
      localStorage.setItem("student_last_study_date", lastStudyDate));
    const t = new Date();
    (t.setDate(t.getDate() - 1),
      lastTaskDate !== t.toDateString() &&
        lastTaskDate !== e &&
        ((currentStreak = 0),
        localStorage.setItem("student_streak", currentStreak)));
  }
}
function updateStreak() {
  const e = new Date().toDateString();
  lastTaskDate !== e &&
    (currentStreak++,
    (lastTaskDate = e),
    localStorage.setItem("student_streak", currentStreak),
    localStorage.setItem("student_last_task_date", lastTaskDate),
    updateStreakDisplay(),
    showToast(`Streak increased! 🔥 ${currentStreak} Days`));
}
function updateStreakDisplay() {
  currentStreakDisplay && (currentStreakDisplay.innerText = currentStreak);
}
function handleRecurringTask(e) {
  if (!e.recurring || "none" === e.recurring) return;
  const t = new Date(e.date);
  if (isNaN(t)) return;
  const n = new Date(t);
  "daily" === e.recurring
    ? n.setDate(n.getDate() + 1)
    : "weekly" === e.recurring && n.setDate(n.getDate() + 7);
  const a =
      n.getFullYear() +
      "-" +
      String(n.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(n.getDate()).padStart(2, "0"),
    i = {
      ...e,
      id: Date.now() + Math.floor(1e3 * Math.random()),
      date: a,
      completed: !1,
      notified: !1,
    };
  (tasks.push(i), showToast(`Recurring task scheduled for ${formatDate(a)}`));
}
function updateTimerDisplay() {
  const e = Math.floor(timerTimeLeft / 60),
    t = timerTimeLeft % 60;
  timeDisplay &&
    (timeDisplay.innerText = `${String(e).padStart(2, "0")}:${String(t).padStart(2, "0")}`);
}
function startTimer() {
  timerInterval ||
    (btnStartTimer && btnStartTimer.classList.add("hidden"),
    btnPauseTimer && btnPauseTimer.classList.remove("hidden"),
    (timerInterval = setInterval(() => {
      timerTimeLeft > 0
        ? (timerTimeLeft--,
          totalStudyTime++,
          updateTimerDisplay(),
          totalStudyTime % 60 == 0 &&
            (localStorage.setItem("student_study_time", totalStudyTime),
            updateTotalTimeDisplay()))
        : (pauseTimer(),
          "granted" === Notification.permission &&
            new Notification("Focus Session Complete!", {
              body: "Great job focusing. Take a short break!",
              icon: "https://cdn-icons-png.flaticon.com/512/3589/3589030.png",
            }),
          "function" == typeof showReminderModal
            ? showReminderModal(
                "Focus Timer Complete",
                "Great job tracking your time! Take a short break.",
              )
            : playReminderSound(),
          resetTimer());
    }, 1e3)));
}
function pauseTimer() {
  (clearInterval(timerInterval),
    (timerInterval = null),
    btnPauseTimer && btnPauseTimer.classList.add("hidden"),
    btnStartTimer && btnStartTimer.classList.remove("hidden"),
    localStorage.setItem("student_study_time", totalStudyTime),
    updateTotalTimeDisplay());
}
function resetTimer() {
  (pauseTimer(), (timerTimeLeft = 1500), updateTimerDisplay());
}
function updateTotalTimeDisplay() {
  const e = Math.floor(totalStudyTime / 60),
    t = Math.floor(e / 60);
  let n = `${e}m`;
  (t > 0 && (n = `${t}h ${e % 60}m`),
    totalTimeDisplay && (totalTimeDisplay.innerText = n));
}
function initLoginBlock() {
  const e = document.getElementById("login-form"),
    t = document.getElementById("toast");
  (document.querySelectorAll(".input-group input").forEach((e) => {
    (e.addEventListener("focus", () => {
      e.parentElement.style.transform = "scale(1.02)";
    }),
      e.addEventListener("blur", () => {
        e.parentElement.style.transform = "scale(1)";
      }),
      (e.parentElement.style.transition = "transform 0.3s ease"));
  }),
    e.addEventListener("submit", (n) => {
      n.preventDefault();
      const a = e.querySelector(".login-btn");
      a.innerHTML;
      ((a.innerHTML = "<span>Verifying...</span> ⏳"),
        (a.style.opacity = "0.8"),
        (a.style.pointerEvents = "none"),
        setTimeout(() => {
          var e;
          ((a.innerHTML = "<span>Access Granted</span> ✓"),
            (a.style.background =
              "linear-gradient(45deg, var(--secondary), #48e5d6)"),
            (a.style.opacity = "1"),
            (e = "Login successful! Redirecting to Workspace..."),
            (t.innerText = e),
            t.classList.add("show"),
            localStorage.setItem("student_logged_in", "true"),
            setTimeout(() => {
              ((document.getElementById("login-section").style.display =
                "none"),
                (document.getElementById("app-section").style.display = "flex"),
                "function" == typeof checkDailyResets && checkDailyResets(),
                "function" == typeof updateDateDisplay && updateDateDisplay(),
                "function" == typeof updateWelcomeMessage &&
                  updateWelcomeMessage(),
                "function" == typeof renderTasks && renderTasks(),
                "function" == typeof renderCalendar && renderCalendar(),
                "function" == typeof updateProgress && updateProgress(),
                "function" == typeof checkNotificationPermission &&
                  checkNotificationPermission(),
                "function" == typeof updateStreakDisplay &&
                  updateStreakDisplay(),
                "function" == typeof updateTotalTimeDisplay &&
                  updateTotalTimeDisplay());
            }, 1e3));
        }, 1200));
    }));
}
(logoutBtn &&
  logoutBtn.addEventListener("click", () => {
    (localStorage.removeItem("student_logged_in"),
      (document.getElementById("login-section").style.display = "flex"),
      (document.getElementById("app-section").style.display = "none"),
      "function" == typeof initLoginBlock && initLoginBlock());
  }),
  filterBtns.forEach((e) => {
    e.addEventListener("click", () => {
      (filterBtns.forEach((e) => e.classList.remove("active")),
        e.classList.add("active"),
        (currentFilter = e.dataset.filter),
        renderTasks());
    });
  }),
  btnStartTimer &&
    btnStartTimer.addEventListener(
      "click",
      () => "function" == typeof startTimer && startTimer(),
    ),
  btnPauseTimer &&
    btnPauseTimer.addEventListener(
      "click",
      () => "function" == typeof pauseTimer && pauseTimer(),
    ),
  btnResetTimer &&
    btnResetTimer.addEventListener(
      "click",
      () => "function" == typeof resetTimer && resetTimer(),
    ),
  toggleTimerVisibility &&
    toggleTimerVisibility.addEventListener("click", () => {
      (timerWidget.classList.toggle("minimized"),
        (toggleTimerVisibility.innerText = timerWidget.classList.contains(
          "minimized",
        )
          ? "+"
          : "-"));
    }),
  window.addEventListener("click", (e) => {
    const t = document.getElementById("reminder-modal");
    e.target === t && closeReminderModal();
  }),
  (window.toggleTask = toggleTask),
  (window.deleteTask = deleteTask),
  (window.testNotification = testNotification),
  (window.closeReminderModal = closeReminderModal));

// ============================================================
// AI ADVISOR ENGINE
// ============================================================

const DAILY_TIPS = [
  { icon: "💡", title: "Pomodoro Power", body: "Study in 25-min focused blocks, then take a 5-min break. Your brain retains more!" },
  { icon: "📝", title: "Active Recall", body: "Instead of re-reading, test yourself. Write key points from memory after each study session." },
  { icon: "🌙", title: "Sleep to Learn", body: "Sleep consolidates memory. Aim for 7–8 hours the night before any exam." },
  { icon: "🎯", title: "Eat the Frog", body: "Tackle your hardest task first thing in the morning when energy is highest." },
  { icon: "📅", title: "Weekly Review", body: "Every Sunday, review the week's progress and plan the next week. 10 minutes = massive clarity." },
  { icon: "🧠", title: "Spaced Repetition", body: "Review material at increasing intervals: 1 day, 3 days, 1 week. Far more effective than cramming." },
  { icon: "✍️", title: "The Feynman Technique", body: "Explain a concept as if teaching it to a 10-year-old. Gaps in your knowledge will become obvious." },
  { icon: "🚫", title: "Cut Distractions", body: "Put your phone in another room while studying. Even having it visible reduces cognitive capacity by 10%." },
];

function openAdvisorPanel() {
  const panel = document.getElementById("ai-advisor-panel");
  const overlay = document.getElementById("advisor-overlay");
  if (!panel) return;
  panel.classList.add("open");
  overlay && overlay.classList.remove("hidden");
  // Show intro state if no results yet
  const results = document.getElementById("advisor-results");
  if (results && results.innerHTML.trim() === "") {
    results.innerHTML = `
      <div class="advisor-empty">
        <div class="advisor-empty-icon">🤖</div>
        <strong style="color:var(--text-main);font-size:1rem;">Hello, Scholar!</strong><br><br>
        Click <em>"✨ Analyze My Tasks"</em> above and I'll scan your schedule to give you personalized advice, warnings, and study tips.
      </div>`;
  }
}

function closeAdvisorPanel() {
  const panel = document.getElementById("ai-advisor-panel");
  const overlay = document.getElementById("advisor-overlay");
  panel && panel.classList.remove("open");
  overlay && overlay.classList.add("hidden");
}

function prefillTask(name, category) {
  const nameInput = document.getElementById("task-name");
  const catSelect = document.getElementById("task-category");
  if (nameInput) nameInput.value = name;
  if (catSelect) catSelect.value = category || "Study";
  closeAdvisorPanel();
  nameInput && nameInput.focus();
  showToast("Task pre-filled! Set a date & time and hit Add Task. ✨");
}

function analyzeTasksWithAI() {
  const btn = document.getElementById("analyze-tasks-btn");
  const thinkingEl = document.getElementById("advisor-thinking");
  const resultsEl = document.getElementById("advisor-results");
  const quickAddsEl = document.getElementById("advisor-quick-adds");
  const badgeEl = document.getElementById("advisor-badge");

  if (!btn || !resultsEl) return;

  // Show thinking animation
  btn.disabled = true;
  document.getElementById("analyze-btn-text").textContent = "🔍 Analyzing...";
  thinkingEl && thinkingEl.classList.remove("hidden");
  resultsEl.innerHTML = "";
  quickAddsEl && (quickAddsEl.innerHTML = "");

  setTimeout(() => {
    thinkingEl && thinkingEl.classList.add("hidden");
    btn.disabled = false;
    document.getElementById("analyze-btn-text").textContent = "✨ Analyze My Tasks";

    const suggestions = [];
    const quickAdds = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const pending = tasks.filter(t => !t.completed);
    const completedToday = tasks.filter(t => t.completed && t.date === todayStr);
    const overdue = pending.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date); d.setHours(0, 0, 0, 0);
      return d < today;
    });
    const upcomingExams = pending.filter(t => {
      if (t.category !== "Exam" || !t.date) return false;
      const d = new Date(t.date); d.setHours(0, 0, 0, 0);
      const diff = Math.ceil((d - today) / 86400000);
      return diff >= 0 && diff <= 3;
    });
    const noTimeSet = pending.filter(t => !t.time);
    const daysMap = {};
    pending.forEach(t => { if (t.date) daysMap[t.date] = (daysMap[t.date] || 0) + 1; });
    const heavyDays = Object.entries(daysMap).filter(([, count]) => count >= 4);
    const hasPersonal = pending.some(t => t.category === "Personal");
    const hasStudy    = pending.some(t => ["Study","Assignment","Exam","Project"].includes(t.category));

    // — Rule: No tasks at all
    if (tasks.length === 0) {
      suggestions.push({ type: "tip", icon: "🚀", title: "Start Your Journey", body: "You have no tasks yet! Add your first mission — even something small. Getting started is the hardest part.", add: { name: "First Study Session", category: "Study" } });
      quickAdds.push({ label: "➕ First Study Session", name: "First Study Session", category: "Study" });
    }

    // — Rule: Overdue tasks
    if (overdue.length > 0) {
      suggestions.push({ type: "urgent", icon: "⚠️", title: `${overdue.length} Overdue Task${overdue.length > 1 ? "s" : ""}!`, body: `You have ${overdue.length} past-due task${overdue.length > 1 ? "s" : ""}: "${overdue.map(t => t.name).join('", "')}" — reschedule or complete them today!` });
    }

    // — Rule: Upcoming exam ≤3 days
    upcomingExams.forEach(exam => {
      const d = new Date(exam.date); d.setHours(0, 0, 0, 0);
      const days = Math.ceil((d - today) / 86400000);
      suggestions.push({
        type: "urgent", icon: "🚨", title: `Exam in ${days === 0 ? "TODAY" : days + " day" + (days > 1 ? "s" : "")}!`,
        body: `"${exam.name}" is coming up fast. Consider adding a revision session right now.`,
        add: { name: `Revise for: ${exam.name}`, category: "Study" }
      });
      quickAdds.push({ label: `📖 Revise: ${exam.name}`, name: `Revise for: ${exam.name}`, category: "Study" });
    });

    // — Rule: Streak at risk
    if (currentStreak > 0 && completedToday.length === 0) {
      suggestions.push({ type: "urgent", icon: "🔥", title: `Protect Your ${currentStreak}-Day Streak!`, body: "You haven't completed any tasks today. Complete at least one to keep your streak alive!", add: { name: "Quick Task Completion", category: "Personal" } });
    }

    // — Rule: No time set on tasks (missing reminders)
    if (noTimeSet.length > 0 && noTimeSet.length < pending.length) {
      suggestions.push({ type: "", icon: "⏰", title: "Set Reminders on Your Tasks", body: `${noTimeSet.length} of your pending tasks have no time set. Add times to get notified exactly when tasks are due.` });
    }

    // — Rule: Too many pending tasks
    if (pending.length > 5) {
      suggestions.push({ type: "", icon: "📦", title: `${pending.length} Tasks Pending — Feeling Overwhelmed?`, body: "Try the 2-minute rule: if a task takes less than 2 minutes, do it now! Otherwise, break larger tasks into smaller steps.", add: { name: "Break Down: " + (pending[0] ? pending[0].name : "Big Task"), category: "Study" } });
    }

    // — Rule: Overloaded days
    heavyDays.forEach(([date, count]) => {
      const d = new Date(date);
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      suggestions.push({ type: "", icon: "📅", title: `Packed Day: ${label}`, body: `You have ${count} tasks on ${label}. Consider spreading some to nearby days for better focus.` });
    });

    // — Rule: No personal/balance tasks
    if (hasStudy && !hasPersonal && pending.length >= 3) {
      suggestions.push({ type: "tip", icon: "⚖️", title: "Don't Forget to Rest!", body: "All work and no play leads to burnout. Schedule personal time — a walk, hobby, or even a power nap counts!", add: { name: "Personal Break / Self-care", category: "Personal" } });
      quickAdds.push({ label: "🧘 Add Personal Break", name: "Personal Break / Self-care", category: "Personal" });
    }

    // — Rule: Great progress today
    if (completedToday.length >= 3) {
      suggestions.push({ type: "tip", icon: "🏆", title: "Crushing It Today!", body: `You've already completed ${completedToday.length} tasks today. Excellent momentum — keep it up Scholar!` });
    }

    // — Daily rotating tip (always)
    const tip = DAILY_TIPS[today.getDate() % DAILY_TIPS.length];
    suggestions.push({ type: "tip", icon: tip.icon, title: `Daily Tip: ${tip.title}`, body: tip.body });

    // Render suggestion cards
    if (suggestions.length === 0) {
      resultsEl.innerHTML = `<div class="advisor-empty"><div class="advisor-empty-icon">✅</div><strong style="color:var(--text-main)">You're all set!</strong><br><br>No issues detected. Keep up the great work, Scholar!</div>`;
    } else {
      resultsEl.innerHTML = suggestions.map((s, i) => `
        <div class="advisor-card ${s.type}" style="animation-delay:${i * 0.06}s">
          <div class="advisor-card-header">
            <span class="advisor-card-icon">${s.icon}</span>
            <span class="advisor-card-title">${s.title}</span>
          </div>
          <div class="advisor-card-body">${s.body}</div>
          ${s.add ? `<button class="advisor-add-btn" onclick="prefillTask('${s.add.name.replace(/'/g,"\\'")}','${s.add.category}')">➕ Add This Task</button>` : ""}
        </div>`).join("");
    }

    // Render quick-add chips
    if (quickAdds.length > 0) {
      quickAddsEl.innerHTML = `
        <div class="advisor-quick-adds-title">⚡ Quick Add</div>
        <div class="advisor-chips">${quickAdds.map(c => `<button class="advisor-chip" onclick="prefillTask('${c.name.replace(/'/g,"\\'")}','${c.category}')">${c.label}</button>`).join("")}</div>`;
    }

    // Show badge
    if (badgeEl) badgeEl.classList.remove("hidden");
  }, 1600);
}

// Wire up AI Advisor button & close controls
(function initAdvisor() {
  const navBtn  = document.getElementById("btn-ai-advisor");
  const closeBtn = document.getElementById("close-advisor");
  const analyzeBtn = document.getElementById("analyze-tasks-btn");
  const overlay = document.getElementById("advisor-overlay");
  navBtn     && navBtn.addEventListener("click", openAdvisorPanel);
  closeBtn   && closeBtn.addEventListener("click", closeAdvisorPanel);
  analyzeBtn && analyzeBtn.addEventListener("click", analyzeTasksWithAI);
  overlay    && overlay.addEventListener("click", closeAdvisorPanel);
  window.prefillTask = prefillTask;
})();

