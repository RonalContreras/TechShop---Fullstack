import express from "express";
import {
  obtenerTodosUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
  obtenerEstadisticas,
  agregarAlCarrito,
  obtenerCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
  vaciarCarrito,
} from "../controllers/userController.js";
import { protegerRuta, esAdmin } from "../middleware/auth.js";

const router = express.Router();

// Rutas de carrito (usuario autenticado)
router.get("/carrito", protegerRuta, obtenerCarrito);
router.post("/carrito", protegerRuta, agregarAlCarrito);
router.put("/carrito/:productoId", protegerRuta, actualizarCantidadCarrito);
router.delete("/carrito/:productoId", protegerRuta, eliminarDelCarrito);
router.delete("/carrito", protegerRuta, vaciarCarrito);

// Rutas de administración
router.get("/", protegerRuta, esAdmin, obtenerTodosUsuarios);
router.get("/estadisticas", protegerRuta, esAdmin, obtenerEstadisticas);
router.get("/:id", protegerRuta, esAdmin, obtenerUsuarioPorId);
router.put("/:id", protegerRuta, esAdmin, actualizarUsuario);
router.delete("/:id", protegerRuta, esAdmin, eliminarUsuario);

export default router;
