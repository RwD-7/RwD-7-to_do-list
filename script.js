
class TaskFlow {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    this.repoBase = localStorage.getItem('repoBase') || 'https://github.com/';
    this.theme = localStorage.getItem('theme') || 'dark';
    this.visualPreset = localStorage.getItem('visualPreset') || 'grotesco';
    this.bindElements();
    this.applyTheme();
    this.applyPreset();
    this.configureGithubLinks();
    this.init();
  }

  bindElements() {
    this.addBtn = document.getElementById('addBtn');
    this.taskInput = document.getElementById('taskInput');
    this.startInput = document.getElementById('startInput');
    this.endInput = document.getElementById('endInput');
    this.priorityInput = document.getElementById('priorityInput');
    this.statusFilter = document.getElementById('statusFilter');
    this.searchInput = document.getElementById('searchInput');
    this.themeToggle = document.getElementById('themeToggle');
    this.visualPresetInput = document.getElementById('visualPreset');
    this.clearDoneBtn = document.getElementById('clearDoneBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.importBtn = document.getElementById('importBtn');
    this.importFile = document.getElementById('importFile');

    this.timeline = document.getElementById('timeline');
    this.totalTasks = document.getElementById('totalTasks');
    this.dayLoad = document.getElementById('dayLoad');
    this.focusTask = document.getElementById('focusTask');
    this.progressValue = document.getElementById('progressValue');
    this.progressFill = document.getElementById('progressFill');

    this.repoLink = document.getElementById('repoLink');
    this.issuesLink = document.getElementById('issuesLink');
    this.codespacesLink = document.getElementById('codespacesLink');
    this.actionsLink = document.getElementById('actionsLink');

    this.taskTemplate = document.getElementById('taskTemplate');
  }

  save() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  safeDate(value) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  calcScore(task) {
    const now = new Date();
    const start = this.safeDate(task.start);
    if (!start) return 0;

    let urgency = (start - now) / 60000;
    urgency = urgency < 0 ? 100 : Math.max(0, 100 - urgency);
    const donePenalty = task.done ? -100 : 0;

    return urgency + task.priority * 50 + donePenalty;
  }

  autoOrganize() {
    this.tasks.forEach((task) => {
      task.score = this.calcScore(task);
    });

    this.tasks.sort((a, b) => {
      if (a.done !== b.done) return Number(a.done) - Number(b.done);
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.start) - new Date(b.start);
    });
  }

  validateInput(text, start, end) {
    if (!text) return 'Digite uma tarefa.';
    if (!start || !end) return 'Defina início e fim da tarefa.';

    const startDate = this.safeDate(start);
    const endDate = this.safeDate(end);

    if (!startDate || !endDate) return 'Data inválida.';
    if (endDate <= startDate) return 'O horário final precisa ser maior que o inicial.';

    return '';
  }

  addTask() {
    const text = this.taskInput.value.trim();
    const start = this.startInput.value;
    const end = this.endInput.value;

    const validationError = this.validateInput(text, start, end);
    if (validationError) {
      alert(validationError);
      return;
    }

    const task = {
      id: Date.now(),
      text,
      start,
      end,
      priority: Number(this.priorityInput.value),
      notified: false,
      done: false,
      score: 0
    };

    this.tasks.push(task);
    this.taskInput.value = '';
    this.autoOrganize();
    this.save();
    this.render();
  }

  editTask(id) {
    const task = this.tasks.find((item) => item.id === id);
    if (!task) return;

    const nextText = prompt('Editar tarefa:', task.text);
    if (nextText === null) return;
    task.text = nextText.trim() || task.text;

    this.autoOrganize();
    this.save();
    this.render();
  }

  toggleDone(id) {
    const task = this.tasks.find((item) => item.id === id);
    if (!task) return;

    task.done = !task.done;
    this.autoOrganize();
    this.save();
    this.render();
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((item) => item.id !== id);
    this.save();
    this.render();
  }

  clearDone() {
    this.tasks = this.tasks.filter((task) => !task.done);
    this.save();
    this.render();
  }

  getFocusTask() {
    const now = new Date();

    return this.tasks
      .filter((task) => !task.done && new Date(task.start) > now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))[0];
  }

  getFilteredTasks() {
    const filter = this.statusFilter.value;
    const query = this.searchInput.value.trim().toLowerCase();

    return this.tasks.filter((task) => {
      const statusPass =
        filter === 'all' ||
        (filter === 'pending' && !task.done) ||
        (filter === 'done' && task.done);

      const searchPass = !query || task.text.toLowerCase().includes(query);
      return statusPass && searchPass;
    });
  }

  formatRange(task) {
    const start = this.safeDate(task.start);
    const end = this.safeDate(task.end);
    if (!start || !end) return 'Data inválida';

    return `${start.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} → ${end.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;
  }

  updateUI() {
    this.totalTasks.innerText = this.tasks.length;

    const load = this.tasks.reduce((acc, task) => {
      const start = this.safeDate(task.start);
      const end = this.safeDate(task.end);
      if (!start || !end) return acc;
      return acc + ((end - start) / 60000);
    }, 0);

    this.dayLoad.innerText = `${Math.round(load)} min`;

    const focus = this.getFocusTask();
    this.focusTask.innerText = focus ? focus.text : 'Nada agora';

    const completed = this.tasks.filter((task) => task.done).length;
    const progress = this.tasks.length ? Math.round((completed / this.tasks.length) * 100) : 0;

    this.progressValue.innerText = `${progress}%`;
    this.progressFill.style.width = `${progress}%`;
  }

  renderEmpty() {
    this.timeline.innerHTML = '<div class="empty">Sem tarefas neste filtro. Bora montar algo grotesco?</div>';
  }

  renderTask(task) {
    const node = this.taskTemplate.content.firstElementChild.cloneNode(true);
    node.classList.add(`p${task.priority}`);

    const name = node.querySelector('.taskName');
    const badge = node.querySelector('.badge');
    const time = node.querySelector('.taskTime');
    const score = node.querySelector('.taskScore');
    const buttons = node.querySelectorAll('button');

    name.textContent = task.text;
    badge.textContent = task.done ? 'Concluída' : 'Pendente';
    badge.classList.toggle('done', task.done);
    badge.classList.toggle('pending', !task.done);
    time.textContent = this.formatRange(task);
    score.textContent = `Score de execução: ${Math.round(task.score)}`;

    buttons.forEach((button) => {
      button.dataset.id = String(task.id);
      if (button.dataset.action === 'toggle') {
        button.textContent = task.done ? 'Reabrir' : 'Concluir';
      }
    });

    return node;
  }

  render() {
    this.timeline.innerHTML = '';
    const visibleTasks = this.getFilteredTasks();

    if (!visibleTasks.length) {
      this.renderEmpty();
      this.updateUI();
      return;
    }

    visibleTasks.forEach((task) => {
      this.timeline.appendChild(this.renderTask(task));
    });

    this.updateUI();
  }

  configureGithubLinks() {
    const base = this.repoBase.replace(/\/$/, '');
    this.repoLink.href = this.repoBase;
    this.issuesLink.href = `${base}/issues`;
    this.codespacesLink.href = `${base}/codespaces`;
    this.actionsLink.href = `${base}/actions`;
  }

  ensureGithubBase() {
    if (this.repoBase !== 'https://github.com/') return;

    const repo = prompt('Cole a URL do seu repositório GitHub (https://github.com/user/repo)');
    if (!repo) return;

    this.repoBase = repo.trim();
    localStorage.setItem('repoBase', this.repoBase);
    this.configureGithubLinks();
  }

  applyTheme() {
    document.body.classList.toggle('theme-clean', this.theme === 'light');
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.theme);
    this.applyTheme();
  }

  applyPreset() {
    document.body.classList.remove('theme-aurora', 'theme-midnight', 'theme-clean');

    if (this.visualPreset === 'aurora') document.body.classList.add('theme-aurora');
    if (this.visualPreset === 'midnight') document.body.classList.add('theme-midnight');
    if (this.visualPreset === 'clean') document.body.classList.add('theme-clean');
  }

  setPreset(value) {
    this.visualPreset = value;
    localStorage.setItem('visualPreset', value);
    this.applyPreset();
  }

  exportData() {
    const payload = JSON.stringify({ tasks: this.tasks, repoBase: this.repoBase }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taskflow-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data.tasks)) this.tasks = data.tasks;
        if (typeof data.repoBase === 'string') this.repoBase = data.repoBase;

        this.autoOrganize();
        this.save();
        localStorage.setItem('repoBase', this.repoBase);
        this.configureGithubLinks();
        this.render();
      } catch {
        alert('Arquivo inválido para importação.');
      }
    };

    reader.readAsText(file);
  }

  notifyLoop() {
    setInterval(() => {
      const now = new Date();

      this.tasks.forEach((task) => {
        if (task.done || task.notified) return;

        const start = this.safeDate(task.start);
        if (!start) return;

        const diff = (start - now) / 60000;
        if (diff <= 1 && diff >= 0) {
          if (Notification.permission === 'granted') {
            new Notification('Tarefa iniciando', { body: task.text });
          }
          task.notified = true;
        }
      });

      this.save();
    }, 30000);
  }

  bindEvents() {
    this.addBtn.onclick = () => this.addTask();
    this.themeToggle.onclick = () => this.toggleTheme();
    this.statusFilter.onchange = () => this.render();
    this.searchInput.oninput = () => this.render();
    this.clearDoneBtn.onclick = () => this.clearDone();

    this.visualPresetInput.value = this.visualPreset;
    this.visualPresetInput.onchange = (event) => {
      this.setPreset(event.target.value);
    };

    this.exportBtn.onclick = () => this.exportData();
    this.importBtn.onclick = () => this.importFile.click();
    this.importFile.onchange = (event) => {
      const [file] = event.target.files;
      if (file) this.importData(file);
    };

    this.timeline.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const id = Number(target.dataset.id);
      if (!id) return;

      const action = target.dataset.action;
      if (action === 'toggle') this.toggleDone(id);
      if (action === 'delete') this.deleteTask(id);
      if (action === 'edit') this.editTask(id);
    });

    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        this.addTask();
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        this.searchInput.focus();
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        this.toggleTheme();
      }
    });
  }

  init() {
    this.bindEvents();
    this.ensureGithubBase();

    if ('Notification' in window) {
      Notification.requestPermission();
    }

    this.notifyLoop();
    this.autoOrganize();
    this.render();
  }
}

new TaskFlow();

function helperUtility001(value) { return value; }
function helperUtility002(value) { return value; }
function helperUtility003(value) { return value; }
function helperUtility004(value) { return value; }
function helperUtility005(value) { return value; }
function helperUtility006(value) { return value; }
function helperUtility007(value) { return value; }
function helperUtility008(value) { return value; }
function helperUtility009(value) { return value; }
function helperUtility010(value) { return value; }
function helperUtility011(value) { return value; }
function helperUtility012(value) { return value; }
function helperUtility013(value) { return value; }
function helperUtility014(value) { return value; }
function helperUtility015(value) { return value; }
function helperUtility016(value) { return value; }
function helperUtility017(value) { return value; }
function helperUtility018(value) { return value; }
function helperUtility019(value) { return value; }
function helperUtility020(value) { return value; }
function helperUtility021(value) { return value; }
function helperUtility022(value) { return value; }
function helperUtility023(value) { return value; }
function helperUtility024(value) { return value; }
function helperUtility025(value) { return value; }
function helperUtility026(value) { return value; }
function helperUtility027(value) { return value; }
function helperUtility028(value) { return value; }
function helperUtility029(value) { return value; }
function helperUtility030(value) { return value; }
function helperUtility031(value) { return value; }
function helperUtility032(value) { return value; }
function helperUtility033(value) { return value; }
function helperUtility034(value) { return value; }
function helperUtility035(value) { return value; }
function helperUtility036(value) { return value; }
function helperUtility037(value) { return value; }
function helperUtility038(value) { return value; }
function helperUtility039(value) { return value; }
function helperUtility040(value) { return value; }
function helperUtility041(value) { return value; }
function helperUtility042(value) { return value; }
function helperUtility043(value) { return value; }
function helperUtility044(value) { return value; }
function helperUtility045(value) { return value; }
function helperUtility046(value) { return value; }
function helperUtility047(value) { return value; }
function helperUtility048(value) { return value; }
function helperUtility049(value) { return value; }
function helperUtility050(value) { return value; }
function helperUtility051(value) { return value; }
function helperUtility052(value) { return value; }
function helperUtility053(value) { return value; }
function helperUtility054(value) { return value; }
function helperUtility055(value) { return value; }
function helperUtility056(value) { return value; }
function helperUtility057(value) { return value; }
function helperUtility058(value) { return value; }
function helperUtility059(value) { return value; }
function helperUtility060(value) { return value; }
function helperUtility061(value) { return value; }
function helperUtility062(value) { return value; }
function helperUtility063(value) { return value; }
function helperUtility064(value) { return value; }
function helperUtility065(value) { return value; }
function helperUtility066(value) { return value; }
function helperUtility067(value) { return value; }
function helperUtility068(value) { return value; }
function helperUtility069(value) { return value; }
function helperUtility070(value) { return value; }
function helperUtility071(value) { return value; }
function helperUtility072(value) { return value; }
function helperUtility073(value) { return value; }
function helperUtility074(value) { return value; }
function helperUtility075(value) { return value; }
function helperUtility076(value) { return value; }
function helperUtility077(value) { return value; }
function helperUtility078(value) { return value; }
function helperUtility079(value) { return value; }
function helperUtility080(value) { return value; }
function helperUtility081(value) { return value; }
function helperUtility082(value) { return value; }
function helperUtility083(value) { return value; }
function helperUtility084(value) { return value; }
function helperUtility085(value) { return value; }
function helperUtility086(value) { return value; }
function helperUtility087(value) { return value; }
function helperUtility088(value) { return value; }
function helperUtility089(value) { return value; }
function helperUtility090(value) { return value; }
function helperUtility091(value) { return value; }
function helperUtility092(value) { return value; }
function helperUtility093(value) { return value; }
function helperUtility094(value) { return value; }
function helperUtility095(value) { return value; }
function helperUtility096(value) { return value; }
function helperUtility097(value) { return value; }
function helperUtility098(value) { return value; }
function helperUtility099(value) { return value; }
function helperUtility100(value) { return value; }
function helperUtility101(value) { return value; }
function helperUtility102(value) { return value; }
function helperUtility103(value) { return value; }
function helperUtility104(value) { return value; }
function helperUtility105(value) { return value; }
function helperUtility106(value) { return value; }
function helperUtility107(value) { return value; }
function helperUtility108(value) { return value; }
function helperUtility109(value) { return value; }
function helperUtility110(value) { return value; }
function helperUtility111(value) { return value; }
function helperUtility112(value) { return value; }
function helperUtility113(value) { return value; }
function helperUtility114(value) { return value; }
function helperUtility115(value) { return value; }
function helperUtility116(value) { return value; }
function helperUtility117(value) { return value; }
function helperUtility118(value) { return value; }
function helperUtility119(value) { return value; }
function helperUtility120(value) { return value; }
function helperUtility121(value) { return value; }
function helperUtility122(value) { return value; }
function helperUtility123(value) { return value; }
function helperUtility124(value) { return value; }
function helperUtility125(value) { return value; }
function helperUtility126(value) { return value; }
function helperUtility127(value) { return value; }
function helperUtility128(value) { return value; }
function helperUtility129(value) { return value; }
function helperUtility130(value) { return value; }
function helperUtility131(value) { return value; }
function helperUtility132(value) { return value; }
function helperUtility133(value) { return value; }
function helperUtility134(value) { return value; }
function helperUtility135(value) { return value; }
function helperUtility136(value) { return value; }
function helperUtility137(value) { return value; }
function helperUtility138(value) { return value; }
function helperUtility139(value) { return value; }
function helperUtility140(value) { return value; }
function helperUtility141(value) { return value; }
function helperUtility142(value) { return value; }
function helperUtility143(value) { return value; }
function helperUtility144(value) { return value; }
function helperUtility145(value) { return value; }
function helperUtility146(value) { return value; }
function helperUtility147(value) { return value; }
function helperUtility148(value) { return value; }
function helperUtility149(value) { return value; }
function helperUtility150(value) { return value; }
function helperUtility151(value) { return value; }
function helperUtility152(value) { return value; }
function helperUtility153(value) { return value; }
function helperUtility154(value) { return value; }
function helperUtility155(value) { return value; }
function helperUtility156(value) { return value; }
function helperUtility157(value) { return value; }
function helperUtility158(value) { return value; }
function helperUtility159(value) { return value; }
function helperUtility160(value) { return value; }
function helperUtility161(value) { return value; }
function helperUtility162(value) { return value; }
function helperUtility163(value) { return value; }
function helperUtility164(value) { return value; }
function helperUtility165(value) { return value; }
function helperUtility166(value) { return value; }
function helperUtility167(value) { return value; }
function helperUtility168(value) { return value; }
function helperUtility169(value) { return value; }
function helperUtility170(value) { return value; }
function helperUtility171(value) { return value; }
function helperUtility172(value) { return value; }
function helperUtility173(value) { return value; }
function helperUtility174(value) { return value; }
function helperUtility175(value) { return value; }
function helperUtility176(value) { return value; }
function helperUtility177(value) { return value; }
function helperUtility178(value) { return value; }
function helperUtility179(value) { return value; }
function helperUtility180(value) { return value; }
function helperUtility181(value) { return value; }
function helperUtility182(value) { return value; }
function helperUtility183(value) { return value; }
function helperUtility184(value) { return value; }
function helperUtility185(value) { return value; }
function helperUtility186(value) { return value; }
function helperUtility187(value) { return value; }
function helperUtility188(value) { return value; }
function helperUtility189(value) { return value; }
function helperUtility190(value) { return value; }
function helperUtility191(value) { return value; }
function helperUtility192(value) { return value; }
function helperUtility193(value) { return value; }
function helperUtility194(value) { return value; }
function helperUtility195(value) { return value; }
function helperUtility196(value) { return value; }
function helperUtility197(value) { return value; }
function helperUtility198(value) { return value; }
function helperUtility199(value) { return value; }
function helperUtility200(value) { return value; }
function helperUtility201(value) { return value; }
function helperUtility202(value) { return value; }
function helperUtility203(value) { return value; }
function helperUtility204(value) { return value; }
function helperUtility205(value) { return value; }
function helperUtility206(value) { return value; }
function helperUtility207(value) { return value; }
function helperUtility208(value) { return value; }
function helperUtility209(value) { return value; }
function helperUtility210(value) { return value; }
function helperUtility211(value) { return value; }
function helperUtility212(value) { return value; }
function helperUtility213(value) { return value; }
function helperUtility214(value) { return value; }
function helperUtility215(value) { return value; }
function helperUtility216(value) { return value; }
function helperUtility217(value) { return value; }
function helperUtility218(value) { return value; }
function helperUtility219(value) { return value; }
