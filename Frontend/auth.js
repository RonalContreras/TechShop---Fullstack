console.log("🔐 AUTH.JS CARGADO");

// const API_URL = window.API_CONFIG?.API_URL || "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
  agregarModalesAuth();
});

function agregarModalesAuth() {
  const modalesHTML = `
        <!-- Modal Login -->
        <div class="auth-modal" id="modal-login">
            <div class="auth-modal-content">
                <button class="auth-modal-close" onclick="cerrarModalAuth('modal-login')">&times;</button>
                <div class="auth-modal-header">
                    <h2>Iniciar Sesión</h2>
                    <p>Bienvenido de nuevo a TechShop</p>
                </div>
                <form id="form-login" class="auth-form">
                    <div class="form-group">
                        <label for="login-email">
                            <i class="fas fa-envelope"></i>
                            Correo Electrónico
                        </label>
                        <input type="email" id="login-email" required placeholder="tu@email.com">
                    </div>
                    <div class="form-group">
                        <label for="login-password">
                            <i class="fas fa-lock"></i>
                            Contraseña
                        </label>
                        <input type="password" id="login-password" required placeholder="••••••••">
                    </div>
                    <button type="submit" class="btn btn-auth-submit">Iniciar Sesión</button>
                </form>
                <div class="auth-modal-footer">
                    <p>¿No tienes cuenta? <a href="#" onclick="cambiarARegistro(); return false;">Regístrate aquí</a></p>
                </div>
            </div>
        </div>

        <!-- Modal Registro -->
        <div class="auth-modal" id="modal-registro">
            <div class="auth-modal-content">
                <button class="auth-modal-close" onclick="cerrarModalAuth('modal-registro')">&times;</button>
                <div class="auth-modal-header">
                    <h2>Crear Cuenta</h2>
                    <p>Únete a TechShop</p>
                </div>
                <form id="form-registro" class="auth-form">
                    <div class="form-group">
                        <label for="registro-nombre">
                            <i class="fas fa-user"></i>
                            Nombre Completo
                        </label>
                        <input type="text" id="registro-nombre" required placeholder="Juan Pérez">
                    </div>
                    <div class="form-group">
                        <label for="registro-email">
                            <i class="fas fa-envelope"></i>
                            Correo Electrónico
                        </label>
                        <input type="email" id="registro-email" required placeholder="tu@email.com">
                    </div>
                    <div class="form-group">
                        <label for="registro-password">
                            <i class="fas fa-lock"></i>
                            Contraseña
                        </label>
                        <input type="password" id="registro-password" required placeholder="Mínimo 6 caracteres">
                    </div>
                    <div class="form-group">
                        <label for="registro-password-confirm">
                            <i class="fas fa-lock"></i>
                            Confirmar Contraseña
                        </label>
                        <input type="password" id="registro-password-confirm" required placeholder="Repite tu contraseña">
                    </div>
                    <button type="submit" class="btn btn-auth-submit">Crear Cuenta</button>
                </form>
                <div class="auth-modal-footer">
                    <p>¿Ya tienes cuenta? <a href="#" onclick="cambiarALogin(); return false;">Inicia sesión aquí</a></p>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", modalesHTML);
  agregarEstilosAuth();
  setupAuthEventListeners();
}

function agregarEstilosAuth() {
  if (document.getElementById("auth-styles")) return;

  const styles = `
        <style id="auth-styles">
            .auth-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                backdrop-filter: blur(5px);
            }

            .auth-modal.active {
                opacity: 1;
                visibility: visible;
            }

            .auth-modal-content {
                background: white;
                border-radius: var(--border-radius);
                width: 90%;
                max-width: 480px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: var(--box-shadow-lg);
                animation: slideUp 0.3s ease;
                position: relative;
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .auth-modal-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                width: 36px;
                height: 36px;
                border: none;
                background-color: var(--light-gray);
                border-radius: 50%;
                font-size: 1.5rem;
                cursor: pointer;
                transition: var(--transition);
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--dark-color);
                z-index: 10;
            }

            .auth-modal-close:hover {
                background-color: var(--accent-color);
                color: white;
            }

            .auth-modal-header {
                padding: 2rem;
                text-align: center;
                border-bottom: 1px solid var(--light-gray);
            }

            .auth-modal-header h2 {
                font-size: 1.75rem;
                color: var(--dark-color);
                margin-bottom: 0.5rem;
            }

            .auth-modal-header p {
                color: var(--gray-color);
                font-size: 0.95rem;
            }

            .auth-form {
                padding: 2rem;
            }

            .auth-form .form-group {
                margin-bottom: 1.5rem;
            }

            .auth-form label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: var(--dark-color);
                font-size: 0.9rem;
            }

            .auth-form label i {
                color: var(--primary-color);
            }

            .auth-form input {
                width: 100%;
                padding: 0.75rem 1rem;
                border: 1px solid var(--light-gray);
                border-radius: var(--border-radius);
                font-size: 0.95rem;
                font-family: var(--font-primary);
                transition: var(--transition);
            }

            .auth-form input:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
            }

            .btn-auth-submit {
                width: 100%;
                padding: 1rem;
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
                border: none;
                border-radius: var(--border-radius);
                font-weight: 600;
                font-size: 1rem;
                cursor: pointer;
                transition: var(--transition);
            }

            .btn-auth-submit:hover {
                transform: translateY(-2px);
                box-shadow: var(--box-shadow-lg);
            }

            .auth-modal-footer {
                padding: 1.5rem 2rem;
                text-align: center;
                border-top: 1px solid var(--light-gray);
                background-color: var(--light-color);
            }

            .auth-modal-footer p {
                color: var(--gray-color);
                font-size: 0.9rem;
            }

            .auth-modal-footer a {
                color: var(--primary-color);
                font-weight: 600;
                transition: var(--transition);
            }

            .auth-modal-footer a:hover {
                color: var(--primary-dark);
                text-decoration: underline;
            }

            @media (max-width: 768px) {
                .auth-modal-content {
                    width: 95%;
                    max-height: 95vh;
                }
            }
        </style>
    `;

  document.head.insertAdjacentHTML("beforeend", styles);
}

function setupAuthEventListeners() {
  document.getElementById("form-login").addEventListener("submit", handleLogin);
  document
    .getElementById("form-registro")
    .addEventListener("submit", handleRegistro);

  document.querySelectorAll(".auth-modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  });
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.usuario));

      window.currentUser = data.usuario;

      cerrarModalAuth("modal-login");

      if (data.usuario.rol === "admin") {
        window.showMessage("Bienvenido administrador", "success");
        setTimeout(() => {
          window.location.href = "admin.html";
        }, 1000);
      } else {
        window.showMessage("Sesión iniciada exitosamente", "success");
        window.actualizarUIUsuario(true);
        await window.sincronizarCarritoConServidor();
      }
    } else {
      window.showMessage(data.message || "Credenciales incorrectas", "warning");
    }
  } catch (error) {
    console.error("Error:", error);
    window.showMessage("Error al conectar con el servidor", "error");
  }
}

async function handleRegistro(e) {
  e.preventDefault();

  const nombre = document.getElementById("registro-nombre").value;
  const email = document.getElementById("registro-email").value;
  const password = document.getElementById("registro-password").value;
  const passwordConfirm = document.getElementById(
    "registro-password-confirm"
  ).value;

  if (password !== passwordConfirm) {
    window.showMessage("Las contraseñas no coinciden", "warning");
    return;
  }

  if (password.length < 6) {
    window.showMessage(
      "La contraseña debe tener al menos 6 caracteres",
      "warning"
    );
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/registro`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombre, email, password }),
    });

    const data = await response.json();

    if (data.success) {
      window.showMessage(
        "✅ Cuenta creada exitosamente. Por favor inicia sesión.",
        "success"
      );

      // Limpiar formulario
      document.getElementById("form-registro").reset();

      // Cambiar a login después de 1.5 segundos
      setTimeout(() => {
        cerrarModalAuth("modal-registro");
        abrirModalAuth("login");

        // Pre-llenar el email en login
        document.getElementById("login-email").value = email;
      }, 1500);
    } else {
      window.showMessage(data.message || "Error al crear cuenta", "warning");
    }
  } catch (error) {
    console.error("Error:", error);
    window.showMessage("Error al conectar con el servidor", "error");
  }
}

function abrirModalAuth(tipo) {
  const modalId = `modal-${tipo}`;
  const modal = document.getElementById(modalId);

  if (modal) {
    modal.classList.add("active");
  }
}

function cerrarModalAuth(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
  }
}

function cambiarARegistro() {
  cerrarModalAuth("modal-login");
  abrirModalAuth("registro");
}

function cambiarALogin() {
  cerrarModalAuth("modal-registro");
  abrirModalAuth("login");
}

window.abrirModalAuth = abrirModalAuth;
window.cerrarModalAuth = cerrarModalAuth;
window.cambiarARegistro = cambiarARegistro;
window.cambiarALogin = cambiarALogin;

console.log("✅ Auth configurado");
