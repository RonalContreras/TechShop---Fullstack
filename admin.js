// Configuración de la API
const API_URL = window.API_CONFIG?.API_URL || "http://localhost:5000/api";

// Estado global
let currentUser = null;
let currentSection = "dashboard";

// DOM Elements
const sidebar = document.querySelector(".admin-sidebar");
const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".admin-section");
const pageTitle = document.getElementById("page-title");
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const logoutBtn = document.getElementById("btn-logout");

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  verificarAutenticacion();
  setupEventListeners();
});

// Verificar autenticación
async function verificarAutenticacion() {
  // const token = localStorage.getItem("token");

  // if (!token) {
  //   window.location.href = "index.html";
  //   return;
  // }

  // try {
  //   const response = await fetch(`${API_URL}/auth/perfil`, {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });

  //   if (!response.ok) throw new Error("No autorizado");

  //   const data = await response.json();
  //   currentUser = data.usuario;

  //   if (currentUser.rol !== "admin") {
  //     mostrarNotificacion("No tienes permisos de administrador", "error");
  //     setTimeout(() => {
  //       window.location.href = "index.html";
  //     }, 2000);
  //     return;
  //   }

  currentUser = {
    nombre: "Administrador",
    email: "admin@techshop.com",
    rol: "admin",
    _id: "temp-id",
  };

  // Actualizar información del usuario
  document.getElementById("admin-name").textContent = currentUser.nombre;
  document.getElementById("admin-email").textContent = currentUser.email;

  // Cargar datos iniciales
  cargarDashboard();
  // } catch (error) {
  //   console.error("Error de autenticación:", error);
  //   localStorage.removeItem("token");
  //   window.location.href = "index.html";
  // }
}

// Setup Event Listeners
function setupEventListeners() {
  // Navegación
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      cambiarSeccion(section);
    });
  });

  // Menú móvil
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // Cerrar sesión
  logoutBtn.addEventListener("click", cerrarSesion);

  // Botón nuevo producto
  document
    .getElementById("btn-nuevo-producto")
    ?.addEventListener("click", () => {
      abrirModalProducto();
    });

  // Formulario producto
  document
    .getElementById("form-producto")
    ?.addEventListener("submit", guardarProducto);

  // Cerrar modales
  document.querySelectorAll(".modal-close, [data-modal]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (e.target.hasAttribute("data-modal")) {
        const modalId = e.target.getAttribute("data-modal");
        cerrarModal(modalId);
      } else {
        e.target.closest(".modal").classList.remove("active");
      }
    });
  });

  // Filtros
  document
    .getElementById("filter-categoria")
    ?.addEventListener("change", filtrarProductos);
  document
    .getElementById("filter-estado")
    ?.addEventListener("change", filtrarPedidos);
  document
    .getElementById("filter-rol")
    ?.addEventListener("change", filtrarUsuarios);

  // Búsqueda
  document
    .getElementById("search-productos")
    ?.addEventListener("input", buscarProductos);
  document
    .getElementById("search-pedidos")
    ?.addEventListener("input", buscarPedidos);
  document
    .getElementById("search-usuarios")
    ?.addEventListener("input", buscarUsuarios);
}

// Cambiar sección
function cambiarSeccion(section) {
  currentSection = section;

  // Actualizar navegación
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.section === section);
  });

  // Actualizar secciones
  sections.forEach((sec) => {
    sec.classList.toggle("active", sec.id === `section-${section}`);
  });

  // Actualizar título
  const titles = {
    dashboard: "Dashboard",
    productos: "Gestión de Productos",
    pedidos: "Gestión de Pedidos",
    usuarios: "Gestión de Usuarios",
  };
  pageTitle.textContent = titles[section] || section;

  // Cargar datos de la sección
  cargarSeccion(section);

  // Cerrar menú móvil
  sidebar.classList.remove("active");
}

// Cargar sección
async function cargarSeccion(section) {
  switch (section) {
    case "dashboard":
      await cargarDashboard();
      break;
    case "productos":
      await cargarProductos();
      break;
    case "pedidos":
      await cargarPedidos();
      break;
    case "usuarios":
      await cargarUsuarios();
      break;
  }
}

