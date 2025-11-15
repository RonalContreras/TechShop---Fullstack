// Variables globales
let cart = [];
let products = [];
let currentUser = null;
const API_URL = window.API_CONFIG?.API_URL || "http://localhost:5000/api";

const storedUser = localStorage.getItem("user");
if (storedUser) {
  currentUser = JSON.parse(storedUser);
  window.currentUser = currentUser;
}

// DOM Elements
const productsContainer = document.getElementById("products-container");
const cartCount = document.querySelector(".cart-count");
const cartIcon = document.querySelector(".cart-icon");
const cartModal = document.querySelector(".cart-modal");
const closeCart = document.querySelector(".close-cart");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".total-price");
const emptyCartBtn = document.querySelector(".btn-empty");
const checkoutBtn = document.querySelector(".btn-checkout");
const filterBtns = document.querySelectorAll(".filter-btn");
const categoryCards = document.querySelectorAll(".category-card");
const productModal = document.querySelector(".product-modal");
const productModalBody = document.querySelector(".product-modal-body");
const closeProductModal = document.querySelector(".close-product-modal");
const hamburgerMenu = document.querySelector(".hamburger-menu");
const navbar = document.querySelector(".navbar");

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  verificarSesion();
  loadProducts();
  setupEventListeners();
  updateCartCount();
  configurarBotonLogin();
});

