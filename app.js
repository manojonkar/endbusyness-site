const PROFILE_KEY = "kb-learner-profile-v1";

const landingView = document.getElementById("landingView");
const registerView = document.getElementById("registerView");
const portalView = document.getElementById("portalView");
const enterPortalCard = document.getElementById("enterPortalCard");
const registerForm = document.getElementById("registerForm");
const registerError = document.getElementById("registerError");
const learnerBadge = document.getElementById("learnerBadge");
const languageSelect = document.getElementById("languageSelect");

const chapterList = document.getElementById("chapterList");
const journeyStats = document.getElementById("journeyStats");
const topicCard = document.getElementById("topicCard");
const qaSection = document.getElementById("qaSection");
const exerciseSection = document.getElementById("exerciseSection");
const recapSection = document.getElementById("recapSection");
const certificateSection = document.getElementById("certificateSection");
const learningNudge = document.getElementById("learningNudge");
const chapterSearch = document.getElementById("chapterSearch");
const tabLearning = document.getElementById("tabLearning");
const tabSharing = document.getElementById("tabSharing");
const tabHub = document.getElementById("tabHub");
const sharingSection = document.getElementById("sharingSection");
const hubSection = document.getElementById("hubSection");
const recommendSection = document.getElementById("recommendSection");
const storyForm = document.getElementById("storyForm");
const storyList = document.getElementById("storyList");
const storyChapter = document.getElementById("storyChapter");
const storyCompany = document.getElementById("storyCompany");
const storyRole = document.getElementById("storyRole");
const storyInsight = document.getElementById("storyInsight");
const storyText = document.getElementById("storyText");
const storyPhoto = document.getElementById("storyPhoto");
const hubForm = document.getElementById("hubForm");
const hubName = document.getElementById("hubName");
const hubType = document.getElementById("hubType");
const hubCadence = document.getElementById("hubCadence");
const hubGoal = document.getElementById("hubGoal");
const hubList = document.getElementById("hubList");
const diagnosticForm = document.getElementById("diagnosticForm");
const diagParticipation = document.getElementById("diagParticipation");
const diagDepth = document.getElementById("diagDepth");
const diagAction = document.getElementById("diagAction");
const diagCulture = document.getElementById("diagCulture");
const diagnosticResult = document.getElementById("diagnosticResult");
const recommendForm = document.getElementById("recommendForm");
const recName = document.getElementById("recName");
const recHandle = document.getElementById("recHandle");
const recReason = document.getElementById("recReason");
const recommendList = document.getElementById("recommendList");
const linkAmazonPrint = document.getElementById("linkAmazonPrint");
const linkAmazonEbook = document.getElementById("linkAmazonEbook");
const linkAudioBook = document.getElementById("linkAudioBook");
const linkWebsiteStore = document.getElementById("linkWebsiteStore");

const prevTopicBtn = document.getElementById("prevTopic");
const nextTopicBtn = document.getElementById("nextTopic");
const markDoneBtn = document.getElementById("markTopicDone");
const resetBtn = document.getElementById("resetBtn");
const focusBtn = document.getElementById("focusBtn");
const voiceSelect = document.getElementById("voiceSelect");
const rateSelect = document.getElementById("rateSelect");
const playAudioBtn = document.getElementById("playAudio");
const pauseAudioBtn = document.getElementById("pauseAudio");
const stopAudioBtn = document.getElementById("stopAudio");
const audioPlayer = document.getElementById("audioPlayer");

const questionTemplate = document.getElementById("questionTemplate");
const exerciseTemplate = document.getElementById("exerciseTemplate");

const TOPIC_INDEX = [];
JOURNEY_DATA.forEach((chapter, chapterIndex) => {
  chapter.topics.forEach((_, topicIndex) => TOPIC_INDEX.push({ chapterIndex, topicIndex }));
});

const defaultState = { current: 0, topicsDone: {}, answers: {}, exercises: {}, focusMode: false, search: "", testimonial: "", activeTab: "learning", stories: [], hubs: [], diagnostics: [], recommendations: [], activityDays: [], language: "en" };
let learner = null;
let state = { ...defaultState };
let voices = [];
let sharedStoriesCache = [];
let cloudClient = null;
let cloudSyncTimer = null;

