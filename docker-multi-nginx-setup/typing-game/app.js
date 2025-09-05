"use strict";

/**
 * TypeFlow — simple WPM typing game
 * - Highlights current word and current letter
 * - Tracks WPM (net), accuracy, chars typed
 * - Space moves to next word; Backspace corrects
 */

const boardEl = document.getElementById("board");
const hiddenInput = document.getElementById("hiddenInput");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const timeLeftEl = document.getElementById("timeLeft");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const charsEl = document.getElementById("chars");
const durationSelect = document.getElementById("durationSelect");
const wordsetSelect = document.getElementById("wordsetSelect");

let words = [];
let wordEls = [];
let currentWordIndex = 0;
let currentCharIndex = 0;

let started = false;
let finished = false;
let timer = null;
let startedAt = 0;
let duration = Number(durationSelect.value); // seconds
let timeLeft = duration;

let totalTyped = 0;   // total keystrokes that produced a visible char (letters, numbers, punctuation)
let correctChars = 0; // per-char correctness
let mistakes = 0;     // uncorrected mistakes (counts only wrong chars left when moving on)

const WORD_BANK = `time year people way day man thing woman life child world school state family student group country problem hand part place case week company system program question work night point home water room mother area money story issue side kind head house service friend father power hour game line end member law car city community name president team minute idea kid body information back parent face others level office door health person art war history party result change morning reason research girl guy moment air teacher force education foot boy age policy everything process music market sense service south north east west computer food measurement science window phone paper margin river ocean forest coffee beach book sleep dream fire earth metal wind light dark happy quick slow strong silent clever brave focus energy shift control space enter tab escape`;

const QUOTES = [
  "Simplicity is the soul of efficiency.",
  "Premature optimization is the root of all evil.",
  "First, solve the problem. Then, write the code.",
  "Typing is the dance between thought and motion.",
  "Programs must be written for people to read."
];

function sampleWords(n = 80) {
  const bank = WORD_BANK.trim().split(/\s+/);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(bank[Math.floor(Math.random() * bank.length)]);
  }
  return out;
}

function getQuoteWords() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  return q.split(/\s+/);
}

function renderWords(list) {
  boardEl.innerHTML = "";
  wordEls = [];
  list.forEach((w, wi) => {
    const word = document.createElement("span");
    word.className = "word";
    word.setAttribute("data-idx", wi);

    for (let i = 0; i < w.length; i++) {
      const ch = document.createElement("span");
      ch.className = "char";
      ch.textContent = w[i];
      ch.setAttribute("data-ci", i);
      word.appendChild(ch);
    }
    boardEl.appendChild(word);
    wordEls.push(word);
  });

  currentWordIndex = 0;
  currentCharIndex = 0;
  updateHighlights();
}

function resetState() {
  started = false;
  finished = false;
  clearInterval(timer);
  duration = Number(durationSelect.value);
  timeLeft = duration;
  startedAt = 0;

  totalTyped = 0;
  correctChars = 0;
  mistakes = 0;

  timeLeftEl.textContent = String(duration);
  wpmEl.textContent = "0";
  accuracyEl.textContent = "100%";
  charsEl.textContent = "0";
}

function initBoard() {
  const mode = wordsetSelect.value;
  words = mode === "quote" ? getQuoteWords() : sampleWords(90);
  renderWords(words);
}

function startGame() {
  hiddenInput.value = "";
  hiddenInput.focus({ preventScroll: true });

  if (!started) {
    started = true;
    startedAt = Date.now();
    timer = setInterval(tick, 1000);
  }
}

function endGame(reason = "time") {
  finished = true;
  clearInterval(timer);
  hiddenInput.blur();

  const elapsedMin = Math.max((Date.now() - startedAt) / 60000, 0.01);
  const netWPM = Math.round((correctChars / 5) / elapsedMin);
  const accuracy = totalTyped ? Math.max(0, Math.round((correctChars / totalTyped) * 100)) : 100;

  wpmEl.textContent = String(netWPM);
  accuracyEl.textContent = `${accuracy}%`;

  const result = document.createElement("div");
  result.className = "result";
  result.innerHTML = `
    <div><strong>Finished</strong> (${reason}). Net WPM: <strong>${netWPM}</strong>,
    Accuracy: <strong>${accuracy}%</strong>, Keystrokes: <strong>${totalTyped}</strong>.
    <div>Press <em>Start</em> to try again.</div>
  `;
  const prev = document.querySelector(".result");
  if (prev) prev.remove();
  boardEl.after(result);
}

function tick() {
  timeLeft -= 1;
  timeLeftEl.textContent = String(timeLeft);
  if (timeLeft <= 0) {
    timeLeft = 0;
    timeLeftEl.textContent = "0";
    endGame("time");
  } else {
    updateLiveStats();
  }
}

