const fs = require("fs");
const path = require("path");
const icons = require('./icons.js');

// Data paths
const transactionsPath = path.join(__dirname, "transactions.json");
const configPath = path.join(__dirname, "config.json");

// Data variables
let transactions = [];
let types = [];
let categories = [];

// Charts
let dashboardCharts = {};


function loadData() {
  if (!fs.existsSync(transactionsPath)) fs.writeFileSync(transactionsPath, JSON.stringify([]));
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      types: [
        { name: "expense", bg: "#fee2e2", text: "#b91c1c", impact: "negative" },
        { name: "income", bg: "#d1fae5", text: "#065f46", impact: "positive" },
        { name: "investment", bg: "#dbeafe", text: "#1e3a8a", impact: "neutral" }
      ],
      categories: []
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  }

  try {
    transactions = JSON.parse(fs.readFileSync(transactionsPath));
    const config = JSON.parse(fs.readFileSync(configPath));

    // Forzar estructura completa para types
    types = config.types.map(t => {
      if (typeof t === "string") {
        return {
          name: t,
          bg: "#e0f2fe",
          text: "#0369a1",
          impact: "neutral"
        };
      }
      return {
        name: t.name,
        bg: t.bg || "#e0f2fe",
        text: t.text || "#0369a1",
        impact: t.impact || "neutral"
      };
    });

    // Forzar estructura completa para categories
    categories = config.categories.map(c => {
      if (typeof c === "string") {
        return {
          name: c,
          bg: "#f3f4f6",
          text: "#1f2937"
        };
      }
      return {
        name: c.name,
        bg: c.bg || "#f3f4f6",
        text: c.text || "#1f2937"
      };
    });
  } catch (err) {
    console.error("Error loading data:", err);
    transactions = [];
    types = [];
    categories = [];
  }
}



function saveTransactions() {
  fs.writeFileSync(transactionsPath, JSON.stringify(transactions, null, 2));
}

function saveConfig() {
  fs.writeFileSync(configPath, JSON.stringify({ types, categories }, null, 2));
}

// ---------------------- UI LOGIC ------------------------

function switchTab(tabId) {
  document.querySelectorAll("[data-tab]").forEach(el => el.classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");

  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("tab-active"));
  document.getElementById("tab-" + tabId).classList.add("tab-active");

  if (tabId === "dashboard") drawDashboard();
  if (tabId === "expenses") drawExpenses();
  if (tabId === "configuration") drawConfiguration();
}

// ---------------------- DASHBOARD -----------------------

