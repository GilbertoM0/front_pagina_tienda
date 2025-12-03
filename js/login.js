// Configura aquí el endpoint de login de tu backend
const API_URL = 'http://127.0.0.1:3000/accounts/login/'; // Cambia si tu endpoint es otro


const form = document.getElementById('loginForm');
const msg = document.getElementById('msg');
const success = document.getElementById('success');
const userContainer = document.getElementById('userContainer');
const userInfo = document.getElementById('userInfo');
// referencias para mensajes de error por campo
const identificadorErrorEl = document.getElementById('identificadorError');
const passwordErrorEl = document.getElementById('passwordError');

function showError(text) {
	msg.textContent = text;
	msg.style.display = 'block';
	success.style.display = 'none';
}
function showSuccess(text) {
	success.textContent = text;
	success.style.display = 'block';
	msg.style.display = 'none';
}

form.addEventListener('submit', async (e) => {
	e.preventDefault();
	// limpiar mensajes
	msg.style.display = 'none';
	success.style.display = 'none';
	userContainer.style.display = 'none';
	identificadorErrorEl.style.display = 'none';
	passwordErrorEl.style.display = 'none';
	identificadorErrorEl.textContent = '';
	passwordErrorEl.textContent = '';

	const identificador = document.getElementById('identificador').value.trim();
	const password = document.getElementById('password').value;

	// validación cliente: mostrar mensaje pequeño por campo si falta
	let hasError = false;
	if (!identificador) {
		identificadorErrorEl.textContent = 'Por favor ingresa usuario o correo.';
		identificadorErrorEl.style.display = 'block';
		hasError = true;
	}
	if (!password) {
		passwordErrorEl.textContent = 'Por favor ingresa la contraseña.';
		passwordErrorEl.style.display = 'block';
		hasError = true;
	}
	if (hasError) return; // detener envío si falta información

	try {
		const resp = await fetch(API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ identificador, password })
		});

		const data = await resp.json();

		if (!resp.ok) {
			const err = data?.error || data?.detail || JSON.stringify(data);
			const lower = String(err).toLowerCase();
			// si backend indica recurso no encontrado, mostrar warning junto al campo identificador
			if (resp.status === 404
				|| lower.includes('no existe')
				|| lower.includes('no encontrado')
				|| lower.includes('not found')
				|| (lower.includes('correo') && lower.includes('no'))) {
				identificadorErrorEl.textContent = 'El Correo no Existe';
				identificadorErrorEl.style.display = 'block';
			} else {
				showError(err);
			}
			return;
		}

		if (data.access_token && data.refresh_token) {
			localStorage.setItem('access_token', data.access_token);
			localStorage.setItem('refresh_token', data.refresh_token);

			showSuccess('Autenticado correctamente');
			// redirigir tras autenticación correcta
			window.location.href = 'home.html';

			const u = data.user || {};
			userInfo.innerHTML = `
						<strong>${u.nombre_usuario || u.email || 'Usuario'}</strong><br/>
						Correo: ${u.email || '-'}<br/>
						Teléfono: ${u.telefono_celular || '-'}<br/>
						ID: ${u.id || '-'}
			`;
            userContainer.style.display = 'block';
		} else {
            showError('Respuesta inesperada del servidor.');
        }
	} catch (error) {
        console.error('Error en el login:', error);
        showError('No se pudo conectar al servidor. Intenta de nuevo.');
    }
});