// Verificar si hay sesión activa
async function verificarSesion() {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  if (token && userData) {
    try {
      currentUser = JSON.parse(userData);
      actualizarUIUsuario(true);
      await sincronizarCarritoConServidor();
    } catch (error) {
      console.error("Error al cargar sesión:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      currentUser = null;
    }
  }
}

// Actualizar UI según estado de autenticación
function actualizarUIUsuario(estaLogueado) {
  const btnLogin = document.getElementById("btn-iniciar-sesion");

  if (!btnLogin) return;

  if (estaLogueado && window.currentUser) {
    // Usuario logueado - cambiar botón
    btnLogin.innerHTML = `<i class="fas fa-user"></i> ${window.currentUser.nombre}`;
    btnLogin.style.backgroundColor = "var(--primary-color)";
    btnLogin.style.color = "white";
    btnLogin.style.border = "none";

    // Remover event listener anterior
    const newBtn = btnLogin.cloneNode(true);
    btnLogin.parentNode.replaceChild(newBtn, btnLogin);

    // Agregar nuevo event listener
    newBtn.addEventListener("click", mostrarMenuUsuario);
  } else {
    // Usuario NO logueado
    btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
    btnLogin.style.backgroundColor = "";
    btnLogin.style.color = "";
    btnLogin.style.border = "";

    // Remover event listener anterior
    const newBtn = btnLogin.cloneNode(true);
    btnLogin.parentNode.replaceChild(newBtn, btnLogin);

    // Agregar nuevo event listener
    newBtn.addEventListener("click", () => {
      if (typeof window.abrirModalAuth === "function") {
        window.abrirModalAuth("login");
      }
    });
  }
}

function mostrarMenuUsuario() {
  const menuId = "user-dropdown-menu";

  // Remover menú existente si hay
  const menuExistente = document.getElementById(menuId);
  if (menuExistente) {
    menuExistente.remove();
    return;
  }

  const esAdmin = window.currentUser && window.currentUser.rol === "admin";

  const menu = document.createElement("div");
  menu.id = menuId;
  menu.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    background: white;
    padding: 0.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2000;
    min-width: 200px;
  `;

  menu.innerHTML = `
    ${
      esAdmin
        ? `
      <button onclick="window.location.href='admin.html'" class="btn" style="width: 100%; margin-bottom: 0.5rem; justify-content: flex-start;">
        <i class="fas fa-cog"></i> Panel Admin
      </button>
    `
        : ""
    }
    <button onclick="cerrarSesion()" class="btn" style="width: 100%; background-color: var(--accent-color); justify-content: flex-start;">
      <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
    </button>
  `;

  document.body.appendChild(menu);

  // Cerrar al hacer clic fuera
  setTimeout(() => {
    document.addEventListener("click", function cerrarMenu(e) {
      const menu = document.getElementById(menuId);
      if (
        menu &&
        !menu.contains(e.target) &&
        !e.target.closest("#btn-iniciar-sesion")
      ) {
        menu.remove();
        document.removeEventListener("click", cerrarMenu);
      }
    });
  }, 100);
}

function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  currentUser = null;
  cart = [];
  updateCart();
  actualizarUIUsuario(false);
  showMessage("Sesión cerrada exitosamente", "success");

  // Remover menú
  const menu = document.querySelector('[style*="position: fixed"]');
  if (menu) menu.remove();
}

function configurarBotonLogin() {
  const btnLogin = document.getElementById("btn-iniciar-sesion");
  if (btnLogin && !currentUser) {
    btnLogin.addEventListener("click", () => {
      if (typeof window.abrirModalAuth === "function") {
        window.abrirModalAuth("login");
      }
    });
  }
}

// Cargar productos desde la API
async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();

    if (data.success && data.productos) {
      products = data.productos;
    } else {
      products = window.productos ? [...window.productos] : [];
    }
  } catch (error) {
    console.error("Error al cargar productos:", error);
    products = window.productos ? [...window.productos] : [];
  }

  displayProducts(products);
  displayFeaturedProducts();
}

// Mostrar productos en el grid
function displayProducts(productsToDisplay) {
  productsContainer.innerHTML = "";

  if (productsToDisplay.length === 0) {
    productsContainer.innerHTML =
      '<p class="no-products">No se encontraron productos.</p>';
    return;
  }

  productsToDisplay.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    const precio = Number(product.precio) || 0;

    productCard.innerHTML = `
      ${product.destacado ? '<span class="product-badge">Destacado</span>' : ""}
      <img src="${product.imagen}" alt="${
      product.nombre
    }" class="product-image">
      <div class="product-info">
        <h3 class="product-title">${product.nombre}</h3>
        <p class="product-description">${product.descripcion}</p>
        <p class="product-price">$${precio.toFixed(2)}</p>
        <div class="product-actions">
          <button class="btn btn-view" data-id="${
            product.id
          }">Ver detalles</button>
          <button class="btn btn-add" data-id="${product.id}">Añadir</button>
        </div>
      </div>
    `;
    productsContainer.appendChild(productCard);
  });

  document.querySelectorAll(".btn-add").forEach((btn) => {
    btn.addEventListener("click", addToCart);
  });

  document.querySelectorAll(".btn-view").forEach((btn) => {
    btn.addEventListener("click", showProductDetails);
  });
}

// Mostrar productos destacados
function displayFeaturedProducts() {
  const featuredContainer = document.querySelector(".featured-products");
  const featuredProducts = products.filter((product) => product.destacado);

  featuredContainer.innerHTML = "";

  featuredProducts.forEach((product) => {
    const featuredProduct = document.createElement("div");
    featuredProduct.className = "featured-product";
    const precio = Number(product.precio) || 0;

    featuredProduct.innerHTML = `
      <img src="${product.imagen}" alt="${
      product.nombre
    }" class="featured-product-image">
      <div class="featured-product-info">
        <h3 class="featured-product-title">${product.nombre}</h3>
        <p class="product-description">${product.descripcion}</p>
        <p class="featured-product-price">$${precio.toFixed(2)}</p>
        <div class="product-actions">
          <button class="btn btn-add" data-id="${product.id}">Añadir</button>
        </div>
      </div>
    `;
    featuredContainer.appendChild(featuredProduct);
  });

  document.querySelectorAll(".featured-product .btn-add").forEach((btn) => {
    btn.addEventListener("click", addToCart);
  });
}

// Agregar al carrito
async function addToCart(e) {
  e.preventDefault();

  const productId = e.target.getAttribute("data-id");
  const product = products.find(
    (p) => p.id.toString() === productId.toString()
  );

  if (!product) return;

  if (currentUser) {
    // Usuario autenticado - guardar en servidor
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/users/carrito`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productoId: product.id,
          cantidad: 1,
        }),
      });
      await sincronizarCarritoConServidor();
    } catch (error) {
      console.error("Error:", error);
    }
  } else {
    // Usuario NO autenticado - carrito local
    const existingItem = cart.find(
      (item) => item.id.toString() === productId.toString()
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        nombre: product.nombre,
        precio: Number(product.precio),
        imagen: product.imagen,
        quantity: 1,
      });
    }

    updateCart();
  }

  showAddedToCartMessage(product.nombre);
}