// =================== DASHBOARD ===================

async function cargarDashboard() {
  try {
    const token = localStorage.getItem("token");

    // Cargar estadísticas
    const statsResponse = await fetch(`${API_URL}/users/estadisticas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statsData = await statsResponse.json();

    if (statsData.success) {
      const stats = statsData.estadisticas;

      // Actualizar estadísticas
      document.getElementById(
        "stat-ventas"
      ).textContent = `$${stats.ventasTotales.toFixed(2)}`;
      document.getElementById("stat-pedidos").textContent = stats.totalPedidos;
      document.getElementById("stat-productos").textContent =
        stats.totalProductos;
      document.getElementById("stat-usuarios").textContent =
        stats.totalUsuarios;

      // Actualizar contadores de estado
      const estadosPedidos = stats.pedidosPorEstado.reduce((acc, item) => {
        acc[item._id] = item.cantidad;
        return acc;
      }, {});

      document.getElementById("count-pendientes").textContent =
        estadosPedidos.pendiente || 0;
      document.getElementById("count-procesando").textContent =
        estadosPedidos.procesando || 0;
      document.getElementById("count-enviados").textContent =
        estadosPedidos.enviado || 0;
      document.getElementById("count-entregados").textContent =
        estadosPedidos.entregado || 0;

      // Mostrar productos más vendidos
      mostrarProductosMasVendidos(stats.productosMasVendidos);
    }

    // Cargar pedidos recientes
    const pedidosResponse = await fetch(`${API_URL}/orders?limite=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pedidosData = await pedidosResponse.json();

    if (pedidosData.success) {
      mostrarPedidosRecientes(pedidosData.pedidos);
    }
  } catch (error) {
    console.error("Error al cargar dashboard:", error);
    mostrarNotificacion("Error al cargar el dashboard", "error");
  }
}

function mostrarPedidosRecientes(pedidos) {
  const container = document.getElementById("recent-orders");

  if (!pedidos || pedidos.length === 0) {
    container.innerHTML =
      '<p class="loading-text">No hay pedidos recientes</p>';
    return;
  }

  container.innerHTML = pedidos
    .map((pedido) => {
      // Manejar tanto id como _id
      const pedidoId = pedido.id || pedido._id;
      const pedidoIdCorto = pedidoId.toString().slice(-8);
      let usuarioNombre = "Cliente";
      if (pedido.usuario) {
        if (typeof pedido.usuario === "object") {
          usuarioNombre = pedido.usuario.nombre || "Cliente";
        }
      }
      return `
        <div class="order-item">
            <div class="order-info">
                <p class="order-id">#${pedidoIdCorto}</p>
                <p class="order-customer">${pedido.usuario.nombre}</p>
            </div>
            <p class="order-total">$${Number(pedido.total).toFixed(2)}</p>
            <span class="badge badge-${pedido.estado}">${pedido.estado}</span>
        </div>
    `;
    })
    .join("");
}

function mostrarProductosMasVendidos(productos) {
  const container = document.getElementById("top-products");

  if (!productos || productos.length === 0) {
    container.innerHTML =
      '<p class="loading-text">No hay datos disponibles</p>';
    return;
  }

  container.innerHTML = productos
    .map(
      (producto, index) => `
        <div class="product-item">
            <div class="product-rank">${index + 1}</div>
            <div class="product-details">
                <p class="product-name">${producto.nombre}</p>
                <p class="product-sold">${
                  producto.totalVendido
                } unidades vendidas</p>
            </div>
            <p class="order-total">$${producto.ingresos.toFixed(2)}</p>
        </div>
    `
    )
    .join("");
}

// =================== PRODUCTOS ===================

async function cargarProductos() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/products?limite=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      mostrarProductosTabla(data.productos);
    }
  } catch (error) {
    console.error("Error al cargar productos:", error);
    mostrarNotificacion("Error al cargar productos", "error");
  }
}