function initCloud() {
  try {
    const cfg = window.KB_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return null;
    cloudClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return cloudClient;
  } catch {
    return null;
  }
}

function cloudReady() {
  return Boolean(cloudClient);
}

const I18N = {
  en: {
    learningTab: "Learning Journey",
    sharingTab: "Readers Sharing",
    hubTab: "HUB Builder",
    focusMode: "Focus Mode",
    exitFocus: "Exit Focus",
    resetProgress: "Reset Progress",
    prev: "Previous Topic",
    next: "Next Topic",
    complete: "Complete Topic",
    completed: "Topic Completed",
    cloudOn: "On",
    cloudOff: "Local only",
    cloudLabel: "Cloud Sync",
    buyGift: "Recommend & Gift the Book",
    langNote: "Chapter PDFs/MP3 are currently in English. Hindi assets can be plugged in when available."
  },
  hi: {
    learningTab: "लर्निंग जर्नी",
    sharingTab: "रीडर्स शेयरिंग",
    hubTab: "हब बिल्डर",
    focusMode: "फोकस मोड",
    exitFocus: "फोकस बंद करें",
    resetProgress: "प्रगति रीसेट करें",
    prev: "पिछला टॉपिक",
    next: "अगला टॉपिक",
    complete: "टॉपिक पूरा करें",
    completed: "टॉपिक पूरा हुआ",
    cloudOn: "चालू",
    cloudOff: "सिर्फ लोकल",
    cloudLabel: "क्लाउड सिंक",
    buyGift: "बुक रिकमेंड और गिफ्ट करें",
    langNote: "चैप्टर PDF/MP3 अभी अंग्रेजी में हैं। हिंदी सामग्री उपलब्ध होते ही जोड़ी जाएगी।"
  }
};

function t(key) {
  const lang = state.language || "en";
  return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
}

function storageKeyForLearner(profile) {
  const id = `${profile.email}`.toLowerCase().trim() + "|" + `${profile.phone}`.replace(/\s+/g, "");
  return `kb-progress-${id}`;
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
  } catch {
    return null;
  }
}

function loadState() {
  if (!learner) return { ...defaultState };
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(storageKeyForLearner(learner)) || "{}") };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  if (!learner) return;
  localStorage.setItem(storageKeyForLearner(learner), JSON.stringify(state));
  scheduleCloudSync();
}

function scheduleCloudSync() {
  if (!cloudReady() || !learner) return;
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    cloudSyncProgress();
  }, 500);
}

async function cloudEnsureLearner() {
  if (!cloudReady() || !learner) return;
  await cloudClient.from("kb_learners").upsert({
    email: learner.email.toLowerCase(),
    phone: learner.phone,
    name: learner.name,
    updated_at: new Date().toISOString()
  }, { onConflict: "email" });
}

async function cloudSyncProgress() {
  if (!cloudReady() || !learner) return;
  await cloudEnsureLearner();
  await cloudClient.from("kb_progress").upsert({
    email: learner.email.toLowerCase(),
    phone: learner.phone,
    state_json: state,
    updated_at: new Date().toISOString()
  }, { onConflict: "email" });
}

async function cloudLoadProgress() {
  if (!cloudReady() || !learner) return null;
  const { data } = await cloudClient
    .from("kb_progress")
    .select("state_json")
    .eq("email", learner.email.toLowerCase())
    .maybeSingle();
  return data?.state_json || null;
}

