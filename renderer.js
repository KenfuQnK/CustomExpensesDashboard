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
let pendingDeleteId = null;
let darkMode = localStorage.getItem('darkMode') === 'true';

// Charts
let dashboardCharts = {};

//-------------------------------------------- DARK MODE

function toggleDarkMode() {
  darkMode = !darkMode;
  applyDarkMode();
  localStorage.setItem('darkMode', darkMode);
}

function applyDarkMode() {
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Llamar a esta función al inicio para aplicar el modo guardado
function initializeDarkMode() {
  // Cargar preferencia guardada
  if (localStorage.getItem('darkMode') === null) {
    // Detectar preferencia del sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    darkMode = prefersDark;
    localStorage.setItem('darkMode', darkMode);
  }
  applyDarkMode();
}

// Agregar esta función para modificar el UI con el botón de modo oscuro
function addDarkModeToggle() {
  const headerControls = document.querySelector('header .flex.items-center.space-x-4');
  if (!headerControls) return;
  
  const darkModeBtn = document.createElement('button');
  darkModeBtn.id = 'dark-mode-toggle';
  darkModeBtn.className = 'text-xl';
  darkModeBtn.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  darkModeBtn.addEventListener('click', () => {
    toggleDarkMode();
    darkModeBtn.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  });
  
  headerControls.prepend(darkModeBtn);
}

//--------------------------------------------

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
  mostrarNotificacion("Transacción guardada");
}

function saveConfig() {
  fs.writeFileSync(configPath, JSON.stringify({ types, categories }, null, 2));
  mostrarNotificacion("Configuración actualizada");
}

function mostrarNotificacion(texto) {
  const aviso = document.createElement("div");
  aviso.className = "fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-out";
  aviso.innerText = texto;
  document.body.appendChild(aviso);
  setTimeout(() => aviso.remove(), 2500);
}

function validarCampoObligatorio(inputEl) {
  if (!inputEl.value.trim()) {
    inputEl.classList.add("border-red-500");
    return false;
  } else {
    inputEl.classList.remove("border-red-500");
    return true;
  }
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
      <div class="card lg:col-span-1">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Distribución % del gasto</h3>
        <div class="chart-container"><canvas id="expenseDonutChart"></canvas></div>
      </div>
    </div>
  `;

  // Agrupar por mes e impacto
  const monthlyMap = {}; 

  transactions.forEach(t => {
    const date = new Date(t.date);
    if (isNaN(date)) return;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const type = types.find(tp => normalize(tp.name) === normalize(t.type));
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
// Agrupar y ordenar categorías de mayor a menor gasto
const categoryTotals = {};
transactions.forEach(t => {
  const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const type = types.find(tp => normalize(tp.name) === normalize(t.type));  

  if (!type) {
    console.warn(`❗ Tipo no encontrado en 'types': "${t.type}" (transacción ID: ${t.id})`);
  }

  const impact = type?.impact || "neutral";
  if (impact === "negative") {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  }
});



// Ordenar por gasto descendente
const sortedEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
const sortedLabels = sortedEntries.map(([cat]) => cat);
const sortedData = sortedEntries.map(([, amount]) => amount);

  dashboardCharts.categories = new Chart(document.getElementById("categoryBarChart"), {
    type: "bar",
    data: {
      labels: sortedLabels,
      datasets: [{
        label: "Expenses by Category",
        data: sortedData,
        backgroundColor: "#f97316"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return value + "€";
            }
          }
        }
      }
    }
  });

  // ---------- NUEVO GRÁFICO: EXPENSES OVERVIEW ----------

// Paso 1: calcular los últimos 6 meses
const now = new Date();
const last6Months = Array.from({ length: 6 }).map((_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - 5 + i);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const label = d.toLocaleString("default", { month: "short", year: "numeric" });
  return { key, label };
});

// Paso 2: acumular gastos por categoría y mes
const monthlyCategoryData = {}; // { monthKey: { cat: total, ... }, ... }

transactions.forEach(t => {
  const date = new Date(t.date);
  if (isNaN(date)) return;

  const type = types.find(tp => tp.name === t.type);
  const impact = type?.impact || "neutral";
  if (impact !== "negative") return;

  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const month = last6Months.find(m => m.key === monthKey);
  if (!month) return;

  if (!monthlyCategoryData[monthKey]) monthlyCategoryData[monthKey] = {};
  const cat = t.category || "Sin categoría";
  monthlyCategoryData[monthKey][cat] = (monthlyCategoryData[monthKey][cat] || 0) + t.amount;
});

// Paso 3: determinar top 5 categorías globales por gasto total
const totalPerCategory = {};
transactions.forEach(t => {
  const type = types.find(tp => tp.name === t.type);
  const impact = type?.impact || "neutral";
  if (impact !== "negative") return;
  const cat = t.category || "Sin categoría";
  totalPerCategory[cat] = (totalPerCategory[cat] || 0) + t.amount;
});

const topCategories = Object.entries(totalPerCategory)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([cat]) => cat);

// Paso 4: construir datasets
const datasets = [];

const getColor = cat => {
  const c = categories.find(c => c.name === cat);
  return c ? c.bg : "#d1d5db"; // gris por defecto
};

topCategories.forEach(cat => {
  datasets.push({
    label: cat,
    data: last6Months.map(m => monthlyCategoryData[m.key]?.[cat] || 0),
    backgroundColor: getColor(cat),
    stack: "gastos"
  });
});

// Agrupar "otros"
datasets.push({
  label: "Otros",
  data: last6Months.map(m => {
    const data = monthlyCategoryData[m.key] || {};
    const totalOtros = Object.entries(data)
      .filter(([cat]) => !topCategories.includes(cat))
      .reduce((acc, [, val]) => acc + val, 0);
    return totalOtros;
  }),
  backgroundColor: "#9ca3af", // gris neutro
  stack: "gastos"
});

// Destruir anterior si existe
if (dashboardCharts.expenseLine) dashboardCharts.expenseLine.destroy();

// Crear nuevo gráfico apilado
dashboardCharts.expenseLine = new Chart(document.getElementById("expenseLineChart"), {
  type: "bar",
  data: {
    labels: last6Months.map(m => m.label),
    datasets
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${ctx.formattedValue}€`
        }
      }
    },
    scales: {
      x: { stacked: true },
      y: {
        stacked: true,
        ticks: {
          callback: value => value + "€"
        }
      }
    }
  }
});