function mostrarProductosTabla(productos) {
  const tbody = document.getElementById("productos-table-body");

  if (productos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="loading-cell">No hay productos disponibles</td></tr>';
    return;
  }

  tbody.innerHTML = productos
    .map(
      (producto) => `
        <tr>
            <td><img src="${producto.imagen}" alt="${
        producto.nombre
      }" class="table-image"></td>
            <td>
                <strong>${producto.nombre}</strong>
                ${
                  producto.destacado
                    ? '<span class="badge badge-destacado">Destacado</span>'
                    : ""
                }
            </td>
            <td style="text-transform: capitalize;">${producto.categoria}</td>
            <td><strong>$${Number(producto.precio).toFixed(2)}</strong></td>
            <td>${producto.stock || 0}</td>
            <td>
                <span class="badge ${
                  producto.activo ? "badge-activo" : "badge-inactivo"
                }">
                    ${producto.activo ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-edit" data-id="${
                      producto.id
                    }" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" data-id="${
                      producto.id
                    }" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");

  // Agregar event listeners a los botones
  tbody.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      editarProducto(id);
    });
  });

  tbody.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      eliminarProducto(id);
    });
  });
}

function abrirModalProducto(producto = null) {
  const modal = document.getElementById("modal-producto");
  const title = document.getElementById("modal-producto-title");
  const form = document.getElementById("form-producto");

  if (producto) {
    title.textContent = "Editar Producto";
    document.getElementById("producto-id").value = producto.id;
    document.getElementById("producto-nombre").value = producto.nombre;
    document.getElementById("producto-descripcion").value =
      producto.descripcion;
    document.getElementById("producto-precio").value = producto.precio;
    document.getElementById("producto-stock").value = producto.stock;
    document.getElementById("producto-categoria").value = producto.categoria;
    document.getElementById("producto-marca").value = producto.marca || "";
    document.getElementById("producto-imagen").value = producto.imagen;
    document.getElementById("producto-destacado").checked = producto.destacado;
  } else {
    title.textContent = "Nuevo Producto";
    form.reset();
    document.getElementById("producto-id").value = "";
  }

  modal.classList.add("active");
}

async function guardarProducto(e) {
  e.preventDefault();

  const productoId = document.getElementById("producto-id").value;
  const productoData = {
    nombre: document.getElementById("producto-nombre").value,
    descripcion: document.getElementById("producto-descripcion").value,
    precio: parseFloat(document.getElementById("producto-precio").value),
    stock: parseInt(document.getElementById("producto-stock").value),
    categoria: document.getElementById("producto-categoria").value,
    marca: document.getElementById("producto-marca").value,
    imagen: document.getElementById("producto-imagen").value,
    destacado: document.getElementById("producto-destacado").checked,
  };

  try {
    const token = localStorage.getItem("token");
    const url = productoId
      ? `${API_URL}/products/${productoId}`
      : `${API_URL}/products`;
    const method = productoId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productoData),
    });

    const data = await response.json();

    if (data.success) {
      mostrarNotificacion(
        productoId
          ? "Producto actualizado exitosamente"
          : "Producto creado exitosamente",
        "success"
      );
      cerrarModal("modal-producto");
      cargarProductos();
    } else {
      mostrarNotificacion(data.message || "Error al guardar producto", "error");
    }
  } catch (error) {
    console.error("Error al guardar producto:", error);
    mostrarNotificacion("Error al guardar producto", "error");
  }
}

async function editarProducto(id) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      abrirModalProducto(data.producto);
    }
  } catch (error) {
    console.error("Error al obtener producto:", error);
    mostrarNotificacion("Error al cargar producto", "error");
  }
}

async function eliminarProducto(id) {
  if (!confirm("¿Estás seguro de eliminar este producto?")) return;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (data.success) {
      mostrarNotificacion("Producto eliminado exitosamente", "success");
      cargarProductos();
    } else {
      mostrarNotificacion(
        data.message || "Error al eliminar producto",
        "error"
      );
    }
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    mostrarNotificacion("Error al eliminar producto", "error");
  }
}

async function filtrarProductos() {
  const categoria = document.getElementById("filter-categoria").value;
  const searchTerm = document.getElementById("search-productos").value;

  try {
    const token = localStorage.getItem("token");
    let url = `${API_URL}/products?limite=100`;

    if (categoria) url += `&categoria=${categoria}`;
    if (searchTerm) url = `${API_URL}/products/buscar?q=${searchTerm}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      mostrarProductosTabla(data.productos);
    }
  } catch (error) {
    console.error("Error al filtrar productos:", error);
  }
}