async function cloudLoadStories() {
  if (!cloudReady()) return [];
  const { data } = await cloudClient
    .from("kb_stories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return data || [];
}

function markActivity() {
  const day = new Date().toISOString().slice(0, 10);
  if (!state.activityDays.includes(day)) state.activityDays.push(day);
}

function showView(name) {
  landingView.classList.toggle("hidden", name !== "landing");
  registerView.classList.toggle("hidden", name !== "register");
  portalView.classList.toggle("hidden", name !== "portal");
}

function keyFor(chapterIndex, topicIndex, kind, idx) {
  return `${chapterIndex}:${topicIndex}:${kind}:${idx}`;
}

function activePointers() {
  return TOPIC_INDEX[state.current];
}

function chapterDoneCount(chapterIndex) {
  const chapter = JOURNEY_DATA[chapterIndex];
  return chapter.topics.reduce((count, _t, tIdx) => count + (state.topicsDone[`${chapterIndex}:${tIdx}`] ? 1 : 0), 0);
}

function isChapterComplete(chapterIndex) {
  return chapterDoneCount(chapterIndex) === JOURNEY_DATA[chapterIndex].topics.length;
}

function topicIsLearningReady(chapterIndex, topicIndex) {
  const chapter = JOURNEY_DATA[chapterIndex];
  const answerCount = chapter.questions.filter((_q, i) => ((state.answers[keyFor(chapterIndex, topicIndex, "q", i)] || "").trim().length >= 20)).length;
  const exerciseDone = chapter.exercises.some((_e, i) => Boolean(state.exercises[keyFor(chapterIndex, topicIndex, "e-done", i)]));
  return { answerCount, answerTarget: chapter.questions.length, exerciseDone, ready: answerCount >= Math.min(1, chapter.questions.length) && exerciseDone };
}

function allExercisesDone() {
  return TOPIC_INDEX.every(({ chapterIndex, topicIndex }) => {
    const chapter = JOURNEY_DATA[chapterIndex];
    return chapter.exercises.every((_e, i) => Boolean(state.exercises[keyFor(chapterIndex, topicIndex, "e-done", i)]));
  });
}

function certificateStatus() {
  const allTopicsDone = Object.keys(state.topicsDone).length === TOPIC_INDEX.length;
  const exercisesDone = allExercisesDone();
  const testimonialDone = (state.testimonial || "").trim().length >= 30;
  return {
    allTopicsDone,
    exercisesDone,
    testimonialDone,
    ready: allTopicsDone && exercisesDone && testimonialDone
  };
}

function calcGamification() {
  const topics = Object.keys(state.topicsDone).length;
  const exercises = Object.keys(state.exercises).filter((k) => k.includes(":e-done:") && state.exercises[k]).length;
  const stories = (state.stories || []).length;
  const testimonial = (state.testimonial || "").trim().length >= 30 ? 1 : 0;
  const xp = topics * 50 + exercises * 10 + stories * 40 + testimonial * 100;
  const level = Math.max(1, Math.floor(xp / 300) + 1);
  const badges = [];
  if (topics >= 10) badges.push("Topic Closer");
  if (topics >= TOPIC_INDEX.length) badges.push("Journey Finisher");
  if (stories >= 1) badges.push("Story Contributor");
  if (stories >= 5) badges.push("Community Mentor");
  if (testimonial) badges.push("Voice of Impact");
  return { xp, level, badges };
}

function calcStreak() {
  const days = [...(state.activityDays || [])].sort();
  if (!days.length) return 0;
  let streak = 1;
  for (let i = days.length - 1; i > 0; i--) {
    const cur = new Date(days[i]);
    const prev = new Date(days[i - 1]);
    const diff = (cur - prev) / 86400000;
    if (diff === 1) streak += 1;
    else if (diff > 1) break;
  }
  return streak;
}

function renderSidebar() {
  chapterList.innerHTML = "";
  const query = (state.search || "").trim().toLowerCase();
  JOURNEY_DATA.forEach((chapter, cIdx) => {
    const haystack = [`chapter ${chapter.chapter}`, chapter.title, ...chapter.topics].join(" ").toLowerCase();
    if (query && !haystack.includes(query)) return;
    const btn = document.createElement("button");
    btn.className = "chapter-btn";
    if (TOPIC_INDEX[state.current].chapterIndex === cIdx) btn.classList.add("active");
    if (isChapterComplete(cIdx)) btn.classList.add("complete");
    const doneCount = chapterDoneCount(cIdx);
    btn.innerHTML = `<strong>Chapter ${chapter.chapter}: ${chapter.title}</strong><div class="topic-line">${doneCount}/${chapter.topics.length} topics complete</div><div class="topic-line">${isChapterComplete(cIdx) ? "Chapter complete" : "In progress"}</div>`;
    btn.addEventListener("click", () => {
      state.current = TOPIC_INDEX.findIndex((x) => x.chapterIndex === cIdx);
      saveState();
      renderPortal();
    });
    chapterList.appendChild(btn);
  });
}

function renderStats() {
  const totalTopics = TOPIC_INDEX.length;
  const completed = Object.keys(state.topicsDone).length;
  const pct = Math.round((completed / totalTopics) * 100);
  const chaptersComplete = JOURNEY_DATA.filter((_c, i) => isChapterComplete(i)).length;
  const g = calcGamification();
  const streak = calcStreak();
  journeyStats.innerHTML = `<div class="stat-chip">Progress: ${completed}/${totalTopics} topics</div><div class="stat-chip">Completion: ${pct}%</div><div class="stat-chip">Chapters complete: ${chaptersComplete}/${JOURNEY_DATA.length}</div><div class="stat-chip">XP: ${g.xp}</div><div class="stat-chip">Level: ${g.level}</div><div class="stat-chip">Streak: ${streak} day(s)</div><div class="stat-chip">Badges: ${g.badges.length ? g.badges.join(", ") : "Earn your first badge"}</div><div class="stat-chip">${t("cloudLabel")}: ${cloudReady() ? t("cloudOn") : t("cloudOff")}</div><div class="progress-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>`;
}

function renderTopic() {
  const { chapterIndex, topicIndex } = activePointers();
  const chapter = JOURNEY_DATA[chapterIndex];
  const topic = chapter.topics[topicIndex];
  const isDone = Boolean(state.topicsDone[`${chapterIndex}:${topicIndex}`]);
  const readiness = topicIsLearningReady(chapterIndex, topicIndex);
  topicCard.innerHTML = `<h2>Topic ${topicIndex + 1}: ${topic}</h2><div class="chapter-tag">Chapter ${chapter.chapter}: ${chapter.title}</div><p><a href="${chapter.pdf}" target="_blank" rel="noopener">Open chapter reading PDF</a></p><div class="topic-meta"><span class="meta-chip">Reflect answers: ${readiness.answerCount}/${readiness.answerTarget}</span><span class="meta-chip">Exercise: ${readiness.exerciseDone ? "Done" : "Pending"}</span><span class="meta-chip">Audio: ${chapter.audio ? "Available" : "Not available"}</span></div>${isDone ? '<div class="done-mark">This topic is complete.</div>' : ""}${!readiness.ready ? '<div class="rule-note">To complete this topic: submit at least one reflection answer and mark one exercise complete.</div>' : ""}<div class="story-meta">${t("langNote")}</div>`;
  if (audioPlayer && chapter.audio) audioPlayer.src = chapter.audio;
}

function renderQuestions() {
  const { chapterIndex, topicIndex } = activePointers();
  const chapter = JOURNEY_DATA[chapterIndex];
  qaSection.innerHTML = "<h3>Reflection Questions</h3>";
  chapter.questions.forEach((q, i) => {
    const node = questionTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector("label").textContent = q;
    const textarea = node.querySelector("textarea");
    const key = keyFor(chapterIndex, topicIndex, "q", i);
    textarea.value = state.answers[key] || "";
    textarea.addEventListener("input", (e) => {
      state.answers[key] = e.target.value;
      saveState();
      renderButtons();
    });
    qaSection.appendChild(node);
  });
}

function renderExercises() {
  const { chapterIndex, topicIndex } = activePointers();
  const chapter = JOURNEY_DATA[chapterIndex];
  exerciseSection.innerHTML = "<h3>Exercises</h3>";
  chapter.exercises.forEach((item, i) => {
    const node = exerciseTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".exercise-title").textContent = `Exercise ${i + 1}`;
    node.querySelector(".exercise-instruction").textContent = item;
    const textarea = node.querySelector("textarea");
    const checkbox = node.querySelector("input[type='checkbox']");
    const noteKey = keyFor(chapterIndex, topicIndex, "e-note", i);
    const doneKey = keyFor(chapterIndex, topicIndex, "e-done", i);
    textarea.value = state.exercises[noteKey] || "";
    checkbox.checked = Boolean(state.exercises[doneKey]);
    textarea.addEventListener("input", (e) => {
      state.exercises[noteKey] = e.target.value;
      saveState();
    });
    checkbox.addEventListener("change", (e) => {
      state.exercises[doneKey] = e.target.checked;
      saveState();
      renderButtons();
      renderNudge();
    });
    exerciseSection.appendChild(node);
  });
}

