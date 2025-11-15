import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verificar si el usuario está autenticado
export const protegerRuta = async (req, res, next) => {
  try {
    let token;

    // Obtener token del header Authorization o de las cookies
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No autorizado. Por favor inicie sesión",
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obtener usuario del token
    req.usuario = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    if (!req.usuario.activo) {
      return res.status(401).json({
        success: false,
        message: "Cuenta de usuario desactivada",
      });
    }

    next();
  } catch (error) {
    console.error("Error en autenticación:", error);
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
};

// Verificar si el usuario es administrador
export const esAdmin = (req, res, next) => {
  if (req.usuario && req.usuario.rol === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Se requieren permisos de administrador",
    });
  }
};

// Generar JWT
export const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};
