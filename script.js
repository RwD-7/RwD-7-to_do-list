class TaskApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    this.init();
  }

  save() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  calcDuration(start, end) {
    return (new Date(end) - new Date(start)) / 60000;
  }

  calcScore(task) {
    let now = new Date();
    let start = new Date(task.start);

    let urgency = (start - now) / 60000;
    urgency = urgency < 0 ? 100 : Math.max(0, 100 - urgency);

    return urgency + (task.priority * 50);
  }

  detectConflict(task) {
    return this.tasks.some(t =>
      new Date(task.start) < new Date(t.end) &&
      new Date(task.end) > new Date(t.start)
    );
  }

  addTask() {
    let task = {
      id: Date.now(),
      text: document.getElementById("task-input").value,
      start: document.getElementById("start").value,
      end: document.getElementById("end").value,
      priority: Number(document.getElementById("priority").value),
      done: false,
      notified: false
    };

    task.duration = this.calcDuration(task.start, task.end);
    task.score = this.calcScore(task);
    task.conflict = this.detectConflict(task);

    this.tasks.push(task);
    this.sortTasks();
    this.save();
    this.render();
  }

  sortTasks() {
    this.tasks.sort((a,b)=>b.score-a.score);
  }

  toggle(id) {
    this.tasks = this.tasks.map(t =>
      t.id===id ? {...t, done: !t.done} : t
    );
    this.save();
    this.render();
  }

  // 🔔 NOTIFICAÇÃO
  notify(task) {
    if (Notification.permission === "granted") {
      new Notification("⏰ Tarefa iniciando", {
        body: task.text
      });
    }
  }

  startNotificationLoop() {
    setInterval(() => {
      let now = new Date();

      this.tasks.forEach(task => {
        if (task.notified) return;

        let start = new Date(task.start);
        let diff = (start - now) / 60000;

        if (diff <= 1 && diff >= 0) {
          this.notify(task);
          task.notified = true;
          this.save();
        }
      });
    }, 30000);
  }

  renderTimeline() {
    let el = document.getElementById("timeline");
    el.innerHTML = "<strong>Agenda do dia:</strong><br>";

    this.tasks.forEach(t => {
      el.innerHTML += `
        ${new Date(t.start).toLocaleTimeString()} - ${t.text}<br>
      `;
    });
  }

  render() {
    const list = document.getElementById("list");
    list.innerHTML = "";

    this.tasks.forEach(t => {
      let el = document.createElement("li");
      el.className = `task priority-${t.priority}`;

      el.innerHTML = `
        <strong>${t.text}</strong><br>
        ${new Date(t.start).toLocaleString()} → ${new Date(t.end).toLocaleString()}<br>
        ⏳ ${Math.round(t.duration)} min | Score: ${Math.round(t.score)}
        ${t.conflict ? "<br>⚠️ Conflito de horário!" : ""}
        <br>
        <button onclick="app.toggle(${t.id})">✔</button>
      `;

      list.appendChild(el);
    });

    this.renderTimeline();
    this.updateStats();
  }

  updateStats() {
    let total = this.tasks.length;
    let done = this.tasks.filter(t=>t.done).length;

    document.getElementById("stats").innerHTML =
      `✔ ${done}/${total} tarefas`;
  }

  init() {
    document.getElementById("add").onclick = () => this.addTask();

    document.getElementById("theme-toggle").onclick = () => {
      document.body.classList.toggle("dark");
    };

    document.getElementById("theme-color").onchange = (e) => {
      const colors = {
        green: "#22c55e",
        blue: "#3b82f6",
        purple: "#a855f7"
      };
      document.documentElement.style.setProperty("--accent", colors[e.target.value]);
    };

    if ("Notification" in window) {
      Notification.requestPermission();
    }

    this.startNotificationLoop();
    this.render();
  }
}

const app = new TaskApp();
