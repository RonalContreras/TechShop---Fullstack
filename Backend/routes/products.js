import express from "express";
import { body } from "express-validator";
import {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerProductosDestacados,
  buscarProductos,
  obtenerProductosPorCategoria,
} from "../controllers/productController.js";
import { protegerRuta, esAdmin } from "../middleware/auth.js";

const router = express.Router();

// Validaciones para producto
const validacionesProducto = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ max: 100 })
    .withMessage("El nombre no puede exceder 100 caracteres"),
  body("descripcion")
    .trim()
    .notEmpty()
    .withMessage("La descripción es obligatoria")
    .isLength({ max: 500 })
    .withMessage("La descripción no puede exceder 500 caracteres"),
  body("precio")
    .notEmpty()
    .withMessage("El precio es obligatorio")
    .isNumeric()
    .withMessage("El precio debe ser un número")
    .custom((value) => value >= 0)
    .withMessage("El precio no puede ser negativo"),
  body("categoria")
    .notEmpty()
    .withMessage("La categoría es obligatoria")
    .isIn(["smartphones", "laptops", "tablets", "accesorios", "wearables"])
    .withMessage("Categoría inválida"),
  body("imagen")
    .optional()
    .trim()
    .isURL()
    .withMessage("La imagen debe ser una URL válida"),
  body("stock")
    .optional()
    .isNumeric()
    .withMessage("El stock debe ser un número")
    .custom((value) => value >= 0)
    .withMessage("El stock no puede ser negativo"),
];

// Rutas públicas
router.get("/", obtenerProductos);
router.get("/destacados", obtenerProductosDestacados);
router.get("/buscar", buscarProductos);
router.get("/categoria/:categoria", obtenerProductosPorCategoria);
router.get("/:id", obtenerProductoPorId);

// Rutas protegidas (solo administradores)
router.post("/", protegerRuta, esAdmin, validacionesProducto, crearProducto);
router.put(
  "/:id",
  protegerRuta,
  esAdmin,
  validacionesProducto,
  actualizarProducto
);
router.delete("/:id", protegerRuta, esAdmin, eliminarProducto);

export default router;
