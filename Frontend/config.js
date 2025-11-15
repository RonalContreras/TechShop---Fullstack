// Configuración de la API
// Cambiar según el entorno (desarrollo o producción)

const API_CONFIG = {
  // Para desarrollo local
  API_URL: "http://localhost:5000/api",

  // Para producción (descomentar y actualizar con la URL real del backend desplegado)
  // API_URL: 'https://tu-backend-desplegado.com/api',

  // Timeout para las peticiones (en milisegundos)
  TIMEOUT: 10000,

  // Habilitar logs de consola para debug
  DEBUG: true,
};

// Hacer disponible globalmente
window.API_CONFIG = API_CONFIG;

// Función auxiliar para logs en desarrollo
window.logDebug = (mensaje, data) => {
  if (API_CONFIG.DEBUG) {
    console.log(`[TechShop] ${mensaje}`, data || "");
  }
};
