const center = document.getElementById("centerNode");
const web = document.querySelector(".web");
const consoleBtn = document.getElementById("consoleBtn");
const inputBox = document.getElementById("consoleInputBox");
const input = document.getElementById("consoleInput");
const inputOk = document.getElementById("consoleOk");

let dragging = false;

/* ==== CENTER DRAG ==== */
function startDrag(e){ dragging=true; }
function endDrag(){ dragging=false; saveCenter(); }
function moveDrag(e){
  if(!dragging) return;
  const rect = web.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  const cx = rect.width/2, cy=rect.height/2;
  const r = rect.width/2 - center.offsetWidth/2;
  const dx=x-cx, dy=y-cy;
  const dist = Math.sqrt(dx*dx+dy*dy);
  let nx=x, ny=y;
  if(dist>r){
    const a=Math.atan2(dy,dx);
    nx=cx+Math.cos(a)*r;
    ny=cy+Math.sin(a)*r;
  }
  center.style.left = `${(nx/rect.width)*100}%`;
  center.style.top  = `${(ny/rect.height)*100}%`;
  center.style.transform = "translate(-50%,-50%)";
}

center.addEventListener("mousedown", startDrag);
center.addEventListener("touchstart", startDrag);
window.addEventListener("mousemove", moveDrag);
window.addEventListener("touchmove", moveDrag);
window.addEventListener("mouseup", endDrag);
window.addEventListener("touchend", endDrag);

/* ==== SAVE/LOAD CENTER ==== */
function saveCenter(){
  localStorage.setItem("centerPos", JSON.stringify({
    left:center.style.left,
    top:center.style.top
  }));
}
const saved=JSON.parse(localStorage.getItem("centerPos"));
if(saved){
  center.style.left=saved.left;
  center.style.top=saved.top;
}

/* ==== NODES STORAGE ==== */
let savedNodes = JSON.parse(localStorage.getItem("customNodes")) || [];
function loadSavedNodes(){
  savedNodes.forEach(item => createNode(item.text, item.done, false));
}

/* ==== CONSOLE ==== */
consoleBtn.addEventListener("click", ()=>{
  inputBox.classList.toggle("show");
  input.focus();
});

inputOk.addEventListener("click", ()=>{
  const val = input.value.trim();
  if(!val) return;

  const match = val.match(/^\((.+)\)$/);
  if(match){
    const text = match[1];
    let existing = savedNodes.find(n => n.text === text);
    if(existing){
      // Повторный ввод => toggle крестик
      existing.done = !existing.done;
      updateNodeState(text, existing.done);
    } else {
      // Новый узел
      createNode(text, false, true);
    }
  } else {
    // обычное toggle
    document.querySelectorAll(".node").forEach(n=>{
      if(n.dataset.key===val) n.classList.toggle("done");
    });
  }

  input.value="";
  inputBox.classList.remove("show");
});

/* ==== CREATE NODE ==== */
function createNode(text, done=false, save=true){
  const newNode = document.createElement("div");
  newNode.classList.add("node");
  newNode.textContent = text;
  newNode.dataset.key = text;
  if(done) newNode.classList.add("done");

  // === Размер узла под текст ===
  const rect = web.getBoundingClientRect();
  const baseSize = 100;
  const maxSize = 220;
  let size = baseSize;

  if(save){ // только консольные узлы
    document.body.appendChild(newNode); // временно
    newNode.style.width = newNode.style.height = `${baseSize}px`;
    newNode.style.fontSize = "14px";

    const span = document.createElement("span");
    span.style.visibility="hidden";
    span.style.position="absolute";
    span.style.whiteSpace="nowrap";
    span.textContent=text;
    newNode.appendChild(span);
    const textWidth = span.offsetWidth + 20;
    const textHeight = span.offsetHeight + 20;
    span.remove();
    size = Math.max(baseSize, Math.min(maxSize, Math.max(textWidth, textHeight)));
    newNode.style.width = newNode.style.height = `${size}px`;
    newNode.style.fontSize = `${Math.min(16, size/7)}px`;
    newNode.remove();
  }

  // === Позиция внутри паутины ===
  const radius = rect.width/2 - size/2;
  let x, y;
  do {
    const angle = Math.random() * 2 * Math.PI;
    const r = Math.random() * radius;
    x = rect.width/2 + Math.cos(angle)*r;
    y = rect.height/2 + Math.sin(angle)*r;
  } while(distance(x, y, rect.width/2, rect.height/2) < 80);

  newNode.style.position = "absolute";
  newNode.style.left = `${(x/rect.width)*100}%`;
  newNode.style.top  = `${(y/rect.height)*100}%`;
  newNode.style.transform = "translate(-50%,-50%)";

  web.appendChild(newNode);

  // === Сохраняем в localStorage ===
  if(save){
    savedNodes.push({text:text, done:done});
    localStorage.setItem("customNodes", JSON.stringify(savedNodes));
  }
}

/* ==== UPDATE NODE STATE ==== */
function updateNodeState(text, done){
  const node = document.querySelector(`.node[data-key="${text}"]`);
  if(node) node.classList.toggle("done", done);

  const idx = savedNodes.findIndex(n=>n.text===text);
  if(idx>=0){
    savedNodes[idx].done = done;
    localStorage.setItem("customNodes", JSON.stringify(savedNodes));
  }
}

function distance(x1,y1,x2,y2){
  return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
}

/* ==== LOAD ALL NODES ==== */
loadSavedNodes();
