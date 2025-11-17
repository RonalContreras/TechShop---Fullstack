// Configuración de la API

const API_CONFIG = {
  API_URL: "https://techshop-fullstack-production.up.railway.app",

  // Timeout para las peticiones (en milisegundos)
  TIMEOUT: 10000,

  // Habilitar logs de consola para debug
  DEBUG: false,
};

// Hacer disponible globalmente
window.API_CONFIG = API_CONFIG;

// Función auxiliar para logs en desarrollo
window.logDebug = (mensaje, data) => {
  if (API_CONFIG.DEBUG) {
    console.log(`[TechShop] ${mensaje}`, data || "");
  }
};
