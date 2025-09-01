// State
let state = {
  chainId: null,
  prompt: "",
  lines: [],
  locked: false
};

// Elements
const setupView = document.getElementById("setupView");
const playView = document.getElementById("playView");
const revealView = document.getElementById("revealView");
const promptInput = document.getElementById("promptInput");
const startBtn = document.getElementById("startBtn");
const surpriseBtn = document.getElementById("surpriseBtn");
const chainIdDisplay = document.getElementById("chainIdDisplay");
const promptTextEl = document.getElementById("promptText");
const linesListEl = document.getElementById("linesList");
const lineInput = document.getElementById("lineInput");
const submitBtn = document.getElementById("submitBtn");
const badgesEl = document.getElementById("badges");
const promptReveal = document.getElementById("promptReveal");
const linesReveal = document.getElementById("linesReveal");
const shareBtn = document.getElementById("shareBtn");
const againBtn = document.getElementById("againBtn");
const newChainBtn = document.getElementById("newChainBtn");
const shareLinkBtn = document.getElementById("shareLinkBtn");
const copyTextBtn = document.getElementById("copyTextBtn");
const shareXBtn = document.getElementById("shareXBtn");

// Utils
function uid(len=6){ return Math.random().toString(36).substr(2,len).toUpperCase(); }
function saveState(){ localStorage.setItem("fuseState", JSON.stringify(state)); }
function loadState(){ let s = localStorage.getItem("fuseState"); if(s) state = JSON.parse(s); }
function showSetup(){ setupView.classList.remove("hidden"); playView.classList.add("hidden"); revealView.classList.add("hidden"); }
function showPlay(){ setupView.classList.add("hidden"); playView.classList.remove("hidden"); revealView.classList.add("hidden"); }
function showReveal(){ setupView.classList.add("hidden"); playView.classList.add("hidden"); revealView.classList.remove("hidden"); }

function updateBadges(s){
  badgesEl.textContent = `Turn ${s.lines.length+1}/10 • Chain ${s.chainId}`;
}

// Share text
function buildResultText(){
  const title = `Fuse — Chain Reaction (${state.lines.length}/10)\n`;
  const body  = [state.prompt, ...state.lines.map((l,i)=>`${i+1}. ${l}`)].join("\n");
  const link  = `\nPlay my chain: ${location.href}`;
  return `${title}${body}${link}`;
}
function updateXShareLink(){
  const text = buildResultText();
  const url  = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text);
  shareXBtn.href = url;
}

// Start chain
startBtn.onclick = () => {
  const prompt = promptInput.value.trim();
  if(!prompt) return alert("Enter a prompt!");
  state = { chainId: uid(), prompt, lines: [], locked:false };
  saveState();
  renderPlay(state);
  showPlay();
  chainIdDisplay.textContent = `Your unique chain ID: ${state.chainId} — Share with friends to build together`;
};

// Surprise prompt
const prompts = ["If aliens landed tomorrow…","The last thing I remember was…","It all started when…"];
surpriseBtn.onclick = () => {
  promptInput.value = prompts[Math.floor(Math.random()*prompts.length)];
};

// Submit line
submitBtn.onclick = () => {
  const line = lineInput.value.trim();
  if(!line) return;
  state.lines.push(line);
  lineInput.value="";
  if(state.lines.length>=10){ state.locked=true; saveState(); renderReveal(state); showReveal(); }
  else { saveState(); renderPlay(state); }
};

// Copy / Share
copyTextBtn.onclick = async () => {
  await navigator.clipboard.writeText(buildResultText());
  copyTextBtn.textContent = "Copied ✅";
  setTimeout(()=> copyTextBtn.textContent = "Copy Result", 1200);
};
shareXBtn.onclick = () => updateXShareLink();

// Reveal
function renderReveal(s){
  showReveal();
  promptReveal.textContent = s.prompt;
  linesReveal.innerHTML="";
  s.lines.forEach((ln,i)=>{
    const li=document.createElement("li");
    li.textContent=ln;
    linesReveal.appendChild(li);
  });
  updateBadges(s);
  updateXShareLink();
}

// Play
function renderPlay(s){
  showPlay();
  promptTextEl.textContent = s.prompt;
  linesListEl.innerHTML="";
  s.lines.forEach((ln,i)=>{
    const li=document.createElement("li");
    li.textContent=ln;
    linesListEl.appendChild(li);
  });
  updateBadges(s);
  updateXShareLink();
}

// Reset
againBtn.onclick = ()=>{ state={}; saveState(); showSetup(); };
newChainBtn.onclick = ()=>{ state={}; saveState(); showSetup(); };
shareLinkBtn.onclick = ()=>{ navigator.clipboard.writeText(location.href); alert("Link copied!"); };

// Restore
loadState();
if(state.locked){ renderReveal(state); showReveal(); }
else if(state.chainId){ renderPlay(state); showPlay(); }
else { showSetup(); }
