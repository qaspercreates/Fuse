// Tiny in-browser demo state so you can play immediately.
// Later, swap to Supabase (functions below are prepared).

const $ = (id) => document.getElementById(id);
const startPanel = $("startPanel");
const playPanel = $("playPanel");
const revealPanel = $("revealPanel");
const promptInput = $("promptInput");
const startBtn = $("startBtn");
const randomPrompt = $("randomPrompt");
const newChainBtn = $("newChainBtn");

const chainIdEl = $("chainId");
const lastLineEl = $("lastLine");
const turnNumEl = $("turnNum");
const lineInput = $("lineInput");
const charsLeftEl = $("charsLeft");
const submitLine = $("submitLine");
const progressEl = $("progress");

const promptTextEl = $("promptText");
const linesListEl = $("linesList");
const shareBtn = $("shareBtn");
const againBtn = $("againBtn");

const SURPRISE = [
  "If aliens landed tomorrow…",
  "I woke up and chose…",
  "In a parallel universe…",
  "The pigeons formed a union because…",
  "If I had 24 hours with $1M…"
];

let localChain = null; // {id, prompt, lines: [], turn}

function resetUI() {
  startPanel.classList.remove("hidden");
  playPanel.classList.add("hidden");
  revealPanel.classList.add("hidden");
}

function startChain(prompt) {
  const id = Math.random().toString(36).slice(2, 8).toUpperCase();
  localChain = { id, prompt, lines: [], turn: 1 };
  chainIdEl.textContent = id;
  lastLineEl.textContent = "You’re the first. Set the tone.";
  turnNumEl.textContent = "1";
  lineInput.value = "";
  charsLeftEl.textContent = 80;
  progressEl.textContent = "0 / 10 lines";
  startPanel.classList.add("hidden");
  playPanel.classList.remove("hidden");
}

function addLine(text) {
  if (!localChain) return;
  localChain.lines.push(text.trim());
  localChain.turn++;
  const t = localChain.turn;
  if (t <= 10) {
    // show only last line to keep chaos
    lastLineEl.textContent = "Previous line: " + localChain.lines[localChain.lines.length - 1];
    turnNumEl.textContent = String(t);
    lineInput.value = "";
    charsLeftEl.textContent = 80;
    progressEl.textContent = `${localChain.lines.length} / 10 lines`;
  } else {
    // lock & reveal
    reveal();
  }
}

function reveal() {
  playPanel.classList.add("hidden");
  revealPanel.classList.remove("hidden");
  promptTextEl.textContent = localChain.prompt;
  linesListEl.innerHTML = "";
  localChain.lines.forEach((ln) => {
    const li = document.createElement("li");
    li.textContent = ln;
    linesListEl.appendChild(li);
  });
}

function toImageAndShare() {
  // Try native capture via html-to-image if included; fallback to copy text
  import('https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm')
    .then((htmlToImage) => {
      const node = document.getElementById("card");
      return htmlToImage.toPng(node, { pixelRatio: 2 });
    })
    .then((dataUrl) => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "chain-reaction.png";
      a.click();
    })
    .catch(() => {
      // text fallback
      const text = [localChain.prompt, ...localChain.lines.map((l,i)=>`${i+1}. ${l}`)].join("\n");
      navigator.clipboard.writeText(text);
      alert("Image fallback: chain copied to clipboard.");
    });
}

// Events
startBtn.onclick = () => {
  const p = promptInput.value.trim();
  if (!p) return alert("Add a short prompt first.");
  startChain(p);
};

randomPrompt.onclick = () => {
  promptInput.value = SURPRISE[Math.floor(Math.random() * SURPRISE.length)];
};

newChainBtn.onclick = () => {
  promptInput.value = "";
  resetUI();
};

lineInput.addEventListener("input", () => {
  const left = 80 - lineInput.value.length;
  charsLeftEl.textContent = left;
});

submitLine.onclick = () => {
  const txt = lineInput.value.trim();
  if (!txt) return alert("Write a short line.");
  addLine(txt);
};

shareBtn.onclick = toImageAndShare;
againBtn.onclick = resetUI;

// Init
resetUI();

/* -------------- Supabase version (later) -----------------

// 1) Add your keys at the top of index.html then uncomment:
// const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// 2) Tables:
// chains: id (uuid), prompt (text), created_at, is_locked (bool default false), turn (int default 1)
// entries: id (uuid), chain_id (uuid fk), order_num (int), text (text)

// 3) Example API calls:

async function createChain(prompt) {
  const { data, error } = await supa.from('chains').insert({ prompt }).select().single();
  return data; // { id, prompt, turn:1 }
}

async function addEntry(chainId, text, orderNum) {
  await supa.from('entries').insert({ chain_id: chainId, text, order_num: orderNum });
  // increment turn; lock at 10
  if (orderNum >= 10) {
    await supa.from('chains').update({ is_locked: true, turn: 10 }).eq('id', chainId);
  } else {
    await supa.from('chains').update({ turn: orderNum + 1 }).eq('id', chainId);
  }
}

async function fetchReveal(chainId) {
  const { data: chain } = await supa.from('chains').select('*').eq('id', chainId).single();
  const { data: entries } = await supa.from('entries').select('*').eq('chain_id', chainId).order('order_num');
  return { chain, entries };
}

---------------------------------------------------------------- */
