const API_URL = 'https://coffeuia-16727117187.northamerica-south1.run.app/api/prediccion-ventas/';
const PROXY_URL = 'https://corsproxy.io/?' + encodeURIComponent(API_URL);

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Setear fecha actual por defecto
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.valueAsDate = new Date();
    }
    // Cargar datos al abrir la página
    obtenerAnalisis();
});

/**
 * Envía un nuevo producto a la API
 */
async function enviarProducto() {
    const producto = document.getElementById('producto').value.trim();
    const stock_actual = document.getElementById('stock').value.trim();
    const fecha = document.getElementById('fecha').value.trim();

    if (!producto || !stock_actual || !fecha) {
        mostrarEstado('Por favor completa todos los campos', 'error');
        return;
    }

    const statusDiv = document.getElementById('status-message');
    statusDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Enviando...</div>';
    statusDiv.classList.remove('error');
    statusDiv.classList.add('success');
    statusDiv.style.display = 'block';

    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                producto: producto,
                stock_actual: parseInt(stock_actual),
                fecha: fecha
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const data = await response.json();
        mostrarEstado(`✅ Producto "${producto}" enviado exitosamente`, 'success');
        
        // Limpiar formulario
        document.getElementById('producto').value = '';
        document.getElementById('stock').value = '';
        document.getElementById('fecha').valueAsDate = new Date();

        // Cargar datos automáticamente
        setTimeout(() => obtenerAnalisis(), 500);
    } catch (error) {
        console.error('Error en POST:', error);
        if (error.message.includes('Failed to fetch')) {
            mostrarEstado(`❌ Error de conexión: Verifica que la API esté disponible en ${API_URL}`, 'error');
        } else {
            mostrarEstado(`❌ Error al enviar: ${error.message}`, 'error');
        }
    }
}

/**
 * Obtiene el análisis desde la API
 */
