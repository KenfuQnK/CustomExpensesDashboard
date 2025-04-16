/**
 * Personalización de gráficos para dashboard financiero
 * Este script modifica los gráficos para darles un aspecto futurista con efecto neón
 */

// Función principal que se ejecutará después de que se carguen los gráficos
function customizeCharts() {
    // Personalizar el gráfico de Income Trends
    function enhanceIncomeChart() {
      if (!window.dashboardCharts || !window.dashboardCharts.income) return;
      
      const chart = window.dashboardCharts.income;
      
      // Definir colores neón
      const redNeon = {
        line: 'rgb(255, 71, 87)',
        fill: 'rgba(255, 71, 87, 0.1)',
        hover: 'rgb(255, 99, 132)'
      };
      
      const orangeNeon = {
        line: 'rgb(252, 163, 17)',
        fill: 'rgba(252, 163, 17, 0.1)',
        hover: 'rgb(255, 177, 69)'
      };
      
      const purpleNeon = {
        line: 'rgb(147, 51, 234)',
        fill: 'rgba(147, 51, 234, 0.1)',
        hover: 'rgb(168, 85, 247)'
      };
      
      // Actualizar dataset "Positive" (primer dataset)
      if (chart.data.datasets[0]) {
        chart.data.datasets[0].label = 'Income';
        chart.data.datasets[0].borderColor = redNeon.line;
        chart.data.datasets[0].backgroundColor = redNeon.fill;
        chart.data.datasets[0].pointBackgroundColor = redNeon.line;
        chart.data.datasets[0].pointHoverBackgroundColor = redNeon.hover;
        chart.data.datasets[0].pointBorderColor = 'rgba(255, 255, 255, 0.8)';
        chart.data.datasets[0].pointHoverBorderColor = 'white';
        chart.data.datasets[0].pointBorderWidth = 2;
        chart.data.datasets[0].pointHoverBorderWidth = 2;
        chart.data.datasets[0].pointRadius = 0; // Ocultos por defecto
        chart.data.datasets[0].pointHoverRadius = 6;
        chart.data.datasets[0].tension = 0.4; // Líneas más curvas
        chart.data.datasets[0].borderWidth = 3;
        chart.data.datasets[0].fill = true;
        chart.data.datasets[0].order = 1; // Asegurar que esté encima
      }
      
      // Actualizar dataset "Neutral" (segundo dataset)
      if (chart.data.datasets[1]) {
        chart.data.datasets[1].label = 'Expenses';
        chart.data.datasets[1].borderColor = orangeNeon.line;
        chart.data.datasets[1].backgroundColor = orangeNeon.fill;
        chart.data.datasets[1].pointBackgroundColor = orangeNeon.line;
        chart.data.datasets[1].pointHoverBackgroundColor = orangeNeon.hover;
        chart.data.datasets[1].pointBorderColor = 'rgba(255, 255, 255, 0.8)';
        chart.data.datasets[1].pointHoverBorderColor = 'white';
        chart.data.datasets[1].pointBorderWidth = 2;
        chart.data.datasets[1].pointHoverBorderWidth = 2;
        chart.data.datasets[1].pointRadius = 0;
        chart.data.datasets[1].pointHoverRadius = 6;
        chart.data.datasets[1].tension = 0.4;
        chart.data.datasets[1].borderWidth = 3;
        chart.data.datasets[1].fill = true;
        chart.data.datasets[1].order = 2;
      }
      
      // Configurar opciones para el gráfico - CORREGIDO
      if (!chart.options) chart.options = {};
      chart.options.responsive = true;
      chart.options.maintainAspectRatio = false;
      
      // Personalizar escalas - CORREGIDO
      if (!chart.options.scales) chart.options.scales = {};
      if (!chart.options.scales.x) chart.options.scales.x = {};
      if (!chart.options.scales.y) chart.options.scales.y = {};
      
      // Personalizar grid y ticks del eje X - CORREGIDO
      chart.options.scales.x.grid = {
        color: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'transparent',
        tickColor: 'transparent',
        drawBorder: false
      };
      
      // Personalizar grid y ticks del eje Y - CORREGIDO
      chart.options.scales.y.grid = {
        color: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'transparent',
        tickColor: 'transparent',
        drawBorder: false
      };
      
      // Estilo de texto para las etiquetas X - CORREGIDO
      chart.options.scales.x.ticks = {
        color: 'rgba(255, 255, 255, 0.7)',
        font: {
          size: 10,
          family: 'system-ui, sans-serif'
        },
        padding: 10
      };
      
      // Estilo de texto para las etiquetas Y - CORREGIDO
      chart.options.scales.y.ticks = {
        color: 'rgba(255, 255, 255, 0.7)',
        font: {
          size: 10,
          family: 'system-ui, sans-serif'
        },
        padding: 10,
        callback: function(value) {
          return value + '€';
        }
      };
      
      // Mejorar tooltips - CORREGIDO
      if (!chart.options.plugins) chart.options.plugins = {};
      
      chart.options.plugins.tooltip = {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        footerColor: 'rgba(255, 255, 255, 0.7)',
        displayColors: true,
        boxPadding: 6,
        cornerRadius: 8,
        usePointStyle: true,
        bodyFont: {
          family: 'system-ui, sans-serif'
        },
        titleFont: {
          family: 'system-ui, sans-serif',
          weight: 'bold'
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
            }
            return label;
          }
        }
      };
      
      // Personalizar leyenda - CORREGIDO
      chart.options.plugins.legend = {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            family: 'system-ui, sans-serif',
            size: 11
          }
        }
      };
      
      // Agregar línea vertical - CORREGIDO
      chart.options.plugins.annotation = {
        annotations: {
          line1: {
            type: 'line',
            xMin: 6,
            xMax: 6,
            borderColor: 'rgba(255, 255, 255, 0.3)',
            borderWidth: 1,
            borderDash: [4, 4]
          }
        }
      };
      
      // Interacción - CORREGIDO
      chart.options.hover = {
        mode: 'nearest',
        intersect: false
      };
      
      chart.options.interaction = {
        mode: 'nearest',
        intersect: false
      };
      
      // Aplicar los cambios
      chart.update();
    }
    
    // Mejorar otros gráficos para mantener un estilo coherente
    function enhanceAllCharts() {
      // Definir colores para todos los gráficos
      const chartColors = {
        positive: 'rgb(255, 71, 87)',     // Rojo neón
        negative: 'rgb(252, 163, 17)',    // Naranja neón
        neutral: 'rgb(109, 93, 252)',     // Púrpura neón
        categories: [
          'rgba(255, 71, 87, 0.8)',       // Rojo neón
          'rgba(252, 163, 17, 0.8)',      // Naranja neón
          'rgba(20, 223, 166, 0.8)',      // Verde neón
          'rgba(109, 93, 252, 0.8)',      // Púrpura neón
          'rgba(0, 210, 255, 0.8)',       // Azul neón
          'rgba(241, 91, 181, 0.8)',      // Rosa neón
          'rgba(254, 228, 64, 0.8)'       // Amarillo neón
        ]
      };
      
      // Configuración global para fondos oscuros - CORREGIDO
      const darkModeConfig = {
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'transparent',
              tickColor: 'transparent',
              drawBorder: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                size: 10,
                family: 'system-ui, sans-serif'
              },
              padding: 10
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'transparent',
              tickColor: 'transparent',
              drawBorder: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                size: 10,
                family: 'system-ui, sans-serif'
              },
              padding: 10,
              callback: function(value) {
                return value + '€';
              }
            }
          }
        },
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleColor: 'rgba(255, 255, 255, 0.9)',
            bodyColor: 'rgba(255, 255, 255, 0.8)',
            cornerRadius: 8,
            boxPadding: 6,
            usePointStyle: true,
            bodyFont: {
              family: 'system-ui, sans-serif'
            },
            titleFont: {
              family: 'system-ui, sans-serif',
              weight: 'bold'
            },
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                }
                return label;
              }
            }
          },
          legend: {
            labels: {
              color: 'rgba(255, 255, 255, 0.8)',
              font: {
                family: 'system-ui, sans-serif',
                size: 11
              },
              usePointStyle: true,
              boxWidth: 8,
              boxHeight: 8,
              padding: 15
            }
          }
        },
        hover: {
          mode: 'nearest',
          intersect: false
        },
        interaction: {
          mode: 'nearest',
          intersect: false
        }
      };
      
      // Actualizar gráfico Monthly Cash Flow - CORREGIDO
      if (window.dashboardCharts.monthly) {
        const chart = window.dashboardCharts.monthly;
        
        // Colores para barras
        if (chart.data.datasets[0]) chart.data.datasets[0].backgroundColor = 'rgba(20, 223, 166, 0.7)';  // Verde neón
        if (chart.data.datasets[1]) chart.data.datasets[1].backgroundColor = 'rgba(255, 71, 87, 0.7)';   // Rojo neón
        if (chart.data.datasets[2]) chart.data.datasets[2].backgroundColor = 'rgba(109, 93, 252, 0.7)';  // Púrpura neón
        
        // Aplicar config de modo oscuro - CORREGIDO
        if (!chart.options) chart.options = {};
        if (!chart.options.scales) chart.options.scales = {};
        if (!chart.options.plugins) chart.options.plugins = {};

        // Usar un método seguro para aplicar configuraciones
        applyConfiguration(chart.options.scales, darkModeConfig.scales);
        applyConfiguration(chart.options.plugins, darkModeConfig.plugins);
        
        chart.update();
      }
      
      // Actualizar gráfico Expense Categories - CORREGIDO
      if (window.dashboardCharts.categories) {
        const chart = window.dashboardCharts.categories;
        
        // Color para barras
        if (chart.data.datasets[0]) {
          chart.data.datasets[0].backgroundColor = 'rgba(252, 163, 17, 0.8)';
        }
        
        // Aplicar config de modo oscuro - CORREGIDO
        if (!chart.options) chart.options = {};
        if (!chart.options.scales) chart.options.scales = {};
        if (!chart.options.plugins) chart.options.plugins = {};

        // Usar un método seguro para aplicar configuraciones
        applyConfiguration(chart.options.scales, darkModeConfig.scales);
        applyConfiguration(chart.options.plugins, darkModeConfig.plugins);
        
        chart.update();
      }
      
      // Actualizar gráfico Expenses Overview - CORREGIDO
      if (window.dashboardCharts.expenseLine) {
        const chart = window.dashboardCharts.expenseLine;
        
        // Aplicar colores neón a todos los datasets
        if (chart.data.datasets && chart.data.datasets.length > 0) {
          chart.data.datasets.forEach((dataset, index) => {
            dataset.backgroundColor = chartColors.categories[index % chartColors.categories.length];
          });
        }
        
        // Aplicar config de modo oscuro - CORREGIDO
        if (!chart.options) chart.options = {};
        if (!chart.options.scales) chart.options.scales = {};
        if (!chart.options.plugins) chart.options.plugins = {};

        // Usar un método seguro para aplicar configuraciones
        applyConfiguration(chart.options.scales, darkModeConfig.scales);
        applyConfiguration(chart.options.plugins, darkModeConfig.plugins);
        
        chart.update();
      }
      
      // Actualizar gráfico Donut - CORREGIDO
      if (window.dashboardCharts.expenseDonut) {
        const chart = window.dashboardCharts.expenseDonut;
        
        // Aplicar colores neón
        if (chart.data.datasets && chart.data.datasets[0]) {
          chart.data.datasets[0].backgroundColor = chartColors.categories;
        }
        
        // Configuración específica para el donut - CORREGIDO
        if (!chart.options) chart.options = {};
        if (!chart.options.plugins) chart.options.plugins = {};
        if (!chart.options.plugins.tooltip) chart.options.plugins.tooltip = {};
        if (!chart.options.plugins.legend) chart.options.plugins.legend = {};
        if (!chart.options.plugins.legend.labels) chart.options.plugins.legend.labels = {};

        // Usar un método seguro para aplicar configuraciones
        applyConfiguration(chart.options.plugins.tooltip, darkModeConfig.plugins.tooltip);
        
        chart.options.plugins.legend.position = 'right';
        applyConfiguration(chart.options.plugins.legend.labels, darkModeConfig.plugins.legend.labels);
        
        chart.update();
      }
      
      // Actualizar gráfico de tendencia/pronóstico - CORREGIDO
      if (window.dashboardCharts.trendForecast) {
        const chart = window.dashboardCharts.trendForecast;
        
        // Colores y estilos para datasets
        if (chart.data.datasets && chart.data.datasets.length >= 2) {
          // Dataset histórico
          if (chart.data.datasets[0]) {
            chart.data.datasets[0].borderColor = chartColors.positive;
            chart.data.datasets[0].backgroundColor = 'rgba(255, 71, 87, 0.1)';
            chart.data.datasets[0].pointBackgroundColor = chartColors.positive;
            chart.data.datasets[0].pointBorderColor = 'white';
            chart.data.datasets[0].pointRadius = 0;
            chart.data.datasets[0].pointHoverRadius = 6;
            chart.data.datasets[0].tension = 0.4;
            chart.data.datasets[0].borderWidth = 3;
          }
          
          // Dataset proyectado
          if (chart.data.datasets[1]) {
            chart.data.datasets[1].borderColor = chartColors.neutral;
            chart.data.datasets[1].backgroundColor = 'rgba(109, 93, 252, 0.05)';
            chart.data.datasets[1].borderDash = [5, 5];
            chart.data.datasets[1].pointBackgroundColor = chartColors.neutral;
            chart.data.datasets[1].pointBorderColor = 'white';
            chart.data.datasets[1].pointRadius = 0;
            chart.data.datasets[1].pointHoverRadius = 6;
            chart.data.datasets[1].tension = 0.4;
            chart.data.datasets[1].borderWidth = 2;
          }
        }
        
        // Aplicar config de modo oscuro - CORREGIDO
        if (!chart.options) chart.options = {};
        if (!chart.options.scales) chart.options.scales = {};
        if (!chart.options.plugins) chart.options.plugins = {};

        // Usar un método seguro para aplicar configuraciones
        applyConfiguration(chart.options.scales, darkModeConfig.scales);
        applyConfiguration(chart.options.plugins, darkModeConfig.plugins);
        
        // Añadir línea vertical para el punto actual - CORREGIDO
        if (!chart.options.plugins.annotation) chart.options.plugins.annotation = {};
        if (!chart.options.plugins.annotation.annotations) chart.options.plugins.annotation.annotations = {};
        
        chart.options.plugins.annotation.annotations.line1 = {
          type: 'line',
          xMin: chart.data.labels.length - 2 - (chart.data.datasets[1] ? chart.data.datasets[1].data.filter(x => x !== null).length : 0),
          xMax: chart.data.labels.length - 2 - (chart.data.datasets[1] ? chart.data.datasets[1].data.filter(x => x !== null).length : 0),
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderWidth: 1,
          borderDash: [4, 4],
          label: {
            content: 'Ahora',
            display: true,
            position: 'top',
            backgroundColor: 'rgba(17, 24, 39, 0.7)',
            color: 'white',
            font: {
              size: 10,
              family: 'system-ui, sans-serif'
            }
          }
        };
        
        chart.update();
      }
    }
    
    // NUEVA FUNCIÓN: Método seguro para aplicar configuraciones sin usar Object.assign
    // Esta función evita el problema de t.startsWith al asegurarse de que las propiedades
    // correctas se asignan a los objetos correctos
    function applyConfiguration(target, source) {
      if (!target || !source || typeof target !== 'object' || typeof source !== 'object') {
        return;
      }
      
      // Recorrer propiedades del objeto fuente
      Object.keys(source).forEach(key => {
        // Si la propiedad es un objeto y existe en el target, aplicar recursivamente
        if (typeof source[key] === 'object' && source[key] !== null && 
            typeof target[key] === 'object' && target[key] !== null) {
          applyConfiguration(target[key], source[key]);
        } else {
          // Si no es un objeto o no existe en el target, asignar directamente
          target[key] = source[key];
        }
      });
    }
};