function drawDashboard() {
  const container = document.getElementById("dashboard-content");
  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="p-4 bg-gradient-to-tr from-purple-100 to-white rounded-xl shadow">
        <div class="flex items-center space-x-4">
          <div class="bg-purple-500 text-white p-3 rounded-full">
            <i class="fas fa-wallet"></i>
          </div>
          <div>
            <div class="text-sm text-gray-500">Total Balance</div>
            <div class="flex mt-1">
              <div class="text-xl font-semibold text-gray-800" id="card-balance">0€</div>
              <div class="text-xs flex items-center space-x-1 ml-2" id="card-balance-change"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="p-4 bg-gradient-to-tr from-green-100 to-white rounded-xl shadow">
        <div class="flex items-center space-x-4">
          <div class="bg-green-500 text-white p-3 rounded-full">
            <i class="fas fa-arrow-down"></i>
          </div>
          <div>
            <div class="text-sm text-gray-500">Total Income</div>
            <div class="flex mt-1">
              <div class="text-xl font-semibold text-gray-800" id="card-income">0€</div>
              <div class="text-xs flex items-center space-x-1 ml-2" id="card-income-change"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="p-4 bg-gradient-to-tr from-red-100 to-white rounded-xl shadow">
        <div class="flex items-center space-x-4">
          <div class="bg-red-500 text-white p-3 rounded-full">
            <i class="fas fa-arrow-up"></i>
          </div>
          <div>
            <div class="text-sm text-gray-500">Total Expenses</div>
            <div class="flex mt-1">
              <div class="text-xl font-semibold text-gray-800" id="card-expense">0€</div>
              <div class="text-xs flex items-center space-x-1 ml-2" id="card-expense-change"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="p-4 bg-gradient-to-tr from-blue-100 to-white rounded-xl shadow">
        <div class="flex items-center space-x-4">
          <div class="bg-blue-500 text-white p-3 rounded-full">
            <i class="fas fa-chart-line"></i>
          </div>
          <div>
            <div class="text-sm text-gray-500">Investments</div>
            <div class="flex mt-1">
              <div class="text-xl font-semibold text-gray-800" id="card-invest">0€</div>
              <div class="text-xs flex items-center space-x-1 ml-2" id="card-invest-change"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Monthly Cash Flow</h3>
        <div class="chart-container"><canvas id="monthlyChart"></canvas></div>
      </div>
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Income Trends</h3>
        <div class="chart-container"><canvas id="incomeChart"></canvas></div>
      </div>
      <div class="lg:col-span-2 card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Expense Categories</h3>
        <div class="chart-container"><canvas id="categoryBarChart"></canvas></div>
      </div>
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Expenses Overview</h3>
        <div class="chart-container"><canvas id="expenseLineChart"></canvas></div>
      </div>
    </div>
  `;

  // Agrupar por mes e impacto
  const monthlyMap = {}; // { 'YYYY-MM': { positive: 0, negative: 0, neutral: 0 } }

  transactions.forEach(t => {
    const date = new Date(t.date);
    if (isNaN(date)) return;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const type = types.find(tp => tp.name === t.type);
    const impact = type?.impact || "neutral";

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { positive: 0, negative: 0, neutral: 0 };
    }

    monthlyMap[monthKey][impact] += t.amount;
  });

  const sortedMonths = Object.keys(monthlyMap).sort();
  const positive = sortedMonths.map(m => monthlyMap[m].positive || 0);
  const negative = sortedMonths.map(m => monthlyMap[m].negative || 0);
  const neutral = sortedMonths.map(m => monthlyMap[m].neutral || 0);
  const monthLabels = sortedMonths.map(m => {
    const [y, mm] = m.split("-");
    return new Date(y, mm - 1).toLocaleString("default", { month: "short", year: "numeric" });
  });

  const lastMonthKey = sortedMonths.at(-1);
  const prevMonthKey = sortedMonths.at(-2);
  const current = monthlyMap[lastMonthKey] || { positive: 0, negative: 0, neutral: 0 };
  const previous = monthlyMap[prevMonthKey] || { positive: 0, negative: 0, neutral: 0 };

  const format = v => `${v.toLocaleString("es-ES")}€`;
  const getChange = (curr, prev) => {
    const pct = prev === 0 ? 100 : Math.round(((curr - prev) / prev) * 100);
    const icon = pct >= 0 ? "fa-arrow-up text-green-600" : "fa-arrow-down text-red-600";
    const color = pct >= 0 ? "text-green-600" : "text-red-600";
    return `<i class="fas ${icon}"></i><span class="${color}">${Math.abs(pct)}%</span>`;
  };

  // Cards resumen
  document.getElementById("card-income").innerText = format(current.positive);
  document.getElementById("card-expense").innerText = format(current.negative);
  document.getElementById("card-invest").innerText = format(current.neutral);
  document.getElementById("card-balance").innerText = format(current.positive - current.negative + current.neutral);

  document.getElementById("card-income-change").innerHTML = getChange(current.positive, previous.positive);
  document.getElementById("card-expense-change").innerHTML = getChange(current.negative, previous.negative);
  document.getElementById("card-invest-change").innerHTML = getChange(current.neutral, previous.neutral);
  document.getElementById("card-balance-change").innerHTML = getChange(
    current.positive - current.negative + current.neutral,
    previous.positive - previous.negative + previous.neutral
  );

  // Redibujar gráficos
  if (dashboardCharts.monthly) dashboardCharts.monthly.destroy();
  if (dashboardCharts.income) dashboardCharts.income.destroy();
  if (dashboardCharts.categories) dashboardCharts.categories.destroy();

  dashboardCharts.monthly = new Chart(document.getElementById("monthlyChart"), {
    type: "bar",
    data: {
      labels: monthLabels,
      datasets: [
        { label: "Positive", data: positive, backgroundColor: "#22c55e" },
        { label: "Negative", data: negative, backgroundColor: "#ef4444" },
        { label: "Neutral", data: neutral, backgroundColor: "#3b82f6" }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  dashboardCharts.income = new Chart(document.getElementById("incomeChart"), {
    type: "line",
    data: {
      labels: monthLabels,
      datasets: [
        { label: "Positive", data: positive, borderColor: "#22c55e", tension: 0.3 },
        { label: "Neutral", data: neutral, borderColor: "#3b82f6", tension: 0.3 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Categorías del último mes
  const categoryTotals = {};
  transactions.forEach(t => {
    const type = types.find(tp => tp.name === t.type);
    const impact = type?.impact || "neutral";
    if (impact === "negative" && t.date.startsWith(lastMonthKey)) {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  });

  dashboardCharts.categories = new Chart(document.getElementById("categoryBarChart"), {
    type: "bar",
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        label: "Expenses by Category",
        data: Object.values(categoryTotals),
        backgroundColor: "#f97316"
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}



function drawCharts() {
  const monthlyMap = {}; // { YYYY-MM: { positive: 0, negative: 0, neutral: 0 } }

  transactions.forEach(t => {
    const date = new Date(t.date);
    if (isNaN(date)) return;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const type = types.find(tp => tp.name === t.type);
    const impact = type?.impact || "neutral";

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { positive: 0, negative: 0, neutral: 0 };
    }

    monthlyMap[monthKey][impact] += t.amount;
  });

  const sortedMonths = Object.keys(monthlyMap).sort();
  const positive = sortedMonths.map(m => monthlyMap[m].positive || 0);
  const negative = sortedMonths.map(m => monthlyMap[m].negative || 0);
  const neutral = sortedMonths.map(m => monthlyMap[m].neutral || 0);
  const monthLabels = sortedMonths.map(m => {
    const [y, mm] = m.split("-");
    return new Date(y, mm - 1).toLocaleString("default", { month: "short", year: "numeric" });
  });

  // Agrupar por categoría (último mes solo gastos)
  const lastMonth = sortedMonths.at(-1);
  const categoryTotals = {};
  transactions.forEach(t => {
    const type = types.find(tp => tp.name === t.type);
    const impact = type?.impact || "neutral";
    if (impact === "negative" && t.date.startsWith(lastMonth)) {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  });

  // Destruir gráficos anteriores si existen
  if (dashboardCharts.monthly) dashboardCharts.monthly.destroy();
  if (dashboardCharts.income) dashboardCharts.income.destroy();
  if (dashboardCharts.categories) dashboardCharts.categories.destroy();

  // Gráfico mensual (barras)
  dashboardCharts.monthly = new Chart(document.getElementById("monthlyChart"), {
    type: "bar",
    data: {
      labels: monthLabels,
      datasets: [
        { label: "Positive", data: positive, backgroundColor: "#22c55e" },
        { label: "Negative", data: negative, backgroundColor: "#ef4444" },
        { label: "Neutral", data: neutral, backgroundColor: "#3b82f6" }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Gráfico de línea de tendencias
  dashboardCharts.income = new Chart(document.getElementById("incomeChart"), {
    type: "line",
    data: {
      labels: monthLabels,
      datasets: [
        { label: "Positive", data: positive, borderColor: "#22c55e", tension: 0.3 },
        { label: "Neutral", data: neutral, borderColor: "#3b82f6", tension: 0.3 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Gráfico de barras por categoría (gastos)
  dashboardCharts.categories = new Chart(document.getElementById("categoryBarChart"), {
    type: "bar",
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        label: "Expenses by Category",
        data: Object.values(categoryTotals),
        backgroundColor: "#f97316"
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}


// ---------------------- EXPENSES -----------------------

function drawExpenses() {
  const container = document.getElementById("expenses-content");
  container.innerHTML = `
  <div class="flex justify-between items-center mb-4">
    <h3 class="text-xl font-semibold">Your Transactions</h3>
    <select id="filter-range" class="border rounded px-2 py-1 text-sm">
      <option value="month">Este mes</option>
      <option value="30">Últimos 30 días</option>
      <option value="90">Últimos 3 meses</option>
      <option value="year">Este año</option>
      <option value="all">Todo</option>
    </select>
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div>
      <div class="card">
        <h3 class="text-lg font-medium mb-4">Add Transaction</h3>
        <form id="transaction-form" class="space-y-4">
          <input type="hidden" id="trans-id" />
          <select id="trans-type" class="w-full border p-2 rounded">
            ${types.map(t => `<option value="${t.name}">${t.name}</option>`).join("")}
          </select>
          <input type="number" id="trans-amount" placeholder="Amount" class="w-full border p-2 rounded" />
          <input type="text" id="trans-desc" placeholder="Description" class="w-full border p-2 rounded" />
          <select id="trans-cat" class="w-full border p-2 rounded">
            ${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}
          </select>
          <input type="date" id="trans-date" class="w-full border p-2 rounded" />
          <button class="bg-purple-600 text-white px-4 py-2 rounded w-full">Save</button>
        </form>
      </div>
    </div>
    <div class="lg:col-span-2">
      <div class="card h-[calc(100vh-280px)] overflow-y-auto">
        <h3 class="text-lg font-medium mb-4 sticky top-0 bg-white z-10 pt-4">Transactions</h3>
        <ul id="transaction-list" class="divide-y divide-gray-200"></ul>
      </div>
    </div>
  </div>
`;



  // Form logic
  const form = document.getElementById("transaction-form");
  form.onsubmit = e => {
    e.preventDefault();
    const id = document.getElementById("trans-id").value || ("t" + Date.now());
    const t = {
      id,
      type: document.getElementById("trans-type").value,
      amount: parseFloat(document.getElementById("trans-amount").value),
      description: document.getElementById("trans-desc").value,
      category: document.getElementById("trans-cat").value,
      date: document.getElementById("trans-date").value
    };

    const index = transactions.findIndex(tr => tr.id === id);
    if (index >= 0) transactions[index] = t;
    else transactions.push(t);

    const currentFilter = document.getElementById("filter-range").value;

    saveTransactions();
    drawExpenses();
    
    const filterDropdown = document.getElementById("filter-range");
    if (filterDropdown) filterDropdown.value = currentFilter;
    
    drawCharts();
    renderTransactionList();
  };

  // Filtro activo
  const filterDropdown = document.getElementById("filter-range");
  if (filterDropdown) {
    filterDropdown.onchange = () => renderTransactionList();
  }

  renderTransactionList(); // mostrar lista inicial
}

function renderTransactionList() {
  const ul = document.getElementById("transaction-list");
  if (!ul) return;

  ul.innerHTML = "";

  const filter = document.getElementById("filter-range")?.value || "month";
  const now = new Date();
  let filtered = [...transactions];

  filtered = filtered.filter(t => {
    const d = new Date(t.date);
    if (isNaN(d)) return false;

    if (filter === "all") return true;
    if (filter === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (filter === "year") return d.getFullYear() === now.getFullYear();

    const days = parseInt(filter);
    if (!isNaN(days)) {
      const pastDate = new Date(now);
      pastDate.setDate(now.getDate() - days);
      return d >= pastDate && d <= now;
    }

    return true;
  });

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  filtered.forEach(t => {
    const li = document.createElement("li");
    li.className = "py-4 px-2 flex justify-between items-center hover:bg-gray-50 rounded";

    const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const iconSVG = icons[normalize(t.category)] || null;


    const cat = categories.find(c => c.name === t.category);
    const typeDef = types.find(tp => tp.name === t.type);

    const catBg = cat?.bg || "#f3f4f6";
    const catText = cat?.text || "#374151";
    const impact = typeDef?.impact || "neutral";

    const amountColor = impact === "positive"
      ? "text-green-600"
      : impact === "negative"
      ? "text-red-600"
      : "text-gray-700";

    const sign = impact === "positive" ? "+" : impact === "negative" ? "-" : "";

    const dateStr = new Date(t.date).toLocaleDateString("es-ES", {
      day: "2-digit", month: "short", year: "numeric"
    });

    li.innerHTML = `
      <div class="flex items-center space-x-4">
        <div class="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 p-1" style="background-color: ${catBg}; color: ${catText}">
          ${iconSVG || `<i class="fas fa-circle"></i>`}
        </div>
        <div>
          <div class="font-medium text-gray-800">${t.description}</div>
          <div class="flex mt-1">
            <span class="text-sm text-gray-500">${dateStr}</span>
            <div class="text-sm inline-block px-2 py-1 rounded-full text-xs ml-2"
              style="background-color: ${catBg}; color: ${catText}">
              ${t.category || "Sin categoría"}
            </div>
          </div>
        </div>
      </div>
      <div class="text-right space-y-1">
        <div class="font-semibold ${amountColor}">
          ${sign}${(Number(t.amount) || 0).toFixed(2)}€
        </div>
        <div class="flex justify-end space-x-2 mt-1">
          <button onclick="editTransaction('${t.id}')" class="text-gray-500 hover:text-blue-600"><i class="fas fa-edit"></i></button>
          <button onclick="deleteTransaction('${t.id}')" class="text-gray-500 hover:text-red-600"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;

    ul.appendChild(li);
  });
}



