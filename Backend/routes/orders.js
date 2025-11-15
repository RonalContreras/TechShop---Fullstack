import express from "express";
import { body } from "express-validator";
import {
  crearPedido,
  obtenerMisPedidos,
  obtenerPedidoPorId,
  obtenerTodosPedidos,
  actualizarEstadoPedido,
  cancelarPedido,
} from "../controllers/orderController.js";
import { protegerRuta, esAdmin } from "../middleware/auth.js";

const router = express.Router();

// Validaciones para crear pedido
const validacionesPedido = [
  body("productos")
    .isArray({ min: 1 })
    .withMessage("Debe incluir al menos un producto"),
  body("productos.*.producto")
    .notEmpty()
    .withMessage("ID de producto es obligatorio"),
  body("productos.*.cantidad")
    .isInt({ min: 1 })
    .withMessage("La cantidad debe ser al menos 1"),
  body("direccionEnvio.nombreCompleto")
    .trim()
    .notEmpty()
    .withMessage("El nombre completo es obligatorio"),
  body("direccionEnvio.calle")
    .trim()
    .notEmpty()
    .withMessage("La calle es obligatoria"),
  body("direccionEnvio.ciudad")
    .trim()
    .notEmpty()
    .withMessage("La ciudad es obligatoria"),
  body("direccionEnvio.estado")
    .trim()
    .notEmpty()
    .withMessage("El estado es obligatorio"),
  body("direccionEnvio.codigoPostal")
    .trim()
    .notEmpty()
    .withMessage("El código postal es obligatorio"),
  body("direccionEnvio.telefono")
    .trim()
    .notEmpty()
    .withMessage("El teléfono es obligatorio"),
];

// Rutas protegidas (requieren autenticación)
router.post("/", protegerRuta, validacionesPedido, crearPedido);
router.get("/mis-pedidos", protegerRuta, obtenerMisPedidos);
router.get("/:id", protegerRuta, obtenerPedidoPorId);
router.put("/:id/cancelar", protegerRuta, cancelarPedido);

// Rutas de administrador
router.get("/", protegerRuta, esAdmin, obtenerTodosPedidos);
router.put("/:id/estado", protegerRuta, esAdmin, actualizarEstadoPedido);

export default router;
