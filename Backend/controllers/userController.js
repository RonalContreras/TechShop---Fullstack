import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import { sequelize } from "../config/database.js";
import { Op } from "sequelize";

// @desc    Obtener todos los usuarios
// @route   GET /api/users
// @access  Privado/Admin
export const obtenerTodosUsuarios = async (req, res) => {
  try {
    const { rol, activo, limite = 50, pagina = 1 } = req.query;

    const where = {};
    if (rol) where.rol = rol;
    if (activo !== undefined) where.activo = activo === "true";

    const offset = (Number(pagina) - 1) * Number(limite);

    const { count, rows: usuarios } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit: Number(limite),
      offset,
    });

    res.json({
      success: true,
      count: usuarios.length,
      total: count,
      pagina: Number(pagina),
      paginas: Math.ceil(count / Number(limite)),
      usuarios,
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios",
      error: error.message,
    });
  }
};

// @desc    Obtener usuario por ID
// @route   GET /api/users/:id
// @access  Privado/Admin
export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Obtener pedidos del usuario
    const pedidos = await Order.findAll({
      where: { userId: usuario.id },
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    res.json({
      success: true,
      usuario,
      pedidos,
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuario",
      error: error.message,
    });
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/users/:id
// @access  Privado/Admin
export const actualizarUsuario = async (req, res) => {
  try {
    const { nombre, email, rol, activo, telefono, direccion } = req.body;

    const usuario = await User.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Verificar si el email ya existe (si se está cambiando)
    if (email && email !== usuario.email) {
      const emailExiste = await User.findOne({ where: { email } });
      if (emailExiste) {
        return res.status(400).json({
          success: false,
          message: "El email ya está en uso",
        });
      }
    }

    // Actualizar campos
    if (nombre) usuario.nombre = nombre;
    if (email) usuario.email = email;
    if (rol) usuario.rol = rol;
    if (activo !== undefined) usuario.activo = activo;
    if (telefono) usuario.telefono = telefono;
    if (direccion) usuario.direccion = { ...usuario.direccion, ...direccion };

    await usuario.save();

    res.json({
      success: true,
      message: "Usuario actualizado exitosamente",
      usuario: usuario.obtenerPerfilPublico(),
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar usuario",
      error: error.message,
    });
  }
};

// @desc    Eliminar usuario (soft delete)
// @route   DELETE /api/users/:id
// @access  Privado/Admin
export const eliminarUsuario = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // No permitir eliminar al propio administrador
    if (usuario.id === req.usuario.id) {
      return res.status(400).json({
        success: false,
        message: "No puedes eliminarte a ti mismo",
      });
    }

    await usuario.update({ activo: false });

    res.json({
      success: true,
      message: "Usuario desactivado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar usuario",
      error: error.message,
    });
  }
};

// @desc    Obtener estadísticas generales
// @route   GET /api/users/estadisticas
// @access  Privado/Admin
export const obtenerEstadisticas = async (req, res) => {
  try {
    console.log("📊 Obteniendo estadísticas...");

    // Contar usuarios activos
    const totalUsuarios = await User.count({
      where: { activo: true },
    });

    // Contar productos activos
    const totalProductos = await Product.count({
      where: { activo: true },
    });

    // Contar total de pedidos
    const totalPedidos = await Order.count();

    // Sumar ventas totales (excluyendo cancelados)
    const ventasTotales =
      (await Order.sum("total", {
        where: {
          estado: {
            [Op.notIn]: ["cancelado"],
          },
        },
      })) || 0;

    console.log("✅ Estadísticas básicas:", {
      totalUsuarios,
      totalProductos,
      totalPedidos,
      ventasTotales,
    });

    // Pedidos por estado
    const pedidosPorEstado = await Order.findAll({
      attributes: [
        "estado",
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      ],
      group: ["estado"],
      raw: true,
    });

    console.log("✅ Pedidos por estado:", pedidosPorEstado);

    // Obtener todos los pedidos no cancelados para calcular productos más vendidos
    const todosLosPedidos = await Order.findAll({
      where: {
        estado: {
          [Op.notIn]: ["cancelado"],
        },
      },
      attributes: ["productos"],
      raw: true,
    });

    console.log("📦 Total de pedidos para análisis:", todosLosPedidos.length);

    // Procesar productos más vendidos
    const productosVendidosMap = {};

    todosLosPedidos.forEach((pedido) => {
      // Los productos están almacenados como JSONB
      const productos = pedido.productos;

      if (productos && Array.isArray(productos)) {
        productos.forEach((item) => {
          const productoId = item.producto;
          const productoNombre = item.nombre;

          if (!productosVendidosMap[productoId]) {
            productosVendidosMap[productoId] = {
              _id: productoId,
              nombre: productoNombre,
              totalVendido: 0,
              ingresos: 0,
            };
          }

          productosVendidosMap[productoId].totalVendido += item.cantidad;
          productosVendidosMap[productoId].ingresos +=
            Number(item.precio) * item.cantidad;
        });
      }
    });

    // Convertir a array y ordenar
    const productosMasVendidos = Object.values(productosVendidosMap)
      .sort((a, b) => b.totalVendido - a.totalVendido)
      .slice(0, 5);

    console.log("✅ Productos más vendidos:", productosMasVendidos);

    // Formatear pedidos por estado para el frontend
    const pedidosPorEstadoFormateado = pedidosPorEstado.map((p) => ({
      _id: p.estado,
      cantidad: parseInt(p.cantidad),
    }));

    const respuesta = {
      success: true,
      estadisticas: {
        totalUsuarios,
        totalProductos,
        totalPedidos,
        ventasTotales: Number(ventasTotales),
        pedidosPorEstado: pedidosPorEstadoFormateado,
        productosMasVendidos,
      },
    };

    console.log("✅ Respuesta final:", JSON.stringify(respuesta, null, 2));

    res.json(respuesta);
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    console.error("❌ Stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message,
    });
  }
};

