// ===== PARTICLES (efeito absurdo) =====
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

for (let i = 0; i < 60; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: Math.random() - 0.5,
    vy: Math.random() - 0.5
  });
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(animateParticles);
}

animateParticles();

// ===== APP =====
class TaskApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    this.filter = "all";

    this.list = document.getElementById("list");
    this.empty = document.getElementById("empty");
    this.stats = document.getElementById("stats");

    this.init();
  }

  save() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  calcEnd(start, dur) {
    if (!start || !dur) return "";
    let [h,m] = start.split(":").map(Number);
    let total = h*60 + m + Number(dur);
    return `${String(Math.floor(total/60)%24).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
  }

  add(text, time, dur) {
    if (!text) return;

    this.tasks.push({
      id: Date.now(),
      text,
      time,
      dur,
      end: this.calcEnd(time, dur),
      done: false
    });

    this.save();
    this.render();
  }

  toggle(id) {
    this.tasks = this.tasks.map(t => t.id===id ? {...t, done: !t.done} : t);
    this.save();
    this.render();
  }

  remove(id) {
    this.tasks = this.tasks.filter(t => t.id!==id);
    this.save();
    this.render();
  }

  getFiltered() {
    if (this.filter==="active") return this.tasks.filter(t=>!t.done);
    if (this.filter==="done") return this.tasks.filter(t=>t.done);
    return this.tasks;
  }

  render() {
    this.list.innerHTML = "";
    let data = this.getFiltered();

    this.empty.innerText = data.length ? "" : "Nada ainda...";

    data.forEach(t => {
      let li = document.createElement("li");
      li.className = `task ${t.done?"done":""}`;

      li.innerHTML = `
        <div>
          <strong>${t.text}</strong><br>
          <small>${t.time||""} ${t.dur?"| "+t.dur+"min":""} ${t.end?"| "+t.end:""}</small>
        </div>

        <div class="actions">
          <button onclick="app.toggle(${t.id})">✔</button>
          <button onclick="app.remove(${t.id})">✖</button>
        </div>
      `;

      this.list.appendChild(li);
    });

    this.updateStats();
  }

  updateStats() {
    let total = this.tasks.length;
    let done = this.tasks.filter(t=>t.done).length;
    this.stats.innerText = `${done}/${total} concluídas`;
  }

  init() {
    document.getElementById("add").onclick = () => {
      this.add(
        document.getElementById("task-input").value,
        document.getElementById("time").value,
        document.getElementById("duration").value
      );

      document.getElementById("task-input").value = "";
    };

    document.querySelectorAll(".controls button").forEach(btn=>{
      btn.onclick = () => {
        this.filter = btn.dataset.filter;
        this.render();
      };
    });

    this.render();
  }
}

const app = new TaskApp();