// Sincronizar carrito con servidor
async function sincronizarCarritoConServidor() {
  if (!currentUser) return;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/users/carrito`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.carrito.items) {
        cart = data.carrito.items.map((item) => ({
          id: item.producto.id,
          nombre: item.producto.nombre,
          precio: Number(item.producto.precio),
          imagen: item.producto.imagen,
          quantity: item.cantidad,
        }));
        updateCart();
      }
    }
  } catch (error) {
    console.error("Error al sincronizar:", error);
  }
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id.toString() !== productId.toString());
  updateCart();
}

function updateCart() {
  updateCartCount();
  renderCartItems();
  if (!currentUser) {
    saveCartToLocalStorage();
  }
}

function updateCartCount() {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount.textContent = totalItems;
}

function renderCartItems() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML =
      '<p class="empty-cart-message">Tu carrito está vacío</p>';
    cartTotal.textContent = "$0.00";
    return;
  }

  cart.forEach((item) => {
    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    const precio = Number(item.precio) || 0;

    cartItem.innerHTML = `
      <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-image">
      <div class="cart-item-details">
        <h4 class="cart-item-title">${item.nombre}</h4>
        <p class="cart-item-price">$${precio.toFixed(2)}</p>
        <div class="cart-item-actions">
          <div class="cart-item-quantity">
            <button class="decrement" data-id="${item.id}">-</button>
            <span>${item.quantity}</span>
            <button class="increment" data-id="${item.id}">+</button>
          </div>
          <span class="remove-item" data-id="${item.id}">Eliminar</span>
        </div>
      </div>
    `;
    cartItems.appendChild(cartItem);
  });

  const total = cart.reduce(
    (sum, item) => sum + Number(item.precio) * item.quantity,
    0
  );
  cartTotal.textContent = `$${total.toFixed(2)}`;

  document.querySelectorAll(".increment").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = e.target.getAttribute("data-id");
      const item = cart.find(
        (item) => item.id.toString() === productId.toString()
      );
      if (item) {
        item.quantity += 1;
        updateCart();
      }
    });
  });

  document.querySelectorAll(".decrement").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = e.target.getAttribute("data-id");
      const item = cart.find(
        (item) => item.id.toString() === productId.toString()
      );
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        updateCart();
      } else {
        removeFromCart(productId);
      }
    });
  });

  document.querySelectorAll(".remove-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = e.target.getAttribute("data-id");
      removeFromCart(productId);
    });
  });
}

function toggleCart() {
  cartModal.classList.toggle("active");
}

function emptyCart() {
  cart = [];
  updateCart();
  toggleCart();
}

async function checkout() {
  if (cart.length === 0) {
    showMessage("Tu carrito está vacío", "warning");
    return;
  }

  if (!window.currentUser) {
    showMessage("Debes iniciar sesión para comprar", "warning");
    toggleCart();
    setTimeout(() => window.abrirModalAuth("login"), 500);
    return;
  }

  // Mostrar modal de dirección
  mostrarModalDireccion();
}

function mostrarModalDireccion() {
  // Crear modal si no existe
  let modal = document.getElementById("modal-checkout");

  if (!modal) {
    const subtotal = cart.reduce(
      (sum, item) => sum + Number(item.precio) * item.quantity,
      0
    );
    const impuestos = subtotal * 0.16;
    const envio = subtotal >= 1000 ? 0 : 99;
    const total = subtotal + impuestos + envio;

    modal = document.createElement("div");
    modal.id = "modal-checkout";
    modal.className = "auth-modal active";
    modal.innerHTML = `
      <div class="auth-modal-content" style="max-width: 600px;">
        <button class="auth-modal-close" onclick="cerrarModalCheckout()">&times;</button>
        <div class="auth-modal-header">
          <h2>Datos de Envío</h2>
          <p>Completa la información para tu pedido</p>
        </div>
        <form id="form-checkout" class="auth-form">
          <div class="form-group">
            <label>Nombre Completo *</label>
            <input type="text" id="checkout-nombre" required value="${
              window.currentUser.nombre
            }">
          </div>
          
          <div class="form-group">
            <label>Teléfono *</label>
            <input type="tel" id="checkout-telefono" required placeholder="3001234567">
          </div>
          
          <div class="form-group">
            <label>Dirección *</label>
            <input type="text" id="checkout-direccion" required placeholder="Calle 123 #45-67">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label>Ciudad *</label>
              <input type="text" id="checkout-ciudad" required placeholder="Bogotá">
            </div>
            
            <div class="form-group">
              <label>Código Postal *</label>
              <input type="text" id="checkout-cp" required placeholder="110111">
            </div>
          </div>
          
          <div class="form-group">
            <label>Método de Pago</label>
            <select id="checkout-pago" style="width: 100%; padding: 0.75rem; border: 1px solid var(--light-gray); border-radius: var(--border-radius);">
              <option value="tarjeta">Tarjeta de Crédito/Débito</option>
              <option value="efectivo">Efectivo contra entrega</option>
              <option value="transferencia">Transferencia Bancaria</option>
            </select>
          </div>
          
          <div style="background: var(--light-color); padding: 1rem; border-radius: var(--border-radius); margin: 1rem 0;">
            <h4 style="margin-bottom: 0.5rem;">Resumen de Compra</h4>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span>Subtotal:</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span>Impuestos (16%):</span>
              <span>$${impuestos.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Envío:</span>
              <span>${envio === 0 ? "GRATIS" : "$" + envio.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.2rem; color: var(--primary-color); padding-top: 0.5rem; border-top: 2px solid var(--light-gray);">
              <span>Total:</span>
              <span>$${total.toFixed(2)}</span>
            </div>
          </div>
          
          <button type="submit" class="btn btn-auth-submit">Confirmar Pedido</button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listener para el formulario
    document
      .getElementById("form-checkout")
      .addEventListener("submit", procesarPedido);
  } else {
    modal.classList.add("active");
  }

  // Cerrar carrito
  toggleCart();
}

