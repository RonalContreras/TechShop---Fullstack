import express from "express";
import { body } from "express-validator";
import {
  registrarUsuario,
  iniciarSesion,
  cerrarSesion,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
} from "../controllers/authController.js";
import { protegerRuta } from "../middleware/auth.js";

const router = express.Router();

// Validaciones para registro
const validacionesRegistro = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es obligatorio")
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres"),
];

// Validaciones para login
const validacionesLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es obligatorio")
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("La contraseña es obligatoria"),
];

// Rutas públicas
router.post("/registro", validacionesRegistro, registrarUsuario);
router.post("/login", validacionesLogin, iniciarSesion);
router.post("/logout", cerrarSesion);

// Rutas protegidas
router.get("/perfil", protegerRuta, obtenerPerfil);
router.put("/perfil", protegerRuta, actualizarPerfil);
router.put("/cambiar-password", protegerRuta, cambiarPassword);

export default router;