async function obtenerAnalisis() {
    const dashboardDiv = document.getElementById('dashboard-container');
    dashboardDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando análisis...</div>';

    try {
        const response = await fetch(PROXY_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.status === 405) {
            console.warn('GET no permitido (405), mostrando datos demo');
            renderizarDashboard(obtenerDatosDemo());
            return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const data = await response.json();
        renderizarDashboard(data);
    } catch (error) {
        console.error('Error en GET:', error);
        if (error.message.includes('405')) {
            console.log('Mostrando datos demo por limitación de API');
            renderizarDashboard(obtenerDatosDemo());
        } else if (error.message.includes('Failed to fetch')) {
            dashboardDiv.innerHTML = `<div class="card"><div class="no-data">❌ Error de conexión: No se pudo conectar a la API<br><small>Mostrando datos de demostración</small></div></div>`;
            renderizarDashboard(obtenerDatosDemo());
        } else {
            dashboardDiv.innerHTML = `<div class="card"><div class="no-data">⚠️ La API no soporta consultas GET. Mostrando datos de demostración.</div></div>`;
            renderizarDashboard(obtenerDatosDemo());
        }
    }
}

/**
 * Datos demo cuando la API no disponible
 */
function obtenerDatosDemo() {
    return {
        "resumen_semanal": {
            "productos_estrella_ascenso": [
                "Sugarcane juice",
                "Frankie",
                "Cold coffee"
            ],
            "productos_en_riesgo": [
                "Aalopuri",
                "Panipuri",
                "Vadapav",
                "Sandwich"
            ],
            "hora_pico_absoluta": "Night"
        },
        "recomendaciones_operativas": {
            "mensaje_staff": "Refuerza personal durante: Night.",
            "detalle_horas": {
                "Night": 725,
                "Evening": 708,
                "Midnight": 654,
                "Morning": 626,
                "Afternoon": 558
            }
        },
        "analisis_completo_tendencias": {
            "Aalopuri": {
                "slope": -5.6,
                "status": "Bajando 📉"
            },
            "Sugarcane juice": {
                "slope": 1.0,
                "status": "Subiendo 🔥"
            },
            "Panipuri": {
                "slope": -1.0,
                "status": "Bajando 📉"
            },
            "Frankie": {
                "slope": 3.1,
                "status": "Subiendo 🔥"
            },
            "Vadapav": {
                "slope": -0.4,
                "status": "Bajando 📉"
            },
            "Cold coffee": {
                "slope": 1.2,
                "status": "Subiendo 🔥"
            },
            "Sandwich": {
                "slope": -3.3,
                "status": "Bajando 📉"
            }
        }
    };
}

/**
 * Renderiza el dashboard con los datos obtenidos
 */
function renderizarDashboard(data) {
    const dashboardDiv = document.getElementById('dashboard-container');
    dashboardDiv.innerHTML = '';

    const { resumen_semanal, recomendaciones_operativas, analisis_completo_tendencias } = data;

    // 1. RESUMEN SEMANAL
    const resumenCard = document.createElement('div');
    resumenCard.className = 'card';
    resumenCard.innerHTML = `
        <h3>📈 Resumen Semanal</h3>
        
        <strong>⭐ Productos Estrella (Ascenso)</strong>
        ${resumen_semanal.productos_estrella_ascenso.map(p => `<div class="star-product">🔥 ${p}</div>`).join('')}
        
        <strong style="display: block; margin-top: 15px;">⚠️ Productos en Riesgo</strong>
        ${resumen_semanal.productos_en_riesgo.map(p => `<div class="risk-product">📉 ${p}</div>`).join('')}
        
        <div class="hour-peak" style="margin-top: 20px;">
            ⏰ Hora Pico Absoluta<br>
            ${resumen_semanal.hora_pico_absoluta}
        </div>
    `;
    dashboardDiv.appendChild(resumenCard);

    // 2. RECOMENDACIONES OPERATIVAS
    const recCard = document.createElement('div');
    recCard.className = 'card';
    recCard.innerHTML = `
        <h3>👥 Recomendaciones Operativas</h3>
        <div class="staff-message">
            ${recomendaciones_operativas.mensaje_staff}
        </div>
        <strong>📊 Detalle por Hora</strong>
        <div class="detail-hours">
            ${Object.entries(recomendaciones_operativas.detalle_horas).map(([hora, valor]) => 
                `<div class="hour-item">
                    <div class="hour-label">${hora}</div>
                    <div class="hour-value">${valor}</div>
                </div>`
            ).join('')}
        </div>
    `;
    dashboardDiv.appendChild(recCard);

    // 3. ANÁLISIS COMPLETO DE TENDENCIAS
    const trendsCard = document.createElement('div');
    trendsCard.className = 'card';
    trendsCard.style.gridColumn = 'auto / span 2';
    
    const trendsHTML = `
        <h3>📊 Análisis Completo de Tendencias</h3>
        <div class="trends-grid">
            ${Object.entries(analisis_completo_tendencias).map(([producto, info]) => {
                const isUp = info.status.includes('Subiendo');
                return `
                    <div class="trend-item ${isUp ? 'up' : 'down'}">
                        <div class="trend-name">${producto}</div>
                        <div class="trend-slope">${info.slope > 0 ? '+' : ''}${info.slope}</div>
                        <div class="trend-status">${info.status}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    trendsCard.innerHTML = trendsHTML;
    dashboardDiv.appendChild(trendsCard);

    mostrarEstado('✅ Datos cargados correctamente', 'success');
}

/**
 * Muestra un mensaje de estado
 */
function mostrarEstado(mensaje, tipo) {
    const statusDiv = document.getElementById('status-message');
    statusDiv.textContent = mensaje;
    statusDiv.classList.remove('success', 'error');
    statusDiv.classList.add(tipo);
    statusDiv.style.display = 'block';

    if (tipo === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}
