// Fuse — single-file logic (per-visitor unique chain).
// Each visit gets its own chain ID via ?c=XXXX. LocalStorage stores progress.
// Later you can plug a real DB (Supabase) instead of localStorage.

// Helpers
const $ = (id) => document.getElementById(id);
const qs = (key) => new URL(location.href).searchParams.get(key);
const setQs = (key, val) => {
  const u = new URL(location.href);
  u.searchParams.set(key, val);
  history.replaceState({}, "", u.toString());
};

// Elements
const yr = $("yr");
const chainBadge = $("chainBadge");
const startPanel = $("startPanel");
const playPanel = $("playPanel");
const revealPanel = $("revealPanel");

const promptInput = $("promptInput");
const startBtn = $("startBtn");
const randomPrompt = $("randomPrompt");

const newChainBtn = $("newChainBtn");
const shareLinkBtn = $("shareLinkBtn");

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

yr.textContent = new Date().getFullYear();

const SURPRISE = [
  "If aliens landed tomorrow…",
  "I woke up and chose…",
  "In a parallel universe…",
  "The pigeons formed a union because…",
  "If I had 24 hours with $1M…",
  "The worst superpower is…",
  "My villain origin story…"
];

// State shape kept in localStorage per chain id
// { id, prompt, lines: [], turn:1..11, locked:false }
function genId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function storageKey(id){ return `fuse_chain_${id}`; }

function newChainIdForVisitor() {
  // Every new visitor (no ?c=) gets a fresh ID.
  const id = genId();
  setQs("c", id);
  return id;
}

function loadChain(id){
  const raw = localStorage.getItem(storageKey(id));
  return raw ? JSON.parse(raw) : null;
}

function saveChain(state){
  localStorage.setItem(storageKey(state.id), JSON.stringify(state));
}

function ensureChainId(){
  let id = qs("c");
  if(!id){
    id = newChainIdForVisitor();
  }
  return id;
}

// UI
function updateBadges(state){
  chainIdEl.textContent = state.id;
  progressEl.textContent = `${state.lines.length} / 10 lines`;
  turnNumEl.textContent = String(state.turn);
  shareLinkBtn.href = location.href;
  shareLinkBtn.textContent = "Share Link";
  chainBadge.textContent = `Your unique chain ID: ${state.id} • Share with friends to build together`;
}

function showStart(){
  startPanel.classList.remove("hidden");
  playPanel.classList.add("hidden");
  revealPanel.classList.add("hidden");
}

function showPlay(){
  startPanel.classList.add("hidden");
  playPanel.classList.remove("hidden");
  revealPanel.classList.add("hidden");
}

function showReveal(){
  startPanel.classList.add("hidden");
  playPanel.classList.add("hidden");
  revealPanel.classList.remove("hidden");
}

// App flow
let state = null;

function init(){
  const id = ensureChainId();
  state = loadChain(id);
  if(!state){
    state = { id, prompt: "", lines: [], turn: 1, locked: false };
    saveChain(state);
  }

  if(state.locked){
    renderReveal(state);
  }else if(state.prompt){
    renderPlay(state, true);
  }else{
    showStart();
  }
  updateBadges(state);
}

function startChain(prompt){
  state.prompt = prompt.trim();
  state.lines = [];
  state.turn = 1;
  state.locked = false;
  saveChain(state);
  renderPlay(state, false);
}

function addLine(text){
  if(state.locked) return;
  state.lines.push(text.trim());
  state.turn++;
  if(state.lines.length >= 10){
    state.locked = true;
    saveChain(state);
    renderReveal(state);
    fireConfetti();
  } else {
    saveChain(state);
    renderPlay(state, true);
  }
}

function renderPlay(s, notFirst){
  showPlay();
  lastLineEl.textContent = notFirst && s.lines.length
    ? "Previous line: " + s.lines[s.lines.length - 1]
    : "You’re first — set the tone.";
  lineInput.value = "";
  charsLeftEl.textContent = String(80);
  updateBadges(s);
}

function renderReveal(s){
  showReveal();
  promptTextEl.textContent = s.prompt || "(no prompt)";
  linesListEl.innerHTML = "";
  s.lines.forEach((ln, i)=>{
    const li = document.createElement("li");
    li.textContent = ln;
    linesListEl.appendChild(li);
  });
  updateBadges(s);
}

function newChain(){
  const id = genId();
  setQs("c", id);
  state = { id, prompt: "", lines: [], turn: 1, locked: false };
  saveChain(state);
  promptInput.value = "";
  updateBadges(state);
  showStart();
}

// Share image of the card
function downloadCard(){
  import('https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm')
    .then(htmlToImage => htmlToImage.toPng(document.getElementById("card"), { pixelRatio: 2 }))
    .then(url => {
      const a = document.createElement("a");
      a.href = url;
      a.download = "fuse-chain.png";
      a.click();
    })
    .catch(()=> {
      const txt = [state.prompt, ...state.lines.map((l,i)=>`${i+1}. ${l}`)].join("\n");
      navigator.clipboard.writeText(txt);
      alert("Image fallback: chain copied to clipboard.");
    });
}

function fireConfetti(){
  import('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js')
    .then(()=> {
      // eslint-disable-next-line no-undef
      confetti({
        particleCount: 120, spread: 75, origin: { y: 0.6 }
      });
    }).catch(()=>{});
}

// Events
startBtn.onclick = () => {
  const p = promptInput.value.trim();
  if(!p) return alert("Add a short prompt first.");
  startChain(p);
};
randomPrompt.onclick = () => {
  promptInput.value = SURPRISE[Math.floor(Math.random()*SURPRISE.length)];
};
newChainBtn.onclick = newChain;

lineInput.addEventListener("input", () => {
  const left = 80 - lineInput.value.length;
  charsLeftEl.textContent = String(left);
});

submitLine.onclick = () => {
  const text = lineInput.value.trim();
  if(!text) return alert("Write a short line.");
  addLine(text);
};

shareBtn.onclick = downloadCard;
againBtn.onclick = newChain;

// Kickoff
init();