function buscarProductos(e) {
  const searchTerm = e.target.value.toLowerCase();
  filtrarProductos();
}

// =================== PEDIDOS ===================

async function cargarPedidos() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/orders?limite=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      mostrarPedidosTabla(data.pedidos);
    }
  } catch (error) {
    console.error("Error al cargar pedidos:", error);
    mostrarNotificacion("Error al cargar pedidos", "error");
  }
}

function mostrarPedidosTabla(pedidos) {
  const tbody = document.getElementById("pedidos-table-body");

  if (!pedidos || pedidos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="loading-cell">No hay pedidos disponibles</td></tr>';
    return;
  }

  tbody.innerHTML = pedidos
    .map((pedido) => {
      const pedidoId = pedido.id || pedido._id || "unknow";
      const pedidoIdCorto = pedidoId.toString().slice(-8);
      let usuarioNombre = "Cliente";
      if (pedido.usuario) {
        if (typeof pedido.usuario === "object") {
          usuarioNombre = pedido.usuario.nombre || "Cliente";
        } else {
          usuarioNombre = "Cliente";
        }
      }
      return `
        <tr>
            <td><strong>#${pedidoIdCorto.slice(-8)}</strong></td>
            <td>${usuarioNombre}</td>
            <td>${new Date(pedido.createdAt).toLocaleDateString("es-ES")}</td>
            <td><strong>$${pedido.total.toFixed(2)}</strong></td>
            <td>
                <span class="badge badge-${
                  pedido.estado
                }" style="text-transform: capitalize;">
                    ${pedido.estado}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-view" onclick="verPedido('${pedidoId}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    })
    .join("");
}

async function verPedido(id) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      mostrarDetallesPedido(data.pedido);
    }
  } catch (error) {
    console.error("Error al cargar pedido:", error);
    mostrarNotificacion("Error al cargar pedido", "error");
  }
}

function mostrarDetallesPedido(pedido) {
  const modal = document.getElementById("modal-pedido");
  const body = document.getElementById("pedido-detalles");

  const pedidoId = pedido.id || pedido._id || "unknow";
  const pedidoIdCorto = pedidoId.toString().slice(-8);

  let usuarioNombre = "Cliente";
  let usuarioEmail = "No disponible";

  if (pedido.usuario) {
    if (typeof pedido.usuario === "object") {
      usuarioNombre = pedido.usuario.nombre || "Cliente";
      usuarioEmail = pedido.usuario.email || "No disponible";
    }
  }
  body.innerHTML = `
        <div class="order-detail-grid">
            <div class="detail-card">
                <h4>Información del Pedido</h4>
                <div class="detail-item">
                    <span class="detail-label">ID:</span>
                    <span class="detail-value">#${pedidoIdCorto}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Fecha:</span>
                    <span class="detail-value">${new Date(
                      pedido.createdAt
                    ).toLocaleDateString("es-ES")}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Método de Pago:</span>
                    <span class="detail-value" style="text-transform: capitalize;">${
                      pedido.metodoPago
                    }</span>
                </div>
            </div>
            
            <div class="detail-card">
                <h4>Cliente</h4>
                <div class="detail-item">
                    <span class="detail-label">Nombre:</span>
                    <span class="detail-value">${usuarioNombre}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${usuarioEmail}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Teléfono:</span>
                    <span class="detail-value">${
                      pedido.direccionEnvio?.telefono || "No disponible"
                    }</span>
                </div>
            </div>
        </div>

        <div class="detail-card" style="margin-bottom: 1.5rem;">
            <h4>Dirección de Envío</h4>
            <p>${pedido.direccionEnvio.calle}, ${
    pedido.direccionEnvio.ciudad
  }, ${pedido.direccionEnvio.estado}, ${pedido.direccionEnvio.codigoPostal}</p>
        </div>

        <div class="order-products-list">
            <h4 style="margin-bottom: 1rem;">Productos</h4>
            ${(pedido.productos || [])
              .map(
                (item) => `
                <div class="order-product-item">
                    <img src="${
                      item.imagen || "https://via.placeholder.com/80"
                    }" alt="${item.nombre || "Producto"}">
                    <div class="order-product-info">
                        <p class="order-product-name">${
                          item.nombre || "Producto"
                        }</p>
                        <p class="order-product-quantity">Cantidad: ${
                          item.cantidad || 0
                        }</p>
                    </div>
                    <p class="order-product-price">$${(
                      (item.precio || 0) * (item.cantidad || 0)
                    ).toFixed(2)}</p>
                </div>
            `
              )
              .join("")}
        </div>

        <div class="detail-card">
            <div class="detail-item">
                <span class="detail-label">Subtotal:</span>
                <span class="detail-value">$${Number(
                  pedido.subtotal || 0
                ).toFixed(2)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Impuestos:</span>
                <span class="detail-value">$${Number(
                  pedido.impuestos || 0
                ).toFixed(2)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Envío:</span>
                <span class="detail-value">$${Number(pedido.envio || 0).toFixed(
                  2
                )}</span>
            </div>
            <div class="detail-item" style="border-top: 2px solid var(--light-gray); padding-top: 0.75rem; margin-top: 0.75rem;">
                <span class="detail-label" style="font-weight: 700; font-size: 1.1rem;">Total:</span>
                <span class="detail-value" style="font-weight: 700; font-size: 1.25rem; color: var(--primary-color);">$${Number(
                  pedido.total || 0
                ).toFixed(2)}</span>
            </div>
        </div>

        <div style="margin-top: 1.5rem;">
            <label for="order-status-update" style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Estado del Pedido:</label>
            <select class="order-status-select" id="order-status-update" data-order-id="${pedidoId}">
                <option value="pendiente" ${
                  pedido.estado === "pendiente" ? "selected" : ""
                }>Pendiente</option>
                <option value="procesando" ${
                  pedido.estado === "procesando" ? "selected" : ""
                }>Procesando</option>
                <option value="enviado" ${
                  pedido.estado === "enviado" ? "selected" : ""
                }>Enviado</option>
                <option value="entregado" ${
                  pedido.estado === "entregado" ? "selected" : ""
                }>Entregado</option>
                <option value="cancelado" ${
                  pedido.estado === "cancelado" ? "selected" : ""
                }>Cancelado</option>
            </select>
        </div>

        <div style="margin-top: 1.5rem; text-align: right;">
            <button class="btn" onclick="actualizarEstadoPedido('${pedidoId}')">
                Actualizar Estado
            </button>
        </div>
    `;

  modal.classList.add("active");
}

async function actualizarEstadoPedido(id) {
  const nuevoEstado = document.getElementById("order-status-update").value;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/orders/${id}/estado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ estado: nuevoEstado }),
    });

    const data = await response.json();

    if (data.success) {
      mostrarNotificacion("Estado actualizado exitosamente", "success");
      cerrarModal("modal-pedido");
      cargarPedidos();
      if (currentSection === "dashboard") {
        cargarDashboard();
      }
    } else {
      mostrarNotificacion(
        data.message || "Error al actualizar estado",
        "error"
      );
    }
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    mostrarNotificacion("Error al actualizar estado", "error");
  }
}

async function filtrarPedidos() {
  const estado = document.getElementById("filter-estado").value;

  try {
    const token = localStorage.getItem("token");
    let url = `${API_URL}/orders?limite=100`;

    if (estado) url += `&estado=${estado}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      mostrarPedidosTabla(data.pedidos);
    }
  } catch (error) {
    console.error("Error al filtrar pedidos:", error);
  }
}

function buscarPedidos(e) {
  // Implementar búsqueda local en la tabla
  const searchTerm = e.target.value.toLowerCase();
  const rows = document.querySelectorAll("#pedidos-table-body tr");

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? "" : "none";
  });
}

