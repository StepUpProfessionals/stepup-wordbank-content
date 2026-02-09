// Step Up — MVP Quiz (Content Wordbank)
// Reporte por WhatsApp a: +57 300 517 1856

const WHATSAPP_NUMBER = "573005171856";
const QUESTIONS_TOTAL = 20;

// Elementos UI
const screenStart = document.getElementById("screenStart");
const screenQuiz = document.getElementById("screenQuiz");
const screenResult = document.getElementById("screenResult");

const studentNameEl = document.getElementById("studentName");
const btnStart = document.getElementById("btnStart");

const progressText = document.getElementById("progressText");
const questionText = document.getElementById("questionText");
const choicesArea = document.getElementById("choicesArea");
const feedbackText = document.getElementById("feedbackText");
const btnNext = document.getElementById("btnNext");

const scoreText = document.getElementById("scoreText");
const errorsText = document.getElementById("errorsText");
const btnWhatsApp = document.getElementById("btnWhatsApp");
const btnDownload = document.getElementById("btnDownload");

// Estado
let wordbank = [];
let quiz = [];
let currentIndex = 0;
let studentName = "";
let answers = []; // {q, chosen, correct, isCorrect}
let errorWords = []; // {en, es}

// Helpers
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, n) {
  return shuffle(arr).slice(0, n);
}