function renderNudge() {
  const { chapterIndex, topicIndex } = activePointers();
  const readiness = topicIsLearningReady(chapterIndex, topicIndex);
  if (state.topicsDone[`${chapterIndex}:${topicIndex}`]) {
    learningNudge.textContent = "Great work. This topic is complete. Move to the next topic to keep momentum.";
  } else if (!readiness.exerciseDone) {
    learningNudge.textContent = "Learning coach: complete one exercise before marking this topic done.";
  } else if (readiness.answerCount < 1) {
    learningNudge.textContent = "Learning coach: add at least one reflection answer (20+ chars).";
  } else {
    learningNudge.textContent = "You are ready to complete this topic.";
  }
}

function renderRecap() {
  const { chapterIndex } = activePointers();
  const chapter = JOURNEY_DATA[chapterIndex];
  const doneCount = chapterDoneCount(chapterIndex);
  const pending = chapter.topics.map((t, i) => ({ t, i, done: Boolean(state.topicsDone[`${chapterIndex}:${i}`]) })).filter((x) => !x.done).slice(0, 3);
  recapSection.innerHTML = `<h3>Chapter Recap</h3><div>${doneCount}/${chapter.topics.length} topics complete in this chapter.</div>${pending.length ? `<ul class="recap-list">${pending.map((p) => `<li>Topic ${p.i + 1}: ${p.t}</li>`).join("")}</ul>` : "<div class='done-mark'>All topics complete in this chapter.</div>"}`;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildCertificateHtml(profile) {
  const date = new Date().toLocaleDateString();
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Certificate - KILL BUSYness Learning Journey</title>
<style>
body{font-family:Arial,sans-serif;background:#f6f8ff;padding:24px}
.card{max-width:900px;margin:auto;background:#fff;border:2px solid #2b59d9;border-radius:14px;padding:34px;text-align:center}
h1{margin:0;color:#2b59d9;font-size:38px} h2{margin:8px 0 18px;font-size:22px}
.name{font-size:34px;font-weight:700;margin:10px 0}
.sub{color:#4a5570;font-size:18px}
.note{margin-top:16px;font-size:14px;color:#667}
</style></head>
<body><div class="card">
<h1>CERTIFICATE OF COMPLETION</h1>
<h2>KILL BUSYness Learning Journey</h2>
<div class="sub">This certifies that</div>
<div class="name">${escapeHtml(profile.name)}</div>
<div class="sub">has successfully completed all chapters and exercises, and submitted a learning testimonial.</div>
<div class="note">Date: ${escapeHtml(date)}</div>
</div></body></html>`;
}

function downloadCertificate() {
  const html = buildCertificateHtml(learner);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "KILL_BUSYness_Certificate.html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function renderCertificate() {
  const status = certificateStatus();
  certificateSection.innerHTML = `
    <h3>Completion Certificate</h3>
    <div class="certificate-rule">Certificate unlocks after all topics, all exercises, and one testimonial.</div>
    <div class="${status.ready ? "certificate-ready" : "certificate-locked"}">
      ${status.ready ? "Certificate unlocked." : "Certificate locked."}
    </div>
    <div class="topic-meta">
      <span class="meta-chip">Topics complete: ${status.allTopicsDone ? "Yes" : "No"}</span>
      <span class="meta-chip">All exercises done: ${status.exercisesDone ? "Yes" : "No"}</span>
      <span class="meta-chip">Testimonial submitted: ${status.testimonialDone ? "Yes" : "No"}</span>
    </div>
    <label for="testimonialInput"><strong>Your testimonial</strong></label>
    <textarea id="testimonialInput" rows="4" placeholder="Share your learning experience (minimum 30 characters).">${state.testimonial || ""}</textarea>
    <div class="cert-actions">
      <button id="saveTestimonialBtn" class="ghost">Save Testimonial</button>
      <button id="downloadCertificateBtn" ${status.ready ? "" : "disabled"}>Download Certificate</button>
    </div>
  `;

  const testimonialInput = document.getElementById("testimonialInput");
  const saveTestimonialBtn = document.getElementById("saveTestimonialBtn");
  const downloadCertificateBtn = document.getElementById("downloadCertificateBtn");

  saveTestimonialBtn.addEventListener("click", () => {
    state.testimonial = testimonialInput.value || "";
    markActivity();
    saveState();
    renderCertificate();
    renderStats();
  });
  downloadCertificateBtn.addEventListener("click", () => {
    if (!certificateStatus().ready) return;
    downloadCertificate();
  });
}

function renderButtons() {
  prevTopicBtn.disabled = state.current === 0;
  nextTopicBtn.disabled = state.current === TOPIC_INDEX.length - 1;
  const { chapterIndex, topicIndex } = activePointers();
  const ready = topicIsLearningReady(chapterIndex, topicIndex).ready;
  markDoneBtn.disabled = !ready && !state.topicsDone[`${chapterIndex}:${topicIndex}`];
  markDoneBtn.textContent = state.topicsDone[`${chapterIndex}:${topicIndex}`] ? t("completed") : t("complete");
}

function audioScript() {
  const { chapterIndex, topicIndex } = activePointers();
  const chapter = JOURNEY_DATA[chapterIndex];
  const topic = chapter.topics[topicIndex];
  const lang = state.language || "en";
  if (lang === "hi") {
    return `अध्याय ${chapter.chapter}. ${chapter.title}. टॉपिक ${topicIndex + 1}. ${topic}.`;
  }
  return `Chapter ${chapter.chapter}. ${chapter.title}. Topic ${topicIndex + 1}. ${topic}.`;
}

function loadVoices() {
  if (!("speechSynthesis" in window)) {
    voiceSelect.innerHTML = "<option>Audio not supported in this browser</option>";
    playAudioBtn.disabled = true;
    pauseAudioBtn.disabled = true;
    stopAudioBtn.disabled = true;
    return;
  }
  voices = window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  if (!voices.length) voices = window.speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((v, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(opt);
  });
}

function renderPortal() {
  document.body.classList.toggle("focus-mode", Boolean(state.focusMode));
  chapterSearch.value = state.search || "";
  languageSelect.value = state.language || "en";
  learnerBadge.textContent = learner ? `${learner.name} | ${learner.email}` : "";
  focusBtn.textContent = state.focusMode ? t("exitFocus") : t("focusMode");
  resetBtn.textContent = t("resetProgress");
  prevTopicBtn.textContent = t("prev");
  nextTopicBtn.textContent = t("next");
  tabLearning.textContent = t("learningTab");
  tabSharing.textContent = t("sharingTab");
  tabHub.textContent = t("hubTab");
  renderSidebar();
  renderStats();
  renderTopic();
  renderNudge();
  renderQuestions();
  renderExercises();
  renderRecap();
  renderCertificate();
  renderButtons();
  renderStories();
  renderHubs();
  tabLearning.classList.toggle("active-tab", state.activeTab === "learning");
  tabSharing.classList.toggle("active-tab", state.activeTab === "sharing");
  tabHub.classList.toggle("active-tab", state.activeTab === "hub");
  const learningOnly = document.querySelectorAll(".learning-only");
  learningOnly.forEach((el) => el.classList.toggle("hidden", state.activeTab !== "learning"));
  sharingSection.classList.toggle("hidden", state.activeTab !== "sharing");
  hubSection.classList.toggle("hidden", state.activeTab !== "hub");
  recommendSection.classList.toggle("hidden", state.activeTab !== "hub");
}

async function bootPortal() {
  showView("portal");
  loadVoices();
  if (cloudReady() && learner) {
    const cloudState = await cloudLoadProgress();
    if (cloudState) state = { ...defaultState, ...cloudState };
    sharedStoriesCache = await cloudLoadStories();
  }
  renderPortal();
}

function validPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10;
}

enterPortalCard.addEventListener("click", async () => {
  learner = loadProfile();
  if (learner) {
    state = loadState();
    await bootPortal();
  } else {
    showView("register");
  }
});
enterPortalCard.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") enterPortalCard.click();
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(registerForm);
  const profile = {
    name: String(form.get("fullName") || "").trim(),
    email: String(form.get("email") || "").trim(),
    phone: String(form.get("phone") || "").trim()
  };
  if (!profile.name || !profile.email || !validPhone(profile.phone)) {
    registerError.textContent = "Please enter valid name, email, and phone number.";
    return;
  }
  registerError.textContent = "";
  learner = profile;
  saveProfile(profile);
  state = loadState();
  markActivity();
  saveState();
  await cloudEnsureLearner();
  await bootPortal();
});

prevTopicBtn.addEventListener("click", () => {
  if (state.current > 0) {
    state.current -= 1;
    saveState();
    renderPortal();
  }
});

nextTopicBtn.addEventListener("click", () => {
  if (state.current < TOPIC_INDEX.length - 1) {
    state.current += 1;
    saveState();
    renderPortal();
  }
});

markDoneBtn.addEventListener("click", () => {
  const { chapterIndex, topicIndex } = activePointers();
  if (!topicIsLearningReady(chapterIndex, topicIndex).ready) return;
  state.topicsDone[`${chapterIndex}:${topicIndex}`] = true;
  markActivity();
  saveState();
  renderPortal();
});

focusBtn.addEventListener("click", () => {
  state.focusMode = !state.focusMode;
  markActivity();
  saveState();
  renderPortal();
});

chapterSearch.addEventListener("input", (e) => {
  state.search = e.target.value || "";
  saveState();
  renderSidebar();
});

resetBtn.addEventListener("click", () => {
  if (!window.confirm("Reset all progress, answers, and exercise notes for this registered learner?")) return;
  state = { ...defaultState };
  markActivity();
  saveState();
  renderPortal();
});

playAudioBtn.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(audioScript());
  const idx = Number(voiceSelect.value || 0);
  if (voices[idx]) utter.voice = voices[idx];
  utter.lang = state.language === "hi" ? "hi-IN" : "en-US";
  utter.rate = Number(rateSelect.value || 1);
  window.speechSynthesis.speak(utter);
});

languageSelect.addEventListener("change", () => {
  state.language = languageSelect.value || "en";
  saveState();
  renderPortal();
});

pauseAudioBtn.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) return;
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) window.speechSynthesis.pause();
  else if (window.speechSynthesis.paused) window.speechSynthesis.resume();
});

stopAudioBtn.addEventListener("click", () => {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
});

tabLearning.addEventListener("click", () => {
  state.activeTab = "learning";
  saveState();
  renderPortal();
});
tabSharing.addEventListener("click", () => {
  state.activeTab = "sharing";
  saveState();
  renderPortal();
});
tabHub.addEventListener("click", () => {
  state.activeTab = "hub";
  saveState();
  renderPortal();
});

JOURNEY_DATA.forEach((ch) => {
  const opt = document.createElement("option");
  opt.value = String(ch.chapter);
  opt.textContent = `Chapter ${ch.chapter}: ${ch.title}`;
  storyChapter.appendChild(opt);
});

function renderStories() {
  const stories = cloudReady() ? sharedStoriesCache : (state.stories || []);
  if (!stories.length) {
    storyList.innerHTML = "<div class='story-meta'>No stories yet. Be the first to share.</div>";
    return;
  }
  storyList.innerHTML = stories
    .slice()
    .reverse()
    .map((s) => `<article class="story-card">${s.photo ? `<img class="story-photo" src="${s.photo}" alt="Reader photo">` : ""}<div class="story-meta">Chapter ${s.chapter} | ${escapeHtml(s.company || "Individual")} | ${escapeHtml(s.role || "Learner")}</div><strong>${escapeHtml(s.insight)}</strong><p>${escapeHtml(s.story)}</p><div class="story-meta">By ${escapeHtml(s.name)} on ${escapeHtml(s.date || s.created_at || "")}</div></article>`)
    .join("");
}

function renderHubs() {
  const hubs = state.hubs || [];
  if (!hubs.length) {
    hubList.innerHTML = "<div class='story-meta'>No HUB plans yet. Create your first HUB.</div>";
  } else {
    hubList.innerHTML = hubs
      .slice()
      .reverse()
      .map((h) => `<article class="story-card"><strong>${escapeHtml(h.name)}</strong><div class="story-meta">${escapeHtml(h.type)} | ${escapeHtml(h.cadence)} | ${escapeHtml(h.date)}</div><p>${escapeHtml(h.goal)}</p></article>`)
      .join("");
  }

  const last = (state.diagnostics || []).at(-1);
  if (!last) {
    diagnosticResult.textContent = "Run a diagnostic to assess reading and discussion quality.";
  } else {
    diagnosticResult.textContent = `Latest Diagnostic Score: ${last.score}/20 | ${last.label} | ${last.date}`;
  }

  const recs = state.recommendations || [];
  if (!recs.length) {
    recommendList.innerHTML = "<div class='story-meta'>No recommendations yet.</div>";
  } else {
    recommendList.innerHTML = recs
      .slice()
      .reverse()
      .map((r) => `<article class="story-card"><strong>${escapeHtml(r.name)}</strong><div class="story-meta">${escapeHtml(r.handle || "No tag")} | ${escapeHtml(r.date)}</div><p>${escapeHtml(r.reason)}</p></article>`)
      .join("");
  }

  const links = (window.KB_CONFIG && window.KB_CONFIG.links) || {};
  linkAmazonPrint.href = links.amazonPrint || "#";
  linkAmazonEbook.href = links.amazonEbook || "#";
  linkAudioBook.href = links.audiobook || "#";
  linkWebsiteStore.href = links.websiteStore || "#";
}

storyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = (storyText.value || "").trim();
  const insight = (storyInsight.value || "").trim();
  if (text.length < 30 || insight.length < 8) {
    alert("Please add a meaningful insight and story (minimum 30 characters).");
    return;
  }
  const post = async (photoData) => {
    const payload = {
      chapter: Number(storyChapter.value || 1),
      company: storyCompany.value || "",
      role: storyRole.value || "",
      insight,
      story: text,
      photo: photoData || "",
      name: learner?.name || "Reader",
      date: new Date().toLocaleDateString()
    };
    if (cloudReady()) {
      await cloudClient.from("kb_stories").insert({
        ...payload,
        email: learner?.email?.toLowerCase() || "",
        created_at: new Date().toISOString()
      });
      sharedStoriesCache = await cloudLoadStories();
    } else {
      state.stories.push(payload);
    }
    markActivity();
    saveState();
    storyForm.reset();
    renderStories();
    renderStats();
    state.activeTab = "sharing";
    renderPortal();
  };
  const file = storyPhoto.files && storyPhoto.files[0];
  if (!file) return await post("");
  const reader = new FileReader();
  reader.onload = async () => {
    await post(String(reader.result || ""));
  };
  reader.readAsDataURL(file);
});

hubForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = (hubName.value || "").trim();
  const goal = (hubGoal.value || "").trim();
  if (!name || goal.length < 20) {
    alert("Please add HUB name and a meaningful 90-day goal.");
    return;
  }
  state.hubs.push({
    name,
    type: hubType.value || "company",
    cadence: hubCadence.value || "weekly",
    goal,
    date: new Date().toLocaleDateString()
  });
  markActivity();
  saveState();
  hubForm.reset();
  renderHubs();
  state.activeTab = "hub";
  renderPortal();
});

diagnosticForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const values = [
    Number(diagParticipation.value || 0),
    Number(diagDepth.value || 0),
    Number(diagAction.value || 0),
    Number(diagCulture.value || 0)
  ];
  if (values.some((v) => v < 1 || v > 5)) {
    alert("Please use scores from 1 to 5.");
    return;
  }
  const score = values.reduce((a, b) => a + b, 0);
  let label = "Needs reset";
  if (score >= 17) label = "High impact reading culture";
  else if (score >= 13) label = "Growing momentum";
  else if (score >= 9) label = "Foundational stage";
  state.diagnostics.push({ score, label, date: new Date().toLocaleDateString() });
  markActivity();
  saveState();
  renderHubs();
});

recommendForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = (recName.value || "").trim();
  const reason = (recReason.value || "").trim();
  if (!name || reason.length < 12) {
    alert("Please enter a name and a meaningful recommendation reason.");
    return;
  }
  state.recommendations.push({
    name,
    handle: (recHandle.value || "").trim(),
    reason,
    date: new Date().toLocaleDateString()
  });
  markActivity();
  saveState();
  recommendForm.reset();
  renderHubs();
});

if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = loadVoices;
initCloud();
showView("landing");