function openCategoryEditModal(name) {
  const cat = categories.find(c => c.name === name);
  if (!cat) return;

  document.getElementById("edit-cat-original").value = cat.name;
  document.getElementById("edit-cat-name").value = cat.name;
  document.getElementById("edit-cat-bg").value = cat.bg || "#e5e7eb";
  document.getElementById("edit-cat-text").value = cat.text || "#374151";

  document.getElementById("category-edit-modal").classList.remove("hidden");
}

function saveCategoryEdit() {
  const original = document.getElementById("edit-cat-original").value;
  const name = document.getElementById("edit-cat-name").value.trim();
  const bg = document.getElementById("edit-cat-bg").value;
  const text = document.getElementById("edit-cat-text").value;

  if (!name) return alert("Nombre obligatorio");

  // Actualizar categoría
  const index = categories.findIndex(c => c.name === original);
  if (index === -1) return;

  categories[index] = { name, bg, text };

  // Actualizar transacciones si cambió el nombre
  if (name !== original) {
    transactions.forEach(t => {
      if (t.category === original) t.category = name;
    });
  }

  saveConfig();
  saveTransactions();
  drawConfiguration();
  drawExpenses();
  drawCharts();

  closeCategoryEditModal();
}

function closeCategoryEditModal() {
  document.getElementById("category-edit-modal").classList.add("hidden");
}