// =================== USUARIOS ===================

async function cargarUsuarios() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/users?limite=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      mostrarUsuariosTabla(data.usuarios);
    }
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
    mostrarNotificacion("Error al cargar usuarios", "error");
  }
}

function mostrarUsuariosTabla(usuarios) {
  const tbody = document.getElementById("usuarios-table-body");

  if (usuarios.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="loading-cell">No hay usuarios disponibles</td></tr>';
    return;
  }

  tbody.innerHTML = usuarios
    .map((usuario) => {
      const usuarioId = usuario.id || usuario._id;
      const currentUserId = currentUser?.id || currentUser?._id;

      return `
        <tr>
            <td><strong>${usuario.nombre}</strong></td>
            <td>${usuario.email}</td>
            <td style="text-transform: capitalize;">
                <span class="badge ${
                  usuario.rol === "admin" ? "badge-destacado" : "badge-activo"
                }">
                    ${usuario.rol}
                </span>
            </td>
            <td>${new Date(usuario.createdAt).toLocaleDateString("es-ES")}</td>
            <td>
                <span class="badge ${
                  usuario.activo ? "badge-activo" : "badge-inactivo"
                }">
                    ${usuario.activo ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    ${
                      usuarioId !== currentUserId
                        ? `
                        <button class="btn-icon btn-delete" onclick="toggleEstadoUsuario('${usuarioId}', ${!usuario.activo})" 
                                title="${
                                  usuario.activo ? "Desactivar" : "Activar"
                                }">
                            <i class="fas fa-${
                              usuario.activo ? "ban" : "check"
                            }"></i>
                        </button>
                    `
                        : '<span style="color: var(--gray-color); font-size: 0.85rem;">Usuario actual</span>'
                    }
                </div>
            </td>
        </tr>
    `;
    })
    .join("");
}