function escapeText(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

async function loadWordbank() {
  // Carga desde /data/wordbank_content.json (en la raíz del repo)
const res = await fetch("./data/wordbank_content.json");
  if (!res.ok) throw new Error("No pude cargar wordbank_content.json");
  const data = await res.json();

  // Esperado: [{id,en,es,example_en,lesson}]
  return data.map(x => ({
    id: x.id,
    en: escapeText(x.en),
    es: escapeText(x.es),
    example_en: escapeText(x.example_en),
    lesson: Number(x.lesson || 0)
  }));
}

// Genera preguntas mixtas:
// - ES→EN (MCQ) 10
// - EN→ES (MCQ) 6
// - Gap-fill con example_en 4
function buildQuiz(bank) {
  const bankClean = bank.filter(w => w.en && w.es);
  const byId = new Map(bankClean.map(w => [w.id, w]));

  // Prepara un pool de opciones
  const ens = bankClean.map(w => w.en);
  const ess = bankClean.map(w => w.es);

  const questions = [];

  // ES→EN MCQ
  for (const w of pickRandom(bankClean, 10)) {
    const distractors = pickRandom(ens.filter(e => e !== w.en), 3);
    const options = shuffle([w.en, ...distractors]);
    questions.push({
      type: "ES→EN",
      word_id: w.id,
      prompt: `Elige la palabra correcta para: "${w.es}"`,
      options,
      answer: w.en
    });
  }

  // EN→ES MCQ
  for (const w of pickRandom(bankClean, 6)) {
    const distractors = pickRandom(ess.filter(e => e !== w.es), 3);
    const options = shuffle([w.es, ...distractors]);
    questions.push({
      type: "EN→ES",
      word_id: w.id,
      prompt: `¿Qué significa: "${w.en}"?`,
      options,
      answer: w.es
    });
  }

  // Gap-fill (usa example_en)
  const gapPool = bankClean.filter(w => w.example_en && w.example_en.toLowerCase().includes(w.en.toLowerCase()));
  for (const w of pickRandom(gapPool.length ? gapPool : bankClean, 4)) {
    const re = new RegExp(`\\b${w.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const gapped = w.example_en ? w.example_en.replace(re, "_____") : "_____";
    const distractors = pickRandom(ens.filter(e => e.toLowerCase() !== w.en.toLowerCase()), 3);
    const options = shuffle([w.en, ...distractors]);
    questions.push({
      type: "GAP",
      word_id: w.id,
      prompt: `Completa la frase: ${gapped}`,
      options,
      answer: w.en
    });
  }

  // Mezcla y recorta a QUESTIONS_TOTAL
  return shuffle(questions).slice(0, QUESTIONS_TOTAL);
}

function renderQuestion() {
  const q = quiz[currentIndex];
  progressText.textContent = `Pregunta ${currentIndex + 1}/${quiz.length}`;
  questionText.textContent = q.prompt;
  feedbackText.textContent = "";
  btnNext.classList.add("hidden");

  // Render opciones
  choicesArea.innerHTML = "";
  q.options.forEach(opt => {
    const b = document.createElement("button");
    b.textContent = opt;
    b.onclick = () => onChoose(opt);
    choicesArea.appendChild(b);
  });
}

function onChoose(choice) {
  const q = quiz[currentIndex];
  const correct = q.answer;
  const isCorrect = choice === correct;

  answers.push({ q, chosen: choice, correct, isCorrect });

  // Feedback
  feedbackText.textContent = isCorrect ? "✅ Correcto" : `❌ Incorrecto. Respuesta: ${correct}`;

  // Si falló, guarda palabra
  if (!isCorrect) {
    const w = wordbank.find(x => x.id === q.word_id);
    if (w) {
      errorWords.push({ en: w.en, es: w.es });
    }
  }

  // Deshabilita botones para que no cambie respuesta
  Array.from(choicesArea.querySelectorAll("button")).forEach(btn => btn.disabled = true);

  show(btnNext);
}

function computeResults() {
  const total = answers.length;
  const correct = answers.filter(a => a.isCorrect).length;
  const percent = Math.round((correct / total) * 100);

  // Top 10 errores únicos
  const uniq = [];
  const seen = new Set();
  for (const e of errorWords) {
    const key = `${e.en}||${e.es}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(e);
    }
    if (uniq.length >= 10) break;
  }

  return { total, correct, percent, topErrors: uniq };
}

function buildWhatsAppMessage(result) {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const lines = [];
  lines.push(`Reporte Step Up — Vocab (Contenido)`);
  lines.push(`Estudiante: ${studentName}`);
  lines.push(`Test: Diagnóstico rápido`);
  lines.push(`Fecha: ${dateStr}`);
  lines.push(`Puntaje: ${result.correct}/${result.total} (${result.percent}%)`);
  lines.push(``);
  lines.push(`Errores (EN — ES):`);
  if (result.topErrors.length === 0) {
    lines.push(`- Ninguno ✅`);
  } else {
    result.topErrors.forEach(e => lines.push(`- ${e.en} — ${e.es}`));
  }
  lines.push(``);
  lines.push(`Sugerencia: repase estas palabras y repita el test en 48h.`);

  return lines.join("\n");
}

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Eventos
btnStart.addEventListener("click", async () => {
  studentName = escapeText(studentNameEl.value);
  if (!studentName) {
    alert("Por favor escribe tu nombre.");
    return;
  }

  try {
    wordbank = await loadWordbank();
  } catch (e) {
    alert("Error cargando el banco de palabras. Verifica que exista /data/wordbank_content.json");
    console.error(e);
    return;
  }

  // Reset estado
  answers = [];
  errorWords = [];
  currentIndex = 0;

  quiz = buildQuiz(wordbank);

  hide(screenStart);
  show(screenQuiz);
  hide(screenResult);

  renderQuestion();
});

btnNext.addEventListener("click", () => {
  currentIndex += 1;
  if (currentIndex >= quiz.length) {
    // Final
    hide(screenQuiz);
    show(screenResult);

    const result = computeResults();
    scoreText.textContent = `Puntaje: ${result.correct}/${result.total} (${result.percent}%)`;

    const errLines = result.topErrors.length
      ? result.topErrors.map(e => `- ${e.en} — ${e.es}`).join("\n")
      : "—";
    errorsText.textContent = errLines;

    // Botón WhatsApp
    const msg = buildWhatsAppMessage(result);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    btnWhatsApp.onclick = () => window.open(waUrl, "_blank");

    // Descarga JSON
    const reportObj = {
      student: studentName,
      test: "diagnostic_quick",
      date: new Date().toISOString(),
      total: result.total,
      correct: result.correct,
      percent: result.percent,
      top_errors: result.topErrors,
      answers
    };
    btnDownload.onclick = () => downloadJSON(reportObj, `reporte_${studentName.replace(/\s+/g, "_")}.json`);

    return;
  }

  renderQuestion();
});