function editTransaction(id) {
  const t = transactions.find(t => t.id === id);
  if (!t) return;
  document.getElementById("trans-id").value = t.id;
  document.getElementById("trans-type").value = t.type;
  document.getElementById("trans-amount").value = t.amount;
  document.getElementById("trans-desc").value = t.description;
  document.getElementById("trans-cat").value = t.category;
  document.getElementById("trans-date").value = t.date;
}

// ---------------------- CONFIGURATION -----------------------

function drawConfiguration() {
  const container = document.getElementById("configuration-content");
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      ${renderConfigSection("Transaction Types", types, "type")}
      ${renderConfigSection("Categories", categories, "category")}
    </div>
  `;
}

function renderConfigSection(title, items, kind) {
  return `
    <div class="card">
      <h3 class="text-lg font-medium mb-4">${title}</h3>
        <form onsubmit="addItem(event,'${kind}')" class="flex space-x-2 mb-4">
          <input type="text" id="new-${kind}" class="flex-1 border p-2 rounded" placeholder="Nuevo ${kind}" />
          <button class="bg-purple-600 text-white px-3 py-2 rounded">Añadir</button>
        </form>
      <ul id="${kind}-list" class="divide-y divide-gray-200 mb-4">
        ${items.map(item => {
          const name = typeof item === "string" ? item : item.name;
          const bg = item.bg || "#f3f4f6";
          const text = item.text || "#1f2937";

          const label = `
            <span style="background-color: ${bg}; color: ${text}"
              class="px-2 py-1 text-xs rounded-full inline-block">
              ${name}
            </span>`;

            let editBtn = "";
            if (kind === "category") {
              editBtn = `<button onclick="openCategoryEditModal('${name}')" class="text-blue-500"><i class="fas fa-edit"></i></button>`;
            } else if (kind === "type") {
              editBtn = `<button onclick="openTypeEditModal('${name}')" class="text-blue-500"><i class="fas fa-edit"></i></button>`;
            }

          return `
            <li class="py-2 flex justify-between items-center">
              ${label}
              <div class="flex space-x-2">
                ${editBtn}
                <button onclick="deleteItem('${name}','${kind}')" class="text-red-500"><i class="fas fa-trash"></i></button>
              </div>
            </li>`;
        }).join("")}
      </ul>
    </div>
  `;
}

function openTypeEditModal(name) {
  const type = types.find(t => t.name === name);
  if (!type) return;

  document.getElementById("edit-type-original").value = type.name;
  document.getElementById("edit-type-name").value = type.name;
  document.getElementById("edit-type-bg").value = type.bg || "#e0f2fe";
  document.getElementById("edit-type-text").value = type.text || "#1f2937";
  document.getElementById("edit-type-impact").value = type.impact || "neutral";

  document.getElementById("type-edit-modal").classList.remove("hidden");
}


function saveTypeEdit() {
  const original = document.getElementById("edit-type-original").value;
  const name = document.getElementById("edit-type-name").value.trim();
  const bg = document.getElementById("edit-type-bg").value;
  const text = document.getElementById("edit-type-text").value;
  const impact = document.getElementById("edit-type-impact").value;

  if (!name) return alert("Nombre obligatorio");

  const index = types.findIndex(t => t.name === original);
  if (index === -1) return;

  types[index] = { name, bg, text, impact };

  if (name !== original) {
    transactions.forEach(t => {
      if (t.type === original) t.type = name;
    });
  }

  saveConfig();
  saveTransactions();
  drawConfiguration();
  drawExpenses();
  drawCharts();

  closeTypeEditModal();
}


function closeTypeEditModal() {
  document.getElementById("type-edit-modal").classList.add("hidden");
}



function addItem(e, kind) {
  e.preventDefault();
  const input = document.getElementById("new-" + kind);
  const value = input.value.trim();
  if (!value) return;

  if (kind === "type") types.push(value);
  else categories.push(value);

  saveConfig();
  drawConfiguration();
}

function deleteItem(value, kind) {
  const list = document.getElementById(kind + "-list");
  const li = [...list.children].find(el => el.textContent.includes(value));
  if (!li) return;

  li.innerHTML = `
    <span class="text-red-600">Delete <strong>${value}</strong>?</span>
    <button onclick="confirmDeleteItem('${value}', '${kind}')" class="text-red-600 ml-2"><i class="fas fa-check"></i></button>
    <button onclick="drawConfiguration()" class="text-gray-400 ml-2"><i class="fas fa-times"></i></button>
  `;
}

function confirmDeleteItem(value, kind) {
  if (kind === "type") {
    types = types.filter(t => t !== value);
    transactions.forEach(t => {
      if (t.type === value) t.type = "Indefinido"; // opcional: poner "" o "undefined"
    });
  } else {
    categories = categories.filter(c => c !== value);
    transactions.forEach(t => {
      if (t.category === value) t.category = "";
    });
  }

  saveConfig();
  saveTransactions();
  drawConfiguration();
  drawExpenses();
  drawCharts();
}


function editItem(value, kind) {
  const list = document.getElementById(kind + "-list");
  const li = [...list.children].find(el => el.textContent.includes(value));
  if (!li) return;

  const inputId = `edit-${kind}-${value}`;

  li.innerHTML = `
    <input id="${inputId}" class="border p-1 rounded w-1/2 mr-2" value="${value}" />
    <button onclick="saveItemEdit('${value}', '${kind}')" class="text-green-600"><i class="fas fa-check"></i></button>
    <button onclick="drawConfiguration()" class="text-gray-400 ml-2"><i class="fas fa-times"></i></button>
  `;
}

function saveItemEdit(oldValue, kind) {
  const input = document.getElementById(`edit-${kind}-${oldValue}`);
  const newValue = input.value.trim();
  if (!newValue || newValue === oldValue) {
    drawConfiguration();
    return;
  }

  if (kind === "type") {
    types = types.map(t => t === oldValue ? newValue : t);
    transactions.forEach(t => {
      if (t.type === oldValue) t.type = newValue;
    });
  } else {
    categories = categories.map(c => c === oldValue ? newValue : c);
    transactions.forEach(t => {
      if (t.category === oldValue) t.category = newValue;
    });
  }

  saveConfig();
  saveTransactions();
  drawConfiguration();
  drawExpenses();
  drawCharts();
}


// ---------------------- INIT -----------------------

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  switchTab("dashboard");
});
