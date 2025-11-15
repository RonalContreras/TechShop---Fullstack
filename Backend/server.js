import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/database.js";

// Importar modelos con relaciones
// import "./models/index.js";

// Importar rutas
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import userRoutes from "./routes/users.js";

// Configuración de variables de entorno
dotenv.config();

// Crear instancia de Express
const app = express();

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(
  cors({
    // origin: "*", // Permitir todos los orígenes en desarrollo
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:5500",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rutas principales
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({
    message: "TechShop API - Servidor funcionando correctamente",
    version: "1.0.0",
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  });
});

// Puerto del servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Entorno: ${process.env.NODE_ENV || "development"}`);
});
