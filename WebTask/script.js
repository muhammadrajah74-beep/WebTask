
const STORAGE_KEY = "webtask_tasks_v1";

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let editingId = null;

const $ = (id) => document.getElementById(id);

const modal = $("taskModal");
const form = $("taskForm");

const boardNav = $("boardNav");
const allTasksNav = $("allTasksNav");

// Menyimpan data tugas
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  render();
}

// Membuka formulir tugas
function openModal(status = "todo", task = null) {
  editingId = task ? task.id : null;

  $("modalTitle").textContent = task ? "Edit Tugas" : "Tambah Tugas";
  $("taskTitle").value = task ? task.title : "";
  $("taskDescription").value = task ? task.description : "";
  $("taskPriority").value = task ? task.priority : "Sedang";
  $("taskStatus").value = task ? task.status : status;
  $("taskAssignee").value = task ? task.assignee : "";

  modal.classList.remove("hidden");
  $("taskTitle").focus();
}

// Menutup formulir
function closeModal() {
  modal.classList.add("hidden");
  form.reset();
  editingId = null;
}

// Menampilkan tugas
function render() {
  const query = $("searchInput").value.trim().toLowerCase();
  const priority = $("priorityFilter").value;

  const statuses = ["todo", "doing", "done"];

  const visibleTasks = tasks.filter(task => {
    const matchesText =
      `${task.title} ${task.description} ${task.assignee}`
      .toLowerCase()
      .includes(query);

    const matchesPriority =
      priority === "all" || task.priority === priority;

    return matchesText && matchesPriority;
  });

  statuses.forEach(status => {
    const items = visibleTasks.filter(
      task => task.status === status
    );

    const list = $(`${status}List`);

    $(`${status}ColumnCount`).textContent = items.length;

    list.innerHTML = "";

    if (items.length === 0) {
      list.innerHTML = `
        <div class="empty">
          <span>＋</span>
          Belum ada tugas di sini
        </div>
      `;
      return;
    }

    items.forEach(task => {
      const card = document.createElement("article");
      card.className = "task-card";

      const badge = document.createElement("span");
      badge.className = `priority ${task.priority}`;
      badge.textContent = `Prioritas ${task.priority}`;

      const title = document.createElement("h4");
      title.textContent = task.title;

      const description = document.createElement("p");
      description.textContent =
        task.description || "Tidak ada deskripsi.";

      const meta = document.createElement("div");
      meta.className = "task-meta";

      const assignee = document.createElement("span");
      assignee.className = "assignee";
      assignee.textContent = task.assignee
        ? `◉ ${task.assignee}`
        : "◉ Belum ditentukan";

      const actions = document.createElement("div");
      actions.className = "task-actions";

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        openModal(status, task);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Hapus";
      deleteBtn.addEventListener("click", () => {
        deleteTask(task.id);
      });

      actions.append(editBtn, deleteBtn);
      meta.append(assignee, actions);

      card.append(badge, title, description, meta);

      const move = document.createElement("select");
      move.className = "move-select";
      move.setAttribute("aria-label", "Ubah status tugas");

      move.innerHTML = `
        <option value="todo">To Do</option>
        <option value="doing">Doing</option>
        <option value="done">Done</option>
      `;

      move.value = task.status;

      move.addEventListener("change", () => {
        task.status = move.value;
        saveTasks();
      });

      move.style.cssText =
        "width:100%;margin-top:10px;border:1px solid #eceef5;border-radius:6px;padding:6px;font-size:10px;color:#687087;background:#fff";

      card.append(move);
      list.append(card);
    });
  });

  // Menghitung jumlah tugas
  $("totalCount").textContent = tasks.length;

  $("todoCount").textContent =
    tasks.filter(t => t.status === "todo").length;

  $("doingCount").textContent =
    tasks.filter(t => t.status === "doing").length;

  $("doneCount").textContent =
    tasks.filter(t => t.status === "done").length;
}

// Menghapus tugas
function deleteTask(id) {
  if (!confirm("Yakin ingin menghapus tugas ini?")) return;

  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
}

// Menyimpan tugas dari formulir
form.addEventListener("submit", event => {
  event.preventDefault();

  const data = {
    title: $("taskTitle").value.trim(),
    description: $("taskDescription").value.trim(),
    priority: $("taskPriority").value,
    status: $("taskStatus").value,
    assignee: $("taskAssignee").value.trim()
  };

  if (!data.title) return;

  if (editingId) {
    tasks = tasks.map(task =>
      task.id === editingId
        ? { ...task, ...data }
        : task
    );
  } else {
    tasks.push({
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString()
    });
  }

  saveTasks();
  closeModal();
});

// Tombol tambah tugas
$("addTaskBtn").addEventListener("click", () => {
  openModal();
});

// Tombol tambah pada setiap kolom
document.querySelectorAll("[data-add]").forEach(button => {
  button.addEventListener("click", () => {
    openModal(button.dataset.add);
  });
});

// Tombol tutup dan batal
$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);

// Menutup modal jika klik bagian luar
modal.addEventListener("click", event => {
  if (event.target === modal) {
    closeModal();
  }
});

// Pencarian dan filter
$("searchInput").addEventListener("input", render);
$("priorityFilter").addEventListener("change", render);

// Fungsi menu Papan Tugas
boardNav.addEventListener("click", () => {
  boardNav.classList.add("active");
  allTasksNav.classList.remove("active");

  $("searchInput").value = "";
  $("priorityFilter").value = "all";

  render();
});

// Fungsi menu Semua Tugas
allTasksNav.addEventListener("click", () => {
  allTasksNav.classList.add("active");
  boardNav.classList.remove("active");

  $("searchInput").value = "";
  $("priorityFilter").value = "all";

  render();
});

// Menampilkan data saat website dibuka
render();