// Gráfico Donut: Distribución porcentual de gastos por categoría (último mes)
if (dashboardCharts.expenseDonut) dashboardCharts.expenseDonut.destroy();

const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const lastMonthExpenses = transactions.filter(t => {
  const d = new Date(t.date);
  const type = types.find(tp => tp.name === t.type);
  const impact = type?.impact;
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return impact === "negative" && key === currentMonthKey;
});

const donutTotals = {};
lastMonthExpenses.forEach(t => {
  const cat = t.category || "Sin categoría";
  donutTotals[cat] = (donutTotals[cat] || 0) + t.amount;
});

const donutLabels = Object.keys(donutTotals);
const donutValues = Object.values(donutTotals);
const donutColors = donutLabels.map(cat => {
  const c = categories.find(c => c.name === cat);
  return c?.bg || "#e5e7eb";
});

const donutCtx = document.getElementById("expenseDonutChart");
if (donutCtx) {
  dashboardCharts.expenseDonut = new Chart(donutCtx, {
    type: "doughnut",
    data: {
      labels: donutLabels,
      datasets: [{
        data: donutValues,
        backgroundColor: donutColors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const label = ctx.label || "";
              const value = ctx.raw || 0;
              const total = donutValues.reduce((a, b) => a + b, 0);
              const percent = total > 0 ? (value / total * 100).toFixed(1) : 0;
              return `${label}: ${value.toFixed(2)}€ (${percent}%)`;
            }
          }
        },
        legend: { position: 'bottom' }
      }
    }
  });
}
}