function cerrarModalCheckout() {
  const modal = document.getElementById("modal-checkout");
  if (modal) {
    modal.classList.remove("active");
  }
}

async function procesarPedido(e) {
  e.preventDefault();

  const direccionEnvio = {
    nombreCompleto: document.getElementById("checkout-nombre").value,
    calle: document.getElementById("checkout-direccion").value,
    ciudad: document.getElementById("checkout-ciudad").value,
    estado: "Colombia",
    codigoPostal: document.getElementById("checkout-cp").value,
    telefono: document.getElementById("checkout-telefono").value,
    pais: "Colombia",
  };

  const metodoPago = document.getElementById("checkout-pago").value;

  const productos = cart.map((item) => ({
    producto: item.id,
    cantidad: item.quantity,
  }));

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productos,
        direccionEnvio,
        metodoPago,
      }),
    });

    const data = await response.json();

    if (data.success) {
      cart = [];
      updateCart();
      cerrarModalCheckout();
      showMessage(
        "¡Compra realizada con éxito! Tu pedido está siendo procesado.",
        "success"
      );
      if (window.currentUser) {
        await fetch(`${API_URL}/users/carrito`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } else {
      showMessage(data.message || "Error al procesar la compra", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showMessage("Error al procesar la compra", "error");
  }
}

// Exponer funciones
window.mostrarModalDireccion = mostrarModalDireccion;
window.cerrarModalCheckout = cerrarModalCheckout;

// Event listeners
function setupEventListeners() {
  cartIcon.addEventListener("click", toggleCart);
  closeCart.addEventListener("click", toggleCart);
  emptyCartBtn.addEventListener("click", emptyCart);
  checkoutBtn.addEventListener("click", checkout);

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", filterProducts);
  });

  categoryCards.forEach((card) => {
    card.addEventListener("click", filterByCategory);
  });

  closeProductModal.addEventListener("click", () => {
    productModal.classList.remove("active");
  });

  hamburgerMenu.addEventListener("click", toggleMobileMenu);

  const searchInput = document.querySelector(".search-box input");
  if (searchInput) {
    searchInput.addEventListener("input", searchProducts);
  }

  window.addEventListener("click", (e) => {
    if (e.target === productModal) {
      productModal.classList.remove("active");
    }
    if (e.target === cartModal) {
      cartModal.classList.remove("active");
    }
  });
}