async function toggleEstadoUsuario(id, nuevoEstado) {
  const accion = nuevoEstado ? "activar" : "desactivar";
  if (!confirm(`¿Estás seguro de ${accion} este usuario?`)) return;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ activo: nuevoEstado }),
    });

    const data = await response.json();

    if (data.success) {
      mostrarNotificacion(`Usuario ${accion} exitosamente`, "success");
      cargarUsuarios();
    } else {
      mostrarNotificacion(
        data.message || `Error al ${accion} usuario`,
        "error"
      );
    }
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    mostrarNotificacion("Error al actualizar usuario", "error");
  }
}

async function filtrarUsuarios() {
  const rol = document.getElementById("filter-rol").value;

  try {
    const token = localStorage.getItem("token");
    let url = `${API_URL}/users?limite=100`;

    if (rol) url += `&rol=${rol}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      mostrarUsuariosTabla(data.usuarios);
    }
  } catch (error) {
    console.error("Error al filtrar usuarios:", error);
  }
}

function buscarUsuarios(e) {
  const searchTerm = e.target.value.toLowerCase();
  const rows = document.querySelectorAll("#usuarios-table-body tr");

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? "" : "none";
  });
}

// =================== UTILIDADES ===================

function cerrarModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
  }
}

async function cerrarSesion() {
  if (!confirm("¿Estás seguro de cerrar sesión?")) return;

  try {
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  }
}

function mostrarNotificacion(mensaje, tipo = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${tipo}`;
  notification.innerHTML = `
        <i class="fas fa-${
          tipo === "success" ? "check-circle" : "exclamation-circle"
        }"></i>
        <span>${mensaje}</span>
    `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Hacer funciones globales disponibles
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.verPedido = verPedido;
window.actualizarEstadoPedido = actualizarEstadoPedido;
window.toggleEstadoUsuario = toggleEstadoUsuario;
