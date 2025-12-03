document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS ---
    const forgotForm = document.getElementById('forgotForm');
    const resetForm = document.getElementById('resetForm');
    const emailInput = document.getElementById('email');
    const alertBox = document.getElementById('alert-box');
    
    // Inputs del paso 2
    const codeInput = document.getElementById('code');
    const newPassInput = document.getElementById('newPassword');
    const confirmPassInput = document.getElementById('confirmNewPassword');

    // Variable para guardar el email entre pasos
    let userEmail = "";

    // --- CONFIGURACIÓN API ---
    // Paso 1: Solicitar código
    const URL_FORGOT = 'https://coffeu-16727117187.europe-west1.run.app/accounts/forgot/';
    // Paso 2: Enviar código y nueva contraseña (ASUMIENDO ESTA RUTA, VERIFICA TU API)
    const URL_RESET = 'https://coffeu-16727117187.europe-west1.run.app/accounts/reset/';

    // Proxy para evitar CORS
    const PROXY = 'https://corsproxy.io/?';

    // --- LOGICA PASO 1: ENVIAR CORREO ---
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        if(!email) return;

        const btn = document.getElementById('btn-send-code');
        setLoading(btn, true, 'Enviando...');
        hideAlert();

        try {
            // Petición POST al endpoint /forgot/
            const response = await fetch(PROXY + encodeURIComponent(URL_FORGOT), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            if (!response.ok) throw new Error('No se pudo enviar el correo. Verifica que el email exista.');

            // Si todo sale bien:
            userEmail = email; // Guardamos el email para el siguiente paso
            showAlert('¡Código enviado! Revisa tu bandeja de entrada.', 'success');
            
            // Cambiamos de formulario
            setTimeout(() => {
                forgotForm.style.display = 'none';
                resetForm.style.display = 'block';
                hideAlert();
            }, 1500);

        } catch (error) {
            console.error(error);
            showAlert(error.message, 'error');
        } finally {
            setLoading(btn, false, 'Enviar Código');
        }
    });

    // --- LOGICA PASO 2: CAMBIAR CONTRASEÑA ---
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const code = codeInput.value.trim();
        const password = newPassInput.value;
        const confirm = confirmPassInput.value;

        // Validaciones básicas
        if (password !== confirm) {
            showAlert('Las contraseñas no coinciden', 'error');
            return;
        }

        const btn = document.getElementById('btn-reset-pass');
        setLoading(btn, true, 'Verificando...');
        hideAlert();

        try {
            // Petición POST al endpoint /reset/
            // Nota: La estructura del body depende de tu backend. 
            // Usualmente piden: email, codigo (otp) y password.
            const response = await fetch(PROXY + encodeURIComponent(URL_RESET), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    otp: code,       // A veces se llama 'code' o 'token' en el backend
                    password: password
                })
            });

            if (!response.ok) {
                const errorData = await response.json(); // Intentar leer el error del servidor
                throw new Error(errorData.detail || errorData.message || 'Código incorrecto o expirado.');
            }

            showAlert('¡Contraseña cambiada con éxito! Redirigiendo...', 'success');
            
            // Redirigir al login
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error(error);
            showAlert(error.message, 'error');
        } finally {
            setLoading(btn, false, 'Cambiar Contraseña');
        }
    });

    // --- FUNCIONES UTILITARIAS ---
    function showAlert(msg, type) {
        alertBox.textContent = msg;
        alertBox.className = `alert alert-${type}`;
        alertBox.style.display = 'block';
    }

    function hideAlert() {
        alertBox.style.display = 'none';
    }

    function setLoading(button, isLoading, text) {
        if (isLoading) {
            button.disabled = true;
            button.textContent = text;
        } else {
            button.disabled = false;
            button.textContent = text;
        }
    }
});