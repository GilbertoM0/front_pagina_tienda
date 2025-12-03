document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const registerForm = document.getElementById('registerForm');
    const pass1 = document.getElementById('password');
    const pass2 = document.getElementById('password2');
    const errorPass = document.getElementById('errorContrasena');
    const generalMsg = document.getElementById('generalMsg');
    const btnRegister = document.getElementById('btnRegister');

    // Iconos de ver contraseña
    const togglePass1 = document.getElementById('verPass1');
    const togglePass2 = document.getElementById('verPass2');

    // URL API (Con Proxy)
    const API_REGISTER = 'https://coffeu-16727117187.europe-west1.run.app/accounts/registro/';
    const PROXY_URL = 'https://corsproxy.io/?' + encodeURIComponent(API_REGISTER);

    // 1. LÓGICA VER/OCULTAR CONTRASEÑA
    togglePass1.addEventListener('click', () => toggleVisibility(pass1, togglePass1));
    togglePass2.addEventListener('click', () => toggleVisibility(pass2, togglePass2));

    function toggleVisibility(input, icon) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        // Cambiar icono
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    }

    // 2. VALIDACIÓN EN TIEMPO REAL
    pass2.addEventListener('input', () => {
        if (pass2.value && pass1.value !== pass2.value) {
            errorPass.style.display = 'block';
        } else {
            errorPass.style.display = 'none';
        }
    });

    // 3. ENVÍO DEL FORMULARIO
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validar contraseñas
        if (pass1.value !== pass2.value) {
            mostrarMensaje("Las contraseñas no coinciden.", "error");
            return;
        }

        // Preparar datos
        const formData = {
            email: document.getElementById('email').value.trim(),
            username: document.getElementById('nombre_usuario').value.trim(),
            phone_number: document.getElementById('telefono_celular').value.trim(),
            password: pass1.value
        };

        setLoading(true);
        mostrarMensaje("", "hide");

        try {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                let errorMsg = "Error al registrarse.";
                if (errorData.detail) errorMsg = errorData.detail;
                else if (errorData.email) errorMsg = "El correo ya está registrado.";
                else if (errorData.username) errorMsg = "El usuario ya existe.";
                
                throw new Error(errorMsg);
            }

            // ÉXITO
            mostrarMensaje("¡Cuenta creada con éxito! Redirigiendo...", "success");
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error(error);
            mostrarMensaje("❌ " + error.message, "error");
        } finally {
            setLoading(false);
        }
    });

    // Funciones Auxiliares
    function mostrarMensaje(texto, tipo) {
        if (tipo === "hide") {
            generalMsg.style.display = 'none';
            return;
        }
        generalMsg.textContent = texto;
        generalMsg.className = `alert-box ${tipo === 'success' ? 'msg-success' : 'msg-error'}`;
        generalMsg.style.display = 'block';
    }

    function setLoading(loading) {
        if (loading) {
            btnRegister.disabled = true;
            btnRegister.textContent = "REGISTRANDO...";
        } else {
            btnRegister.disabled = false;
            btnRegister.textContent = "REGISTRARSE";
        }
    }
});