const STORAGE_KEY = "endbusyness-learning-progress-v1";

const chapterList = document.getElementById("chapterList");
const journeyStats = document.getElementById("journeyStats");
const topicCard = document.getElementById("topicCard");
const qaSection = document.getElementById("qaSection");
const exerciseSection = document.getElementById("exerciseSection");

const prevTopicBtn = document.getElementById("prevTopic");
const nextTopicBtn = document.getElementById("nextTopic");
const markDoneBtn = document.getElementById("markTopicDone");
const resetBtn = document.getElementById("resetBtn");
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

const defaultState = {
  current: 0,
  topicsDone: {},
  answers: {},
  exercises: {}
};

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...defaultState };
  }
}

let state = loadState();
let voices = [];

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function keyFor(chapterIndex, topicIndex, kind, idx) {
  return `${chapterIndex}:${topicIndex}:${kind}:${idx}`;
}

function activePointers() {
  return TOPIC_INDEX[state.current];
}

function renderSidebar() {
  chapterList.innerHTML = "";
  JOURNEY_DATA.forEach((chapter, cIdx) => {
    const btn = document.createElement("button");
    btn.className = "chapter-btn";

    const active = TOPIC_INDEX[state.current].chapterIndex === cIdx;
    if (active) btn.classList.add("active");

    const doneCount = chapter.topics.reduce((count, _t, tIdx) => {
      return count + (state.topicsDone[`${cIdx}:${tIdx}`] ? 1 : 0);
    }, 0);

    btn.innerHTML = `
      <strong>Chapter ${chapter.chapter}: ${chapter.title}</strong>
      <div class="topic-line">${doneCount}/${chapter.topics.length} topics complete</div>
      <div class="topic-line">Open chapter PDF</div>
    `;
    btn.addEventListener("click", () => {
      const firstTopicAbs = TOPIC_INDEX.findIndex((x) => x.chapterIndex === cIdx);
      state.current = firstTopicAbs;
      saveState();
      render();
    });
    chapterList.appendChild(btn);
  });
}

function renderStats() {
  const totalTopics = TOPIC_INDEX.length;
  const completed = Object.keys(state.topicsDone).length;
  const pct = Math.round((completed / totalTopics) * 100);
  journeyStats.innerHTML = `
    <div class="stat-chip">Progress: ${completed}/${totalTopics} topics</div>
    <div class="stat-chip">Completion: ${pct}%</div>
  `;
}

function renderTopic() {
  const { chapterIndex, topicIndex } = activePointers();
  const chapter = JOURNEY_DATA[chapterIndex];
  const topic = chapter.topics[topicIndex];
  const doneKey = `${chapterIndex}:${topicIndex}`;
  const isDone = Boolean(state.topicsDone[doneKey]);

  topicCard.innerHTML = `
    <h2>Topic ${topicIndex + 1}: ${topic}</h2>
    <div class="chapter-tag">Chapter ${chapter.chapter}: ${chapter.title}</div>
    <p><a href="${chapter.pdf}" target="_blank" rel="noopener">Open chapter reading PDF</a></p>
    ${isDone ? '<div class="done-mark">This topic is complete.</div>' : ""}
  `;
  if (audioPlayer && chapter.audio) {
    audioPlayer.src = chapter.audio;
  }
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
    });

    exerciseSection.appendChild(node);
  });
}

function renderButtons() {
  prevTopicBtn.disabled = state.current === 0;
  nextTopicBtn.disabled = state.current === TOPIC_INDEX.length - 1;
}

function audioScript() {
  const { chapterIndex, topicIndex } = activePointers();
  const chapter = JOURNEY_DATA[chapterIndex];
  const topic = chapter.topics[topicIndex];
  const questions = chapter.questions.map((q, i) => `Question ${i + 1}. ${q}`).join(" ");
  const exercises = chapter.exercises.map((e, i) => `Exercise ${i + 1}. ${e}`).join(" ");
  return `Chapter ${chapter.chapter}. ${chapter.title}. Topic ${topicIndex + 1}. ${topic}. Reflection questions: ${questions} Exercises: ${exercises}`;
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

function render() {
  renderSidebar();
  renderStats();
  renderTopic();
  renderQuestions();
  renderExercises();
  renderButtons();
}

prevTopicBtn.addEventListener("click", () => {
  if (state.current > 0) {
    state.current -= 1;
    saveState();
    render();
  }
});

nextTopicBtn.addEventListener("click", () => {
  if (state.current < TOPIC_INDEX.length - 1) {
    state.current += 1;
    saveState();
    render();
  }
});

markDoneBtn.addEventListener("click", () => {
  const { chapterIndex, topicIndex } = activePointers();
  state.topicsDone[`${chapterIndex}:${topicIndex}`] = true;
  saveState();
  render();
});

resetBtn.addEventListener("click", () => {
  const ok = window.confirm("Reset all progress, answers, and exercise notes?");
  if (!ok) return;
  state = { ...defaultState };
  saveState();
  render();
});

playAudioBtn.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(audioScript());
  const idx = Number(voiceSelect.value || 0);
  if (voices[idx]) utter.voice = voices[idx];
  utter.rate = Number(rateSelect.value || 1);
  window.speechSynthesis.speak(utter);
});

pauseAudioBtn.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) return;
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
  } else if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
});

stopAudioBtn.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
});

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
loadVoices();
render();