function updateLiveStats() {
  if (!started) return;
  const elapsedMin = Math.max((Date.now() - startedAt) / 60000, 0.01);
  const netWPM = Math.round((correctChars / 5) / elapsedMin);
  const accuracy = totalTyped ? Math.max(0, Math.round((correctChars / totalTyped) * 100)) : 100;
  wpmEl.textContent = String(netWPM);
  accuracyEl.textContent = `${accuracy}%`;
  charsEl.textContent = String(totalTyped);
}

function updateHighlights() {
  for (const w of wordEls) {
    w.classList.remove("current-word", "end-active");
    const act = w.querySelector(".char.active");
    if (act) act.classList.remove("active");
  }

  const word = wordEls[currentWordIndex];
  if (!word) return;

  word.classList.add("current-word");
  const chars = word.querySelectorAll(".char");

  if (currentCharIndex < chars.length) {
    chars[currentCharIndex].classList.add("active");
  } else {
    word.classList.add("end-active");
  }
}

function handleCharInput(ch) {
  if (finished) return;

  const word = wordEls[currentWordIndex];
  if (!word) return endGame("completed");

  const chars = word.querySelectorAll(".char");

  if (ch.length === 1 && ch !== " ") {
    if (!started) startGame();

    const expected = currentCharIndex < chars.length ? chars[currentCharIndex].textContent : null;

    if (expected !== null) {
      totalTyped++;
      if (ch === expected) {
        chars[currentCharIndex].classList.remove("incorrect");
        chars[currentCharIndex].classList.add("correct");
        correctChars++;
      } else {
        chars[currentCharIndex].classList.remove("correct");
        chars[currentCharIndex].classList.add("incorrect");
      }
      currentCharIndex++;
      updateHighlights();
    }
    updateLiveStats();
    return;
  }

  if (ch === " ") {
    if (!started) startGame();

    const remaining = chars.length - currentCharIndex;
    if (remaining > 0) {
      for (let i = currentCharIndex; i < chars.length; i++) {
        if (!chars[i].classList.contains("correct") && !chars[i].classList.contains("incorrect")) {
          chars[i].classList.add("incorrect");
        }
      }
      mistakes += remaining;
    }
    currentWordIndex++;
    currentCharIndex = 0;

    if (currentWordIndex >= wordEls.length) {
      endGame("completed");
      return;
    }
    updateHighlights();
    updateLiveStats();
    return;
  }
}

function handleBackspace() {
  if (finished) return;

  if (currentWordIndex === 0 && currentCharIndex === 0) return;

  const currentWord = wordEls[currentWordIndex];
  const moveToPrevWord = currentCharIndex === 0;

  if (moveToPrevWord) {
    currentWordIndex--;
    const prev = wordEls[currentWordIndex];
    const prevChars = prev.querySelectorAll(".char");
    let idx = prevChars.length - 1;
    while (idx >= 0 && !prevChars[idx].classList.contains("correct") && !prevChars[idx].classList.contains("incorrect")) {
      idx--;
    }
    if (idx < 0) {
      currentCharIndex = 0;
      updateHighlights();
      return;
    }
    const span = prevChars[idx];
    if (span.classList.contains("correct")) {
      span.classList.remove("correct");
      if (totalTyped > 0) totalTyped--;
      if (correctChars > 0) correctChars--;
    } else if (span.classList.contains("incorrect")) {
      span.classList.remove("incorrect");
      if (totalTyped > 0) totalTyped--;
    }
    currentCharIndex = idx;
    updateHighlights();
    updateLiveStats();
    return;
  }

  const chars = currentWord.querySelectorAll(".char");
  const idx = currentCharIndex - 1;
  if (idx >= 0) {
    const span = chars[idx];
    if (span.classList.contains("correct")) {
      span.classList.remove("correct");
      if (totalTyped > 0) totalTyped--;
      if (correctChars > 0) correctChars--;
    } else if (span.classList.contains("incorrect")) {
      span.classList.remove("incorrect");
      if (totalTyped > 0) totalTyped--;
    }
    currentCharIndex--;
    updateHighlights();
    updateLiveStats();
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") { e.preventDefault(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  if (e.key === "Backspace") {
    e.preventDefault();
    handleBackspace();
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    return;
  }
  if (e.key.length === 1) {
    e.preventDefault();
    handleCharInput(e.key);
  }
});

boardEl.addEventListener("click", () => hiddenInput.focus({ preventScroll: true }));

startBtn.addEventListener("click", () => {
  if (finished) {
    resetState();
    initBoard();
  }
  startGame();
});

resetBtn.addEventListener("click", () => {
  resetState();
  initBoard();
});

durationSelect.addEventListener("change", () => {
  if (!started) {
    resetState();
    initBoard();
    timeLeftEl.textContent = durationSelect.value;
  }
});
wordsetSelect.addEventListener("change", () => {
  if (!started) {
    resetState();
    initBoard();
  }
});

resetState();
initBoard();
