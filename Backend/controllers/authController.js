import { validationResult } from "express-validator";
import { User } from "../models/index.js";
import { generarToken } from "../middleware/auth.js";

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/registro
// @access  Público
export const registrarUsuario = async (req, res) => {
  try {
    // Validar datos
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Errores de validación",
        errores: errores.array(),
      });
    }

    const { nombre, email, password } = req.body;

    // Verificar si el usuario ya existe - ✅ CORREGIDO para Sequelize
    const usuarioExiste = await User.findOne({ where: { email } });
    if (usuarioExiste) {
      return res.status(400).json({
        success: false,
        message: "El email ya está registrado",
      });
    }

    // Crear usuario - ✅ CORREGIDO para Sequelize
    const usuario = await User.create({
      nombre,
      email,
      password,
    });

    // Generar token
    const token = generarToken(usuario.id); // ✅ Usar 'id' en lugar de '_id'

    // Configurar cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    });

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      token,
      usuario: usuario.obtenerPerfilPublico
        ? usuario.obtenerPerfilPublico()
        : {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
          },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      error: error.message,
    });
  }
};

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Público
export const iniciarSesion = async (req, res) => {
  try {
    // Validar datos
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Errores de validación",
        errores: errores.array(),
      });
    }

    const { email, password } = req.body;

    // Buscar usuario por email - ✅ CORREGIDO para Sequelize
    const usuario = await User.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    // Verificar contraseña - Asegúrate que tu modelo User tenga compararPassword
    const passwordCoincide = usuario.compararPassword
      ? await usuario.compararPassword(password)
      : usuario.password === password; // Fallback simple

    if (!passwordCoincide) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    // Verificar si la cuenta está activa
    if (usuario.activo === false) {
      return res.status(401).json({
        success: false,
        message: "Cuenta desactivada. Contacte al administrador",
      });
    }

    // Generar token
    const token = generarToken(usuario.id); // ✅ Usar 'id' en lugar de '_id'

    // Configurar cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Sesión iniciada exitosamente",
      token,
      usuario: usuario.obtenerPerfilPublico
        ? usuario.obtenerPerfilPublico()
        : {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
          },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error al iniciar sesión",
      error: error.message,
    });
  }
};

// @desc    Cerrar sesión
// @route   POST /api/auth/logout
// @access  Público
export const cerrarSesion = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({
    success: true,
    message: "Sesión cerrada exitosamente",
  });
};

// @desc    Obtener perfil del usuario actual
// @route   GET /api/auth/perfil
// @access  Privado
export const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.usuario.id); // ✅ CORREGIDO para Sequelize

    res.json({
      success: true,
      usuario: usuario.obtenerPerfilPublico
        ? usuario.obtenerPerfilPublico()
        : {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            telefono: usuario.telefono,
            direccion: usuario.direccion,
          },
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener perfil",
      error: error.message,
    });
  }
};

// @desc    Actualizar perfil
// @route   PUT /api/auth/perfil
// @access  Privado
export const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, telefono, direccion } = req.body;

    const usuario = await User.findByPk(req.usuario.id); // ✅ CORREGIDO para Sequelize

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Actualizar campos
    if (nombre) usuario.nombre = nombre;
    if (telefono) usuario.telefono = telefono;
    if (direccion) usuario.direccion = { ...usuario.direccion, ...direccion };

    await usuario.save();

    res.json({
      success: true,
      message: "Perfil actualizado exitosamente",
      usuario: usuario.obtenerPerfilPublico
        ? usuario.obtenerPerfilPublico()
        : {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            telefono: usuario.telefono,
            direccion: usuario.direccion,
          },
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar perfil",
      error: error.message,
    });
  }
};

// @desc    Cambiar contraseña
// @route   PUT /api/auth/cambiar-password
// @access  Privado
export const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({
        success: false,
        message: "Se requiere la contraseña actual y la nueva",
      });
    }

    if (passwordNuevo.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    const usuario = await User.findByPk(req.usuario.id); // ✅ CORREGIDO para Sequelize

    // Verificar contraseña actual
    const passwordCoincide = usuario.compararPassword
      ? await usuario.compararPassword(passwordActual)
      : usuario.password === passwordActual; // Fallback simple

    if (!passwordCoincide) {
      return res.status(401).json({
        success: false,
        message: "Contraseña actual incorrecta",
      });
    }

    // Actualizar contraseña
    usuario.password = passwordNuevo;
    await usuario.save();

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar contraseña",
      error: error.message,
    });
  }
};