// ============= FUNCIONES DE CARRITO =============

// @desc    Agregar producto al carrito
// @route   POST /api/users/carrito
// @access  Privado
export const agregarAlCarrito = async (req, res) => {
  try {
    const { productoId, cantidad = 1 } = req.body;

    const producto = await Product.findOne({
      where: { id: productoId, activo: true },
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    if (producto.stock < cantidad) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Disponible: ${producto.stock}`,
      });
    }

    // Verificar si el producto ya está en el carrito
    const itemExistente = await Cart.findOne({
      where: {
        userId: req.usuario.id,
        productId: productoId,
      },
    });

    if (itemExistente) {
      itemExistente.cantidad += cantidad;
      await itemExistente.save();
    } else {
      await Cart.create({
        userId: req.usuario.id,
        productId: productoId,
        cantidad,
      });
    }

    // Obtener carrito actualizado
    const carrito = await Cart.findAll({
      where: { userId: req.usuario.id },
      include: [
        {
          model: Product,
          attributes: ["id", "nombre", "precio", "imagen", "stock"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Producto agregado al carrito",
      carrito,
    });
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    res.status(500).json({
      success: false,
      message: "Error al agregar al carrito",
      error: error.message,
    });
  }
};

// @desc    Obtener carrito del usuario
// @route   GET /api/users/carrito
// @access  Privado
export const obtenerCarrito = async (req, res) => {
  try {
    const carrito = await Cart.findAll({
      where: { userId: req.usuario.id },
      include: [
        {
          model: Product,
          attributes: ["id", "nombre", "precio", "imagen", "stock", "activo"],
        },
      ],
    });

    // Calcular subtotal
    const subtotal = carrito.reduce((sum, item) => {
      return sum + Number(item.Product.precio) * item.cantidad;
    }, 0);

    // Formatear respuesta
    const items = carrito.map((item) => ({
      producto: {
        _id: item.Product.id,
        id: item.Product.id,
        nombre: item.Product.nombre,
        precio: Number(item.Product.precio),
        imagen: item.Product.imagen,
        stock: item.Product.stock,
        activo: item.Product.activo,
      },
      cantidad: item.cantidad,
    }));

    res.json({
      success: true,
      carrito: {
        items,
        subtotal,
      },
    });
  } catch (error) {
    console.error("Error al obtener carrito:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener carrito",
      error: error.message,
    });
  }
};

// @desc    Actualizar cantidad en carrito
// @route   PUT /api/users/carrito/:productoId
// @access  Privado
export const actualizarCantidadCarrito = async (req, res) => {
  try {
    const { productoId } = req.params;
    const { cantidad } = req.body;

    if (cantidad < 1) {
      return res.status(400).json({
        success: false,
        message: "La cantidad debe ser al menos 1",
      });
    }

    const producto = await Product.findByPk(productoId);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    if (producto.stock < cantidad) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Disponible: ${producto.stock}`,
      });
    }

    const item = await Cart.findOne({
      where: {
        userId: req.usuario.id,
        productId: productoId,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado en el carrito",
      });
    }

    await item.update({ cantidad });

    // Obtener carrito actualizado
    const carrito = await Cart.findAll({
      where: { userId: req.usuario.id },
      include: [
        {
          model: Product,
          attributes: ["id", "nombre", "precio", "imagen", "stock"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Cantidad actualizada",
      carrito,
    });
  } catch (error) {
    console.error("Error al actualizar carrito:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar carrito",
      error: error.message,
    });
  }
};

// @desc    Eliminar producto del carrito
// @route   DELETE /api/users/carrito/:productoId
// @access  Privado
export const eliminarDelCarrito = async (req, res) => {
  try {
    const { productoId } = req.params;

    const resultado = await Cart.destroy({
      where: {
        userId: req.usuario.id,
        productId: productoId,
      },
    });

    if (!resultado) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado en el carrito",
      });
    }

    // Obtener carrito actualizado
    const carrito = await Cart.findAll({
      where: { userId: req.usuario.id },
      include: [
        {
          model: Product,
          attributes: ["id", "nombre", "precio", "imagen", "stock"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Producto eliminado del carrito",
      carrito,
    });
  } catch (error) {
    console.error("Error al eliminar del carrito:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar del carrito",
      error: error.message,
    });
  }
};

// @desc    Vaciar carrito
// @route   DELETE /api/users/carrito
// @access  Privado
export const vaciarCarrito = async (req, res) => {
  try {
    await Cart.destroy({
      where: { userId: req.usuario.id },
    });

    res.json({
      success: true,
      message: "Carrito vaciado",
      carrito: [],
    });
  } catch (error) {
    console.error("Error al vaciar carrito:", error);
    res.status(500).json({
      success: false,
      message: "Error al vaciar carrito",
      error: error.message,
    });
  }
};