function drawCharts() {
  const monthlyMap = {};

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
    if (impact === "negative") {
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

}

// Función para crear gráfico de tendencia
function setupTrendForecastChart() {
  // Modificar drawDashboard para añadir un nuevo gráfico de tendencia
  const originalDrawDashboard = drawDashboard;
  
  drawDashboard = function() {
    originalDrawDashboard.call(this);
    
    // Añadir el gráfico de tendencia
    createTrendForecastChart();
  };
}

// Crear y configurar el gráfico de tendencia estimada
function createTrendForecastChart() {
  const container = document.getElementById("dashboard-content");
  
  // Verificar si ya existe la sección del gráfico de tendencia
  if (!document.getElementById('trendForecastSection')) {
    // Crear elemento para contener el gráfico de tendencia
    const trendSection = document.createElement('div');
    trendSection.id = 'trendForecastSection';
    trendSection.className = 'card lg:col-span-3 mt-6';
    trendSection.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Tendencia y Pronóstico</h3>
        <div class="flex space-x-2">
          <select id="trend-type" class="text-xs px-2 py-1 rounded border dark:border-gray-600 bg-white dark:bg-gray-700">
            <option value="expenses">Gastos</option>
            <option value="income">Ingresos</option>
            <option value="balance">Balance</option>
          </select>
          <select id="trend-period" class="text-xs px-2 py-1 rounded border dark:border-gray-600 bg-white dark:bg-gray-700">
            <option value="3">Próximos 3 meses</option>
            <option value="6" selected>Próximos 6 meses</option>
            <option value="12">Próximo año</option>
          </select>
          <button id="trendReset" class="text-xs px-2 py-1 rounded border dark:border-gray-600 bg-white dark:bg-gray-700">
            <i class="fas fa-sync-alt"></i> Reset
          </button>
        </div>
      </div>
      <div class="chart-container h-80"><canvas id="trendForecastChart"></canvas></div>
    `;
    
    container.appendChild(trendSection);
    
    // Configurar eventos para los selectores
    setTimeout(() => {
      document.getElementById('trend-type').addEventListener('change', updateTrendForecast);
      document.getElementById('trend-period').addEventListener('change', updateTrendForecast);
      document.getElementById('trendReset').addEventListener('click', () => {
        if (dashboardCharts.trendForecast) {
          dashboardCharts.trendForecast.resetZoom();
        }
      });
      
      // Generar el gráfico inicial
      updateTrendForecast();
    }, 100);
  } else {
    // Si ya existe, solo actualizamos los datos
    updateTrendForecast();
  }
}

// Actualizar los datos del gráfico de tendencia
function updateTrendForecast() {
  const trendType = document.getElementById('trend-type')?.value || 'expenses';
  const forecastMonths = parseInt(document.getElementById('trend-period')?.value || 6);
  
  // Generar datos históricos mensuales
  const monthlyData = generateMonthlyFinancialData(trendType);
  
  // Solo continuar si tenemos suficientes datos
  if (monthlyData.values.length < 3) {
    showNoDataWarning();
    return;
  }
  
  // Generar datos para regresión lineal
  const regressionData = monthlyData.values.map((value, index) => [index, value]);
  
  // Calcular regresión lineal
  const result = regression.linear(regressionData);
  const gradient = result.equation[0];
  const yIntercept = result.equation[1];
  
  // Generar puntos de proyección
  const forecastData = [];
  const forecastLabels = [];
  const lastDataPointIndex = monthlyData.values.length - 1;
  
  for (let i = 0; i <= forecastMonths; i++) {
    const x = lastDataPointIndex + i;
    const predictedValue = gradient * x + yIntercept;
    // No permitimos valores negativos en gastos o ingresos
    const adjustedValue = trendType !== 'balance' && predictedValue < 0 ? 0 : predictedValue;
    
    forecastData.push(adjustedValue);
    
    const forecastDate = new Date();
    forecastDate.setMonth(forecastDate.getMonth() + i);
    forecastLabels.push(forecastDate.toLocaleString('default', { month: 'short', year: 'numeric' }));
  }
  
  // Preparar datos para el gráfico
  const datasets = [
    {
      label: getTrendTypeLabel(trendType) + ' histórico',
      data: monthlyData.values,
      borderColor: getTrendTypeColor(trendType, false),
      backgroundColor: getTrendTypeColor(trendType, true),
      pointBackgroundColor: getTrendTypeColor(trendType, false),
      fill: true
    },
    {
      label: getTrendTypeLabel(trendType) + ' proyectado',
      data: Array(monthlyData.values.length).fill(null).concat(forecastData),
      borderColor: 'rgba(156, 163, 175, 1)',
      backgroundColor: 'rgba(156, 163, 175, 0.2)',
      borderDash: [5, 5],
      fill: true,
      pointStyle: 'circle',
      pointRadius: 3,
      pointBackgroundColor: 'rgba(156, 163, 175, 1)'
    }
  ];
  
  // Destruir gráfico anterior si existe
  if (dashboardCharts.trendForecast) {
    dashboardCharts.trendForecast.destroy();
  }
  
  // Crear nuevo gráfico
  const ctx = document.getElementById('trendForecastChart').getContext('2d');
  dashboardCharts.trendForecast = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthlyData.labels.concat(forecastLabels.slice(1)), // Eliminar el primer mes para evitar duplicado
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'xy'
          },
          pan: {
            enabled: true,
            mode: 'xy'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)}`;
            },
            footer: function(tooltipItems) {
              const dataIndex = tooltipItems[0].dataIndex;
              // Solo mostrar información de confianza para los datos de pronóstico
              if (dataIndex >= monthlyData.values.length) {
                const confidenceScore = Math.max(0, 100 - ((dataIndex - monthlyData.values.length + 1) * 10));
                return `Confianza del pronóstico: ${confidenceScore.toFixed(0)}%`;
              }
              return '';
            }
          }
        },
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Tendencia histórica y proyección futura'
        },
        annotation: {
          annotations: {
            line1: {
              type: 'line',
              mode: 'vertical',
              scaleID: 'x',
              value: monthlyData.labels.length - 1,
              borderColor: 'rgba(166, 166, 166, 0.75)',
              borderWidth: 2,
              label: {
                content: 'Ahora',
                enabled: true,
                position: 'top'
              }
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: trendType !== 'balance',
          title: {
            display: true,
            text: 'Importe (€)'
          },
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
            }
          }
        }
      }
    }
  });
  
  // Añadir anotación que señale el punto actual
  const verticalLinePlugin = {
    id: 'verticalLine',
    afterDraw: (chart) => {
      if (chart.tooltip._active && chart.tooltip._active.length) {
        const activePoint = chart.tooltip._active[0];
        const ctx = chart.ctx;
        const x = activePoint.element.x;
        const topY = chart.scales.y.top;
        const bottomY = chart.scales.y.bottom;
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.stroke();
        ctx.restore();
      }
    }
  };
  
  Chart.register(verticalLinePlugin);
}

