const STORAGE_KEY = 'marvelverseDashboard.v2';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const defaultState = {
  name: 'User Name',
  email: '',
  selectedDate: getTodayIso(),
  calendarMonth: getTodayIso().slice(0, 7),
  theme: 'dark',
  water: 0,
  week: [],
  fitness: [],
  sleep: [],
  moods: [],
  meals: [],
  health: [],
  goals: []
};

let state = loadState();

function on(selector, eventName, handler) {
  const element = $(selector);
  if (element) element.addEventListener(eventName, handler);
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const loaded = saved ? { ...structuredClone(defaultState), ...JSON.parse(saved) } : structuredClone(defaultState);
  removeDemoData(loaded);
  if (!loaded.name || ['Hero', 'Sneha'].includes(loaded.name)) loaded.name = 'User Name';
  return loaded;
}

function removeDemoData(data) {
  data.fitness = (data.fitness || []).filter(item => !(item.workout === 'Arc reactor cardio' && Number(item.steps) === 8200 && Number(item.calories) === 390));
  data.sleep = (data.sleep || []).filter(item => !(Number(item.hours) === 7.5 && item.quality === 'Good'));
  data.moods = (data.moods || []).filter(item => !(Number(item.score) === 8 && item.note === 'Focused and ready for the mission.'));
  data.meals = (data.meals || []).filter(item => !(item.meal === 'Protein bowl' && Number(item.protein) === 35));
  data.health = (data.health || []).filter(item => !(Number(item.height) === 165 && Number(item.weight) === 60 && Number(item.heart) === 78 && item.bp === '120/80'));
  data.goals = (data.goals || []).filter(item => !['Drink 8 glasses of water', 'Walk 8,000 steps'].includes(item.title));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


function syncCalendarToTodayAndRender() {
  syncCalendarToToday();
  renderCalendar();
}

function syncCalendarToToday() {
  const todayIso = getTodayIso();
  state.selectedDate = todayIso;
  state.calendarMonth = todayIso.slice(0, 7);
  saveState();
}

function init() {
  syncCalendarToToday();
  bindEvents();
  applyTheme();
  renderAll();
  updateMoodPreview($('#moodRange').value);
  fetchHeroQuote();
}

function bindEvents() {
  $$('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchSection(btn.dataset.section)));
  on('#menuBtn', 'click', () => $('#sidebar').classList.toggle('open'));
  on('#themeBtn', 'click', toggleTheme);
  on('#resetBtn', 'click', resetData);
  on('#profileBtn', 'click', () => switchSection('profile'));
  on('#profileForm', 'submit', saveProfile);
  on('#fitnessForm', 'submit', addFitnessLog);
  on('#sleepForm', 'submit', addSleepLog);
  on('#moodRange', 'input', e => updateMoodPreview(e.target.value));
  on('#moodForm', 'submit', addMoodLog);
  on('#waterPlus', 'click', () => changeWater(1));
  on('#waterMinus', 'click', () => changeWater(-1));
  on('#mealForm', 'submit', addMeal);
  on('#healthForm', 'submit', addHealthLog);
  on('#healthList', 'click', handleDeleteLog);
  on('#goalForm', 'submit', addGoal);
  on('#goalList', 'click', handleGoalClick);
  on('#fitnessList', 'click', handleDeleteLog);
  on('#sleepList', 'click', handleDeleteLog);
  on('#moodList', 'click', handleDeleteLog);
  on('#mealList', 'click', handleDeleteLog);
  on('#randomizeWeek', 'click', randomizeWeek);
  on('#quoteBtn', 'click', fetchHeroQuote);
  on('#prevMonth', 'click', () => changeCalendarMonth(-1));
  on('#nextMonth', 'click', () => changeCalendarMonth(1));
  on('#todayMonth', 'click', syncCalendarToTodayAndRender);
  on('#calendarGrid', 'click', handleCalendarClick);
}

function switchSection(id) {
  $$('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.section === id));
  $$('.section').forEach(section => section.classList.toggle('active', section.id === id));
  $('#sidebar').classList.remove('open');
}

function applyTheme() {
  document.body.classList.toggle('light', state.theme === 'light');
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  saveState();
  applyTheme();
}

function saveProfile(event) {
  event.preventDefault();
  const name = $('#nameInput').value.trim();
  if (!name) return;
  state.name = name;
  state.email = $('#emailInput').value.trim();
  saveState();
  renderProfile();
}

function addFitnessLog(event) {
  event.preventDefault();
  state.fitness.unshift({
    id: crypto.randomUUID(),
    steps: Number($('#stepsInput').value),
    calories: Number($('#caloriesInput').value),
    workout: $('#workoutInput').value.trim(),
    date: displayDate(getTodayIso()), iso: getTodayIso()
  });
  saveAndRender(event.target);
}

function addSleepLog(event) {
  event.preventDefault();
  state.sleep.unshift({
    id: crypto.randomUUID(),
    hours: Number($('#sleepHours').value),
    quality: $('#sleepQuality').value,
    date: displayDate(getTodayIso()), iso: getTodayIso()
  });
  saveAndRender(event.target);
}

function addMoodLog(event) {
  event.preventDefault();
  state.moods.unshift({
    id: crypto.randomUUID(),
    score: Number($('#moodRange').value),
    note: $('#journalInput').value.trim(),
    date: displayDate(getTodayIso()), iso: getTodayIso()
  });
  saveAndRender(event.target);
}

function addMeal(event) {
  event.preventDefault();
  state.meals.unshift({
    id: crypto.randomUUID(),
    meal: $('#mealName').value.trim(),
    protein: Number($('#proteinInput').value),
    date: displayDate(getTodayIso()), iso: getTodayIso()
  });
  saveAndRender(event.target);
}

function addHealthLog(event) {
  event.preventDefault();
  const height = Number($('#heightInput').value);
  const weight = Number($('#weightInput').value);
  const heart = Number($('#heartInput').value);
  const bp = $('#bpInput').value.trim();
  const bmi = calculateBmi(height, weight);
  state.health.unshift({
    id: crypto.randomUUID(),
    height,
    weight,
    heart,
    bp,
    bmi,
    date: displayDate(getTodayIso()), iso: getTodayIso()
  });
  saveAndRender(event.target);
}

function addGoal(event) {
  event.preventDefault();
  state.goals.unshift({ id: crypto.randomUUID(), title: $('#goalInput').value.trim(), done: false });
  saveAndRender(event.target);
}

function saveAndRender(form) {
  saveState();
  form.reset();
  renderAll();
}

function changeWater(delta) {
  state.water = Math.max(0, Math.min(8, state.water + delta));
  saveState();
  renderNutrition();
  renderStats();
}

function handleDeleteLog(event) {
  const btn = event.target.closest('[data-delete]');
  if (!btn) return;
  const type = btn.dataset.type;
  const id = btn.dataset.delete;
  state[type] = state[type].filter(item => item.id !== id);
  saveState();
  renderAll();
}

function handleGoalClick(event) {
  const completeBtn = event.target.closest('[data-complete]');
  const deleteBtn = event.target.closest('[data-delete-goal]');
  if (completeBtn) {
    const goal = state.goals.find(item => item.id === completeBtn.dataset.complete);
    goal.done = !goal.done;
  }
  if (deleteBtn) state.goals = state.goals.filter(item => item.id !== deleteBtn.dataset.deleteGoal);
  saveState();
  renderGoals();
  renderCalendar();
  renderStreak();
}

function randomizeWeek() {
  state.week = Array.from({ length: 7 }, () => Math.floor(Math.random() * 75) + 20);
  saveState();
  renderChart();
}


function changeCalendarMonth(delta) {
  const [year, month] = state.calendarMonth.split('-').map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  const nextYear = next.getFullYear();
  const nextMonth = String(next.getMonth() + 1).padStart(2, '0');
  state.calendarMonth = `${nextYear}-${nextMonth}`;
  saveState();
  renderCalendar();
}

function handleCalendarClick(event) {
  const day = event.target.closest('[data-date]');
  if (!day) return;
  state.selectedDate = day.dataset.date;
  saveState();
  renderCalendar();
}

function resetData() {
  if (!confirm('Reset Marvelverse dashboard data?')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(defaultState);
  saveState();
  renderAll();
}

async function fetchHeroQuote() {
  $('#fetchStatus').textContent = 'Finding a fresh quote for you...';
  try {
    const response = await fetch('https://dummyjson.com/quotes/random');
    if (!response.ok) throw new Error('Network response failed');
    const data = await response.json();
    $('#quoteText').textContent = `“${data.quote}”`;
    $('#quoteAuthor').textContent = `— ${data.author}`;
    $('#fetchStatus').textContent = 'Fresh boost loaded.';
  } catch (error) {
    $('#quoteText').textContent = '“Heroes are made by the paths they choose.”';
    $('#quoteAuthor').textContent = '— Marvelverse fallback';
    $('#fetchStatus').textContent = 'Showing a saved backup boost.';
  }
}

function renderAll() {
  renderProfile();
  renderStats();
  renderChart();
  renderFitness();
  renderSleep();
  renderMood();
  renderNutrition();
  renderHealth();
  renderGoals();
  renderCalendar();
  renderStreak();
}

function renderProfile() {
  $('#userNameDisplay').textContent = state.name || 'User Name';
  $('#nameInput').value = state.name === 'User Name' ? '' : state.name;
  $('#emailInput').value = state.email || '';
}

function renderStats() {
  const latestFitness = state.fitness[0] || { steps: 0, calories: 0 };
  const latestSleep = state.sleep[0] || { hours: 0 };
  const latestMood = state.moods[0] || { score: 0 };
  $('#stepsStat').textContent = latestFitness.steps.toLocaleString();
  $('#calStat').textContent = latestFitness.calories.toLocaleString();
  $('#sleepStat').textContent = `${latestSleep.hours}h`;
  $('#moodStat').textContent = `${latestMood.score}/10`;
}

function renderChart() {
  const chart = $('#weeklyChart');
  if (!chart) return;
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  chart.innerHTML = state.week.map((value, index) => `
    <div class="bar fade-in" style="height:${value}%"><span>${days[index]}</span></div>
  `).join('');
}

function renderFitness() {
  renderList('fitnessList', state.fitness, 'fitness', item => `<strong class="log-title">${escapeHtml(item.workout)}</strong><small class="log-meta">${item.steps.toLocaleString()} steps · ${item.calories} cal · ${item.date}</small>`);
}

function renderSleep() {
  renderList('sleepList', state.sleep, 'sleep', item => `<strong>${item.hours} hours</strong><small>${item.quality} quality · ${item.date}</small>`);
}

function renderMood() {
  renderList('moodList', state.moods, 'moods', item => `<strong class="log-title">${moodFace(item.score)} ${item.score}/10</strong><small class="log-meta">${escapeHtml(item.note)} · ${item.date}</small>`);
}

function moodFace(score) {
  const value = Number(score);
  if (value <= 2) return '😞';
  if (value <= 4) return '😕';
  if (value <= 6) return '😐';
  if (value <= 8) return '🙂';
  return '😄';
}

function moodLabel(score) {
  const value = Number(score);
  if (value <= 2) return 'Low energy';
  if (value <= 4) return 'A little off';
  if (value <= 6) return 'Balanced';
  if (value <= 8) return 'Feeling good';
  return 'Powered up';
}

function updateMoodPreview(score) {
  $('#moodValue').textContent = score;
  $('#moodEmoji').textContent = moodFace(score);
  $('#moodText').textContent = moodLabel(score);
}

function renderNutrition() {
  $('#waterCount').textContent = state.water;
  $('#waterDots').innerHTML = Array.from({ length: 8 }, (_, i) => `<div class="water-dot ${i < state.water ? 'filled' : ''}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2s7 7.3 7 13a7 7 0 0 1-14 0c0-5.7 7-13 7-13Z"></path></svg></div>`).join('');
  renderList('mealList', state.meals, 'meals', item => `<strong>${escapeHtml(item.meal)}</strong><small>${item.protein}g protein · ${item.date}</small>`);
}

function renderHealth() {
  const latest = state.health[0] || { height: 0, weight: 0, heart: 0, bp: '--/--', bmi: 0 };
  $('#bmiStat').textContent = latest.bmi ? latest.bmi.toFixed(1) : '0';
  $('#bmiStatus').textContent = latest.bmi ? bmiCategory(latest.bmi) : 'add vitals';
  $('#heartStat').textContent = latest.heart || '0';
  $('#bpStat').textContent = latest.bp || '--/--';
  $('#healthLogCount').textContent = state.health.length;
  renderList('healthList', state.health, 'health', item => `<strong>BMI ${item.bmi.toFixed(1)} • ${item.heart} bpm</strong><small>${item.weight} kg · ${item.height} cm · BP ${escapeHtml(item.bp)} · ${item.date}</small>`);
}

function renderGoals() {
  const target = $('#goalList');
  if (!state.goals.length) return showEmpty(target);
  target.innerHTML = state.goals.map(goal => `
    <div class="goal-item fade-in ${goal.done ? 'done' : ''}">
      <button class="delete-btn" data-complete="${goal.id}">${goal.done ? '✓' : '○'}</button>
      <strong class="goal-title">${escapeHtml(goal.title)}</strong>
      <button class="delete-btn" data-delete-goal="${goal.id}">Delete</button>
    </div>
  `).join('');
}


function renderCalendar() {
  const grid = $('#calendarGrid');
  const [year, month] = state.calendarMonth.split('-').map(Number);
  const first = new Date(year, month - 1, 1);
  const title = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  $('#calendarTitle').textContent = title;

  const startDay = first.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push('<div class="calendar-day empty-day"></div>');
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const counts = getDailyCounts(iso);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    cells.push(`<button type="button" class="calendar-day ${iso === state.selectedDate ? 'selected' : ''} ${iso === getTodayIso() ? 'today-day' : ''} ${total ? 'has-data' : ''}" data-date="${iso}"><strong>${day}</strong><span>${total ? `${total} logs` : 'No data'}</span></button>`);
  }
  grid.innerHTML = cells.join('');
  renderDailySummary();
}

function renderDailySummary() {
  const iso = state.selectedDate || getTodayIso();
  $('#selectedDateTitle').textContent = displayDate(iso);
  const entries = getEntriesForDate(iso);
  const blocks = [];
  blocks.push(summaryBlock('Fitness', entries.fitness.map(x => `${escapeHtml(x.workout)} — ${x.steps.toLocaleString()} steps, ${x.calories} cal`)));
  blocks.push(summaryBlock('Sleep', entries.sleep.map(x => `${x.hours} hours, ${escapeHtml(x.quality)} quality`)));
  blocks.push(summaryBlock('Mood', entries.moods.map(x => `${moodFace(x.score)} ${x.score}/10 — ${escapeHtml(x.note)}`)));
  blocks.push(summaryBlock('Meals', entries.meals.map(x => `${escapeHtml(x.meal)} — ${x.protein}g protein`)));
  blocks.push(summaryBlock('Health', entries.health.map(x => `BMI ${x.bmi.toFixed(1)}, ${x.heart} bpm, BP ${escapeHtml(x.bp)}`)));
  $('#dailySummary').innerHTML = blocks.join('');
}

function getDailyCounts(iso) {
  const entries = getEntriesForDate(iso);
  return Object.fromEntries(Object.entries(entries).map(([key, value]) => [key, value.length]));
}

function getEntriesForDate(iso) {
  return {
    fitness: state.fitness.filter(item => itemIso(item) === iso),
    sleep: state.sleep.filter(item => itemIso(item) === iso),
    moods: state.moods.filter(item => itemIso(item) === iso),
    meals: state.meals.filter(item => itemIso(item) === iso),
    health: state.health.filter(item => itemIso(item) === iso)
  };
}

function summaryBlock(title, lines) {
  const content = lines.length ? lines.map(line => `<li>${line}</li>`).join('') : '<li class="muted-line">No entries</li>';
  return `<div class="summary-block"><h4>${title}</h4><ul>${content}</ul></div>`;
}

function itemIso(item) {
  if (item.iso) return item.iso;
  const parsed = new Date(item.date);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return getTodayIso();
}

function getTodayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function displayDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderStreak() {
  const loggedDates = getLoggedDates();
  const currentStreak = calculateCurrentStreak(loggedDates);
  const bestStreak = calculateBestStreak(loggedDates);

  const sideTarget = $('#streakCount');
  if (sideTarget) sideTarget.textContent = `${currentStreak} ${currentStreak === 1 ? 'Day' : 'Days'}`;

  const mainTarget = $('#mainStreakCount');
  if (mainTarget) mainTarget.textContent = currentStreak;
  if ($('#bestStreakStat')) $('#bestStreakStat').textContent = bestStreak;

  const nowForLabel = new Date();
  if ($('#currentDayLabel')) {
    $('#currentDayLabel').textContent = nowForLabel.toLocaleDateString(undefined, { weekday: 'long' });
  }
  if ($('#currentDateLabel')) {
    $('#currentDateLabel').textContent = String(nowForLabel.getDate()).padStart(2, '0');
  }
  if ($('#currentMonthLabel')) {
    $('#currentMonthLabel').textContent = nowForLabel.toLocaleDateString(undefined, { month: 'short' });
  }

  const weekTarget = $('#streakWeek');
  if (!weekTarget) return;
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const start = new Date(today);
  const day = today.getDay() || 7;
  start.setDate(today.getDate() - day + 1);
  weekTarget.innerHTML = labels.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isToday = iso === getTodayIso();
    const completed = loggedDates.has(iso);
    return `<div class="streak-day ${completed ? 'completed' : ''} ${isToday ? 'today' : ''}"><small>${label}</small><span>${completed ? '✓' : '—'}</span></div>`;
  }).join('');
}

function getLoggedDates() {
  const loggedDates = new Set();
  ['fitness', 'sleep', 'moods', 'meals', 'health'].forEach(type => {
    (state[type] || []).forEach(item => loggedDates.add(itemIso(item)));
  });
  return loggedDates;
}

function calculateCurrentStreak(loggedDates) {
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (!loggedDates.has(iso)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function calculateBestStreak(loggedDates) {
  const dates = [...loggedDates].sort();
  if (!dates.length) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(`${dates[i - 1]}T00:00:00`);
    const next = new Date(`${dates[i]}T00:00:00`);
    const diffDays = Math.round((next - prev) / 86400000);
    if (diffDays === 1) {
      current++;
    } else if (diffDays > 1) {
      current = 1;
    }
    best = Math.max(best, current);
  }
  return best;
}

function renderList(elementId, items, type, templateFn) {
  const target = $(`#${elementId}`);
  if (!items.length) return showEmpty(target);
  target.innerHTML = items.map(item => `
    <div class="log-item fade-in">
      <div>${templateFn(item)}</div>
      <button class="delete-btn" data-type="${type}" data-delete="${item.id}">Delete</button>
    </div>
  `).join('');
}

function showEmpty(target) {
  target.innerHTML = $('#emptyTemplate').innerHTML;
}

function calculateBmi(heightCm, weightKg) {
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return 'below range';
  if (bmi < 25) return 'healthy range';
  if (bmi < 30) return 'above range';
  return 'high range';
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

init();
