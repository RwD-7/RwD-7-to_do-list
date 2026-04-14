class TaskFlow {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    this.init();
  }

  save() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  calcScore(task) {
    const now = new Date();
    const start = new Date(task.start);

    let urgency = (start - now) / 60000;
    urgency = urgency < 0 ? 100 : Math.max(0, 100 - urgency);

    return urgency + task.priority * 50;
  }

  autoOrganize() {
    this.tasks.forEach(t => {
      t.score = this.calcScore(t);
    });

    this.tasks.sort((a,b)=>b.score-a.score);
  }

  addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const task = {
      id: Date.now(),
      text,
      start: startInput.value,
      end: endInput.value,
      priority: Number(priorityInput.value),
      notified: false
    };

    this.tasks.push(task);
    this.autoOrganize();
    this.save();
    this.render();
  }

  getFocusTask() {
    const now = new Date();

    return this.tasks
      .filter(t => new Date(t.start) > now)
      .sort((a,b)=> new Date(a.start) - new Date(b.start))[0];
  }

  render() {
    const timeline = document.getElementById("timeline");
    timeline.innerHTML = "";

    this.tasks.forEach(t => {
      const el = document.createElement("div");
      el.className = `task p${t.priority}`;

      el.innerHTML = `
        <strong>${t.text}</strong><br>
        ${new Date(t.start).toLocaleTimeString()} → ${new Date(t.end).toLocaleTimeString()}
        <br>
        Score: ${Math.round(t.score)}
      `;

      timeline.appendChild(el);
    });

    this.updateUI();
  }

  updateUI() {
    totalTasks.innerText = this.tasks.length;

    const load = this.tasks.reduce((acc,t)=>
      acc + ((new Date(t.end)-new Date(t.start))/60000),0);

    dayLoad.innerText = Math.round(load) + " min";

    const focus = this.getFocusTask();
    focusTask.innerText = focus ? focus.text : "Nada agora";
  }

  notifyLoop() {
    setInterval(() => {
      const now = new Date();

      this.tasks.forEach(t => {
        if (t.notified) return;

        const start = new Date(t.start);
        const diff = (start - now)/60000;

        if (diff <= 1 && diff >= 0) {
          if (Notification.permission === "granted") {
            new Notification("Tarefa iniciando", { body: t.text });
          }
          t.notified = true;
        }
      });

      this.save();
    }, 30000);
  }

  init() {
    addBtn.onclick = () => this.addTask();

    themeToggle.onclick = () => {
      document.body.classList.toggle("light");
    };

    if ("Notification" in window) {
      Notification.requestPermission();
    }

    this.notifyLoop();
    this.autoOrganize();
    this.render();
  }
}

const app = new TaskFlow();