function searchProducts(e) {
  const searchTerm = e.target.value.toLowerCase().trim();

  if (searchTerm === "") {
    displayProducts(products);
    return;
  }

  const filteredProducts = products.filter(
    (product) =>
      product.nombre.toLowerCase().includes(searchTerm) ||
      product.descripcion.toLowerCase().includes(searchTerm)
  );

  displayProducts(filteredProducts);
}

function filterProducts(e) {
  const filter = e.target.getAttribute("data-filter");

  filterBtns.forEach((btn) => {
    btn.classList.remove("active");
  });
  e.target.classList.add("active");

  let filteredProducts = [];

  if (filter === "all") {
    filteredProducts = products;
  } else if (filter === "destacado") {
    filteredProducts = products.filter((product) => product.destacado);
  } else {
    filteredProducts = products.filter(
      (product) => product.categoria === filter
    );
  }

  displayProducts(filteredProducts);
}

function filterByCategory(e) {
  const category = e.currentTarget.getAttribute("data-category");

  filterBtns.forEach((btn) => {
    btn.classList.remove("active");
  });

  document
    .querySelector(`.filter-btn[data-filter="${category}"]`)
    .classList.add("active");

  const filteredProducts = products.filter(
    (product) => product.categoria === category
  );
  displayProducts(filteredProducts);

  document.getElementById("productos").scrollIntoView({ behavior: "smooth" });
}

function showProductDetails(e) {
  const productId = e.target.getAttribute("data-id");
  const product = products.find(
    (p) => p.id.toString() === productId.toString()
  );

  if (!product) return;

  const precio = Number(product.precio) || 0;

  productModalBody.innerHTML = `
    <div class="product-details">
      <div class="product-details-image">
        <img src="${product.imagen}" alt="${product.nombre}">
      </div>
      <div class="product-details-info">
        <h2>${product.nombre}</h2>
        <p class="product-details-price">$${precio.toFixed(2)}</p>
        <p class="product-details-description">${product.descripcion}</p>
        <div class="product-details-actions">
          <button class="btn btn-add-to-cart" data-id="${
            product.id
          }">Añadir al carrito</button>
        </div>
      </div>
    </div>
  `;

  document
    .querySelector(".btn-add-to-cart")
    .addEventListener("click", addToCart);
  productModal.classList.add("active");
}

function showAddedToCartMessage(productName) {
  const message = document.createElement("div");
  message.className = "notification added-to-cart";
  message.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <span>${productName} añadido al carrito</span>
  `;
  document.body.appendChild(message);

  setTimeout(() => message.classList.add("show"), 10);

  setTimeout(() => {
    message.classList.remove("show");
    setTimeout(() => message.remove(), 300);
  }, 3000);
}

function showMessage(text, type) {
  const message = document.createElement("div");
  message.className = `notification ${type}`;
  message.innerHTML = `
    <i class="fas ${
      type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
    }"></i>
    <span>${text}</span>
  `;
  document.body.appendChild(message);

  setTimeout(() => message.classList.add("show"), 10);

  setTimeout(() => {
    message.classList.remove("show");
    setTimeout(() => message.remove(), 300);
  }, 3000);
}

function toggleMobileMenu() {
  navbar.classList.toggle("active");
  hamburgerMenu.classList.toggle("active");
}

function saveCartToLocalStorage() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
  if (!currentUser) {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      cart = JSON.parse(savedCart);
      updateCart();
    }
  }
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href");
    const targetSection = document.querySelector(targetId);

    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth" });
    }
  });
});

loadCartFromLocalStorage();

// Exponer funciones globalmente
window.actualizarUIUsuario = actualizarUIUsuario;
window.sincronizarCarritoConServidor = sincronizarCarritoConServidor;
window.showMessage = showMessage;
window.cerrarSesion = cerrarSesion;
window.mostrarMenuUsuario = mostrarMenuUsuario;
window.mostrarModalDireccion = mostrarModalDireccion;
window.cerrarModalCheckout = cerrarModalCheckout;