// Generar datos mensuales basados en las transacciones
function generateMonthlyFinancialData(type) {
  const monthlyMap = {};
  
  // Filtrar las transacciones por impacto según el tipo seleccionado
  transactions.forEach(t => {
    const date = new Date(t.date);
    if (isNaN(date)) return;
    
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const typeObj = types.find(tp => tp.name === t.type);
    const impact = typeObj?.impact || 'neutral';
    
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { positive: 0, negative: 0, neutral: 0 };
    }
    
    monthlyMap[monthKey][impact] += t.amount;
  });
  
  // Ordenar meses cronológicamente
  const sortedMonths = Object.keys(monthlyMap).sort();
  
  // Generar arrays de labels y valores
  const labels = sortedMonths.map(month => {
    const [year, monthNum] = month.split('-');
    return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
  });
  
  let values;
  switch (type) {
    case 'income':
      values = sortedMonths.map(month => monthlyMap[month].positive || 0);
      break;
    case 'expenses':
      values = sortedMonths.map(month => monthlyMap[month].negative || 0);
      break;
    case 'balance':
      values = sortedMonths.map(month => 
        (monthlyMap[month].positive || 0) - 
        (monthlyMap[month].negative || 0) + 
        (monthlyMap[month].neutral || 0)
      );
      break;
    default:
      values = sortedMonths.map(month => monthlyMap[month].negative || 0);
  }
  
  return { labels, values };
}

