/**
 * orden.js - Gestión de órdenes y POST al backend
 */

// Configuración de la API del backend
const BACKEND_API = 'https://coffeu-16727117187.europe-west1.run.app/orders/';
// Proxy temporal para desarrollo (fallback si el navegador bloquea por CORS)
const BACKEND_PROXY = 'https://corsproxy.io/?' + encodeURIComponent(BACKEND_API);
// Control para usar proxy: false = no intentar proxy, true = permitir fallback vía proxy
const USE_PROXY = false; // cámbialo a true solo para pruebas locales si el proxy admite POST

/**
 * Envía la orden al backend
 * @param {Array} carrito - Array con los items del carrito
 * @param {string} token - Token de autenticación (opcional)
 * @returns {Promise<Object>} Respuesta del servidor
 */
async function crearOrden(carrito, token = null) {
    if (!carrito || carrito.length === 0) {
        throw new Error('El carrito está vacío');
    }

    // Obtener token del localStorage si no se proporciona
    if (!token) {
        token = localStorage.getItem('accessToken');
    }

    // Construir datos de la orden con la estructura solicitada
    const totalRaw = carrito.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const total = Number(totalRaw.toFixed(2));

    const datosOrden = {
        total: total,
        estado: 'pendiente',
        items: carrito.map(item => {
            const precio_unitario = Number(Number(item.price).toFixed(2));
            const subtotal = Number((precio_unitario * Number(item.quantity)).toFixed(2));
            return {
                producto_id: item.id,
                nombre_producto: item.name,
                cantidad: Number(item.quantity),
                precio_unitario: precio_unitario,
                subtotal: subtotal
            };
        })
    };

    // Intentar envío directo primero
    try {
        const response = await fetch(BACKEND_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(datosOrden)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('Orden creada exitosamente (directo):', resultado);
        return resultado;

    } catch (error) {
        console.error('Error al crear orden (directo):', error);

        // Si es un error de red/CORS, intentar vía proxy si está habilitado
        const isNetworkError = error instanceof TypeError || (error.message && error.message.includes('Failed to fetch'));
        if (isNetworkError) {
            if (USE_PROXY) {
                console.warn('Intentando fallback vía CORS proxy...');
                try {
                    const proxyResp = await fetch(BACKEND_PROXY, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token && { 'Authorization': `Bearer ${token}` })
                        },
                        body: JSON.stringify(datosOrden)
                    });

                    if (!proxyResp.ok) {
                        throw new Error(`Proxy HTTP ${proxyResp.status}: ${proxyResp.statusText}`);
                    }

                    const resultadoProxy = await proxyResp.json();
                    console.log('Orden creada exitosamente (proxy):', resultadoProxy);
                    return resultadoProxy;
                } catch (proxyError) {
                    console.error('Error al crear orden vía proxy:', proxyError);
                    throw proxyError;
                }
            } else {
                // Informar al usuario que es un error de red/CORS y cómo solucionarlo
                const message = 'Network/CORS error al conectar con el backend. Habilita CORS en el servidor o ajusta USE_PROXY=true para probar con un proxy temporal.';
                console.error(message, error);
                throw new Error(message + ' Detalle: ' + (error.message || error));
            }
        }

        // Si no es error de red, propagar
        throw error;
    }
}

/**
 * Maneja el proceso completo de pago
 * Siempre muestra éxito y redirige a la pasarela de pago
 * @param {Array} carrito - Array con los items del carrito
 */
async function procesarPago(carrito) {
    if (!carrito || carrito.length === 0) {
        alert('Tu carrito está vacío. Agrega productos antes de pagar.');
        return false;
    }

    try {
        // Mostrar indicador de carga
        const mensaje = document.createElement('div');
        mensaje.id = 'loading-message';
        mensaje.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            z-index: 9999;
            text-align: center;
            font-family: 'Segoe UI', sans-serif;
        `;
        mensaje.innerHTML = `
            <div style="font-size: 1.2rem; color: #333; margin-bottom: 15px;">
                ⏳ Procesando tu orden...
            </div>
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #e67e22; border-radius: 50%; margin: 0 auto; animation: spin 1s linear infinite;"></div>
        `;
        document.body.appendChild(mensaje);

        // Intentar crear la orden en el backend (sin esperar respuesta)
        crearOrden(carrito).catch(err => console.log('Nota:', err));

        // Guardar datos de la orden en localStorage
        localStorage.setItem('shoppingCart', JSON.stringify(carrito));

        // Pequeño delay para que se vea la animación
        setTimeout(() => {
            // Eliminar mensaje de carga
            if (document.getElementById('loading-message')) {
                document.body.removeChild(document.getElementById('loading-message'));
            }

            // Mostrar confirmación de éxito
            alert('✅ Orden realizada exitosamente');

            // Redirigir a pasarela de pago
            window.location.href = 'view/pasarela-pago.html';
        }, 1500);

        return true;

    } catch (error) {
        console.log('Nota:', error);
        
        // Eliminar mensaje de carga si existe
        const mensaje = document.getElementById('loading-message');
        if (mensaje) document.body.removeChild(mensaje);

        // Siempre permitir ir a pasarela
        localStorage.setItem('shoppingCart', JSON.stringify(carrito));
        alert('✅ Orden realizada exitosamente');
        window.location.href = 'view/pasarela-pago.html';
        return true;
    }
}

// Añadir estilos para animación de carga
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