// Mostrar advertencia si no hay suficientes datos
function showNoDataWarning() {
  const ctx = document.getElementById('trendForecastChart');
  if (!ctx) return;
  
  if (dashboardCharts.trendForecast) {
    dashboardCharts.trendForecast.destroy();
  }
  
  // Crear una visualización de advertencia
  const container = ctx.parentElement;
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full">
      <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-3"></i>
      <p class="text-center text-gray-600 dark:text-gray-300">
        No hay suficientes datos para generar una tendencia.<br>
        Añade al menos 3 meses de transacciones.
      </p>
    </div>
  `;
}

// Obtener colores según el tipo de tendencia
function getTrendTypeColor(type, isBackground) {
  const alpha = isBackground ? '0.2' : '1';
  switch (type) {
    case 'income':
      return `rgba(34, 197, 94, ${alpha})`;
    case 'expenses':
      return `rgba(239, 68, 68, ${alpha})`;
    case 'balance':
      return `rgba(59, 130, 246, ${alpha})`;
    default:
      return `rgba(156, 163, 175, ${alpha})`;
  }
}

// Obtener etiqueta según tipo de tendencia
function getTrendTypeLabel(type) {
  switch (type) {
    case 'income':
      return 'Ingresos';
    case 'expenses':
      return 'Gastos';
    case 'balance':
      return 'Balance';
    default:
      return 'Datos';
  }
}


// ---------------------- EXPENSES -----------------------

function drawExpenses() {
  const container = document.getElementById("expenses-content");
  container.innerHTML = `
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
    <h3 class="text-xl font-semibold">Your Transactions</h3>
    <div class="flex flex-col md:flex-row gap-2">
      <div class="flex items-center">
        <button id="show-filters-btn" class="border rounded px-3 py-1 text-sm flex items-center">
          <i class="fas fa-filter mr-2"></i> Filtros
          <i class="fas fa-chevron-down ml-2"></i>
        </button>
      </div>
      <select id="filter-range" class="border rounded px-2 py-1 text-sm">
        <option value="month">Este mes</option>
        <option value="30">Últimos 30 días</option>
        <option value="90">Últimos 3 meses</option>
        <option value="year">Este año</option>
        <option value="all">Todo</option>
      </select>
    </div>
  </div>
  
  <!-- Panel de filtros avanzados (oculto por defecto) -->
  <div id="advanced-filters" class="hidden mb-4 card">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div>
        <label class="block text-sm font-medium mb-1">Categoría</label>
        <select id="filter-category" class="w-full border rounded px-2 py-1">
          <option value="">Todas</option>
          ${categories.map(c => `<option value="${c.name || c}">${c.name || c}</option>`).join("")}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Tipo</label>
        <select id="filter-type" class="w-full border rounded px-2 py-1">
          <option value="">Todos</option>
          ${types.map(t => `<option value="${t.name || t}">${t.name || t}</option>`).join("")}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Importe mínimo</label>
        <input type="number" id="filter-min-amount" placeholder="Mínimo" class="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Importe máximo</label>
        <input type="number" id="filter-max-amount" placeholder="Máximo" class="w-full border rounded px-2 py-1" />
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
      <div>
        <label class="block text-sm font-medium mb-1">Descripción</label>
        <input type="text" id="filter-description" placeholder="Buscar..." class="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Desde</label>
        <input type="date" id="filter-date-from" class="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Hasta</label>
        <input type="date" id="filter-date-to" class="w-full border rounded px-2 py-1" />
      </div>
    </div>
    <div class="flex justify-end mt-3">
      <button id="reset-filters-btn" class="border rounded px-3 py-1 text-sm mr-2">Resetear</button>
      <button id="apply-filters-btn" class="bg-purple-600 text-white rounded px-3 py-1 text-sm">Aplicar</button>
    </div>
  </div>
  
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div>
      <div class="card">
        <h3 class="text-lg font-medium mb-4">Add Transaction</h3>
        <form id="transaction-form" class="space-y-4">
          <input type="hidden" id="trans-id" />
          <select id="trans-type" class="w-full border p-2 rounded">
            ${types.map(t => `<option value="${t.name || t}">${t.name || t}</option>`).join("")}
          </select>
          <input type="number" id="trans-amount" placeholder="Amount" class="w-full border p-2 rounded" />
          <input type="text" id="trans-desc" placeholder="Description" class="w-full border p-2 rounded" />
          <select id="trans-cat" class="w-full border p-2 rounded">
            ${categories.map(c => `<option value="${c.name || c}">${c.name || c}</option>`).join("")}
          </select>
          <input type="date" id="trans-date" class="w-full border p-2 rounded" />
          <button class="bg-purple-600 text-white px-4 py-2 rounded w-full">Save</button>
        </form>
      </div>
    </div>
    <div class="lg:col-span-2">
      <div class="card h-[calc(100vh-280px)] overflow-y-auto p-6 pt-0">
        <div class="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 p-4 dark:bg-card">
          <h3 class="text-lg font-medium">Transactions</h3>
          <div class="text-sm text-gray-500" id="transaction-count"></div>
        </div>
        <ul id="transaction-list" class="divide-y divide-gray-200"></ul>
      </div>
    </div>
  </div>
`;

  // Establecer fecha actual en el formulario
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("trans-date").value = today;

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

    // Mantener filtros actuales
    const filters = getActiveFilters();

    saveTransactions();
    drawExpenses();
    
    // Restaurar filtros
    applyFiltersFromState(filters);
    
    drawCharts();
    renderTransactionList();
  };
   // Toggle de filtros avanzados
   const showFiltersBtn = document.getElementById("show-filters-btn");
   const advancedFilters = document.getElementById("advanced-filters");
   
   showFiltersBtn.addEventListener("click", () => {
     advancedFilters.classList.toggle("hidden");
     // Cambiar icono
     const icon = showFiltersBtn.querySelector(".fa-chevron-down, .fa-chevron-up");
     if (icon) {
       icon.classList.toggle("fa-chevron-down");
       icon.classList.toggle("fa-chevron-up");
     }
   });

   // Eventos de botones de filtro
  document.getElementById("reset-filters-btn").addEventListener("click", () => {
    // Resetear todos los campos de filtro
    document.getElementById("filter-category").value = "";
    document.getElementById("filter-type").value = "";
    document.getElementById("filter-min-amount").value = "";
    document.getElementById("filter-max-amount").value = "";
    document.getElementById("filter-description").value = "";
    document.getElementById("filter-date-from").value = "";
    document.getElementById("filter-date-to").value = "";
    
    renderTransactionList();
  });

  
  document.getElementById("apply-filters-btn").addEventListener("click", () => {
    renderTransactionList();
  });

  // Filtro activo
  const filterDropdown = document.getElementById("filter-range");
  if (filterDropdown) {
    filterDropdown.onchange = () => renderTransactionList();
  }

  // Configurar eventos input para actualizar en tiempo real
  document.getElementById("filter-category").addEventListener("change", () => renderTransactionList());
  document.getElementById("filter-type").addEventListener("change", () => renderTransactionList());
  document.getElementById("filter-description").addEventListener("input", debounce(() => renderTransactionList(), 300));
  document.getElementById("filter-min-amount").addEventListener("input", debounce(() => renderTransactionList(), 300));
  document.getElementById("filter-max-amount").addEventListener("input", debounce(() => renderTransactionList(), 300));
  document.getElementById("filter-date-from").addEventListener("change", () => renderTransactionList());
  document.getElementById("filter-date-to").addEventListener("change", () => renderTransactionList());

  renderTransactionList(); // mostrar lista inicial
}

// Función helper para limitar eventos de input
function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}


// Obtener estado actual de los filtros
function getActiveFilters() {
  return {
    range: document.getElementById("filter-range")?.value || "month",
    category: document.getElementById("filter-category")?.value || "",
    type: document.getElementById("filter-type")?.value || "",
    minAmount: document.getElementById("filter-min-amount")?.value || "",
    maxAmount: document.getElementById("filter-max-amount")?.value || "",
    description: document.getElementById("filter-description")?.value || "",
    dateFrom: document.getElementById("filter-date-from")?.value || "",
    dateTo: document.getElementById("filter-date-to")?.value || ""
  };
}

// Aplicar filtros desde un estado guardado
function applyFiltersFromState(filters) {
  if (!filters) return;
  
  if (document.getElementById("filter-range")) 
    document.getElementById("filter-range").value = filters.range;
  if (document.getElementById("filter-category")) 
    document.getElementById("filter-category").value = filters.category;
  if (document.getElementById("filter-type")) 
    document.getElementById("filter-type").value = filters.type;
  if (document.getElementById("filter-min-amount")) 
    document.getElementById("filter-min-amount").value = filters.minAmount;
  if (document.getElementById("filter-max-amount")) 
    document.getElementById("filter-max-amount").value = filters.maxAmount;
  if (document.getElementById("filter-description")) 
    document.getElementById("filter-description").value = filters.description;
  if (document.getElementById("filter-date-from")) 
    document.getElementById("filter-date-from").value = filters.dateFrom;
  if (document.getElementById("filter-date-to")) 
    document.getElementById("filter-date-to").value = filters.dateTo;
}

function renderTransactionList() {
  const ul = document.getElementById("transaction-list");
  const countElement = document.getElementById("transaction-count");
  if (!ul) return;

  ul.innerHTML = "";

  // Obtener todos los filtros
  const filters = getActiveFilters();
  
  // Filtro de tiempo predefinido
  const now = new Date();
  let filtered = [...transactions];
  
  filtered = filtered.filter(t => {
    const d = new Date(t.date);
    if (isNaN(d)) return false;

    // 1. Aplicar filtro de rango de tiempo predefinido
    if (filters.range === "month" && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) {
      return false;
    }
    else if (filters.range === "year" && d.getFullYear() !== now.getFullYear()) {
      return false;
    }
    else if (!isNaN(parseInt(filters.range))) {
      const pastDate = new Date(now);
      pastDate.setDate(now.getDate() - parseInt(filters.range));
      if (d < pastDate || d > now) return false;
    }
    
    // 2. Filtro por categoría
    if (filters.category && t.category !== filters.category) {
      return false;
    }
    
    // 3. Filtro por tipo
    if (filters.type && t.type !== filters.type) {
      return false;
    }
    
    // 4. Filtro por monto mínimo
    if (filters.minAmount && t.amount < parseFloat(filters.minAmount)) {
      return false;
    }
    
    // 5. Filtro por monto máximo
    if (filters.maxAmount && t.amount > parseFloat(filters.maxAmount)) {
      return false;
    }
    
    // 6. Filtro por descripción (buscar texto)
    if (filters.description && !t.description.toLowerCase().includes(filters.description.toLowerCase())) {
      return false;
    }
    
    // 7. Filtro por fecha de inicio
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      if (d < fromDate) return false;
    }
    
    // 8. Filtro por fecha final
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Final del día
      if (d > toDate) return false;
    }
    
    return true;
  });

  // Ordenar por fecha reciente primero
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Actualizar contador
  if (countElement) {
    countElement.textContent = `${filtered.length} transacción${filtered.length !== 1 ? 'es' : ''}`;
  }
  
  // Si no hay resultados, mostrar mensaje
  if (filtered.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'text-center py-6 text-gray-500';
    emptyMessage.innerHTML = `
      <i class="fas fa-search text-2xl mb-2"></i>
      <p>No se encontraron transacciones con los filtros actuales.</p>
    `;
    ul.appendChild(emptyMessage);
    return;
  }

  filtered.forEach(t => {
    const li = document.createElement("li");
    li.className = "py-4 px-2 flex justify-between items-center hover:bg-gray-50 rounded";

    const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const iconSVG = icons[normalize(t.category)] || null;


    const cat = categories.find(c => {
      if (typeof c === 'string') return c === t.category;
      return c.name === t.category;
    });
    
    const typeDef = types.find(tp => {
      if (typeof tp === 'string') return tp === t.type;
      return tp.name === t.type;
    });

    const catBg = cat?.bg || "#f3f4f6";
    const catText = cat?.text || "#374151";
    const impact = typeDef?.impact || "neutral";

    const amountColor = impact === "positive"
      ? "text-green-600"
      : impact === "negative"
      ? "text-red-600"
      : impact === "neutral"
      ? "text-gray-700"
      : "text-gray-400";

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

function deleteTransaction(id) {
  const t = transactions.find(t => t.id === id);
  if (!t) return;

  pendingDeleteId = id;

  const msg = `"${t.description}" por ${t.amount}€ (${t.category || "Sin categoría"})`;
  document.getElementById("delete-confirm-msg").innerText = msg;
  document.getElementById("delete-confirm-modal").classList.remove("hidden");
}

function closeDeleteConfirmModal() {
  pendingDeleteId = null;
  document.getElementById("delete-confirm-modal").classList.add("hidden");
}

document.getElementById("delete-confirm-btn").onclick = () => {
  if (!pendingDeleteId) return;

  transactions = transactions.filter(t => t.id !== pendingDeleteId);
  saveTransactions();
  drawExpenses();
  drawDashboard();
  closeDeleteConfirmModal();
};



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

  if (kind === "type") {
    types.push({
      name: value,
      bg: "#e0f2fe",     // color por defecto
      text: "#0369a1",   // color por defecto
      impact: "neutral"  // valor por defecto
    });
  }
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
  // if (kind === "type") {
  //   types = types.filter(t => (typeof t === "string" ? t !== value : t.name !== value));
  //   transactions.forEach(t => {
  //     if (t.type === value) t.type = "Indefinido"; // opcional: poner "" o "undefined"
  //   });

  if (kind === "type") {
    types = types.filter(t => {
      if (typeof t === "string") return t !== value;
      return t.name !== value;
    });
  
    transactions.forEach(t => {
      if (t.type === value) t.type = "Indefinido";
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
  initializeDarkMode();
  setupTrendForecastChart();
  switchTab("dashboard");
  
  // Agregar con un pequeño retraso para asegurar que el header esté cargado
  setTimeout(addDarkModeToggle, 100);
});
