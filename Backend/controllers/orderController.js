import { validationResult } from "express-validator";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
import { sequelize } from "../config/database.js";

// @desc    Crear nuevo pedido
// @route   POST /api/orders
// @access  Privado
export const crearPedido = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Errores de validación",
        errores: errores.array(),
      });
    }

    const { productos, direccionEnvio, metodoPago, notasCliente } = req.body;

    // Validar y preparar productos
    const productosConDetalles = [];
    let subtotal = 0;

    for (const item of productos) {
      const producto = await Product.findOne({
        where: { id: item.producto, activo: true },
        transaction,
      });

      if (!producto) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Producto no encontrado: ${item.producto}`,
        });
      }

      if (producto.stock < item.cantidad) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
        });
      }

      const precioTotal = Number(producto.precio) * item.cantidad;
      subtotal += precioTotal;

      productosConDetalles.push({
        producto: producto.id,
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precio: Number(producto.precio),
        imagen: producto.imagen,
      });

      // Actualizar stock del producto
      await producto.update(
        { stock: producto.stock - item.cantidad },
        { transaction }
      );
    }

    // Calcular totales
    const impuestos = subtotal * 0.16;
    const envio = subtotal >= 1000 ? 0 : 99;
    const total = subtotal + impuestos + envio;

    // Crear pedido
    const pedido = await Order.create(
      {
        userId: req.usuario.id,
        productos: productosConDetalles,
        subtotal,
        impuestos,
        envio,
        total,
        direccionEnvio,
        metodoPago: metodoPago || "tarjeta",
        notasCliente: notasCliente || "",
      },
      { transaction }
    );

    // Limpiar carrito del usuario
    await Cart.destroy({
      where: { userId: req.usuario.id },
      transaction,
    });

    await transaction.commit();

    // Obtener pedido completo con relaciones
    const pedidoCompleto = await Order.findByPk(pedido.id, {
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["id", "nombre", "email"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Pedido creado exitosamente",
      pedido: pedidoCompleto,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error al crear pedido:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear pedido",
      error: error.message,
    });
  }
};

// @desc    Obtener pedidos del usuario actual
// @route   GET /api/orders/mis-pedidos
// @access  Privado
export const obtenerMisPedidos = async (req, res) => {
  try {
    const pedidos = await Order.findAll({
      where: { userId: req.usuario.id },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: pedidos.length,
      pedidos,
    });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener pedidos",
      error: error.message,
    });
  }
};

// @desc    Obtener pedido por ID
// @route   GET /api/orders/:id
// @access  Privado
export const obtenerPedidoPorId = async (req, res) => {
  try {
    const pedido = await Order.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["id", "nombre", "email", "telefono"],
        },
      ],
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    // Verificar que el usuario sea el dueño del pedido o sea admin
    if (pedido.userId !== req.usuario.id && req.usuario.rol !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No autorizado para ver este pedido",
      });
    }

    res.json({
      success: true,
      pedido,
    });
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener pedido",
      error: error.message,
    });
  }
};

// @desc    Obtener todos los pedidos (Admin)
// @route   GET /api/orders
// @access  Privado/Admin
export const obtenerTodosPedidos = async (req, res) => {
  try {
    const { estado, limite = 50, pagina = 1, ordenar = "DESC" } = req.query;

    const where = {};
    if (estado) {
      where.estado = estado;
    }

    const offset = (Number(pagina) - 1) * Number(limite);

    const { count, rows: pedidos } = await Order.findAndCountAll({
      where,
      order: [["createdAt", ordenar]],
      limit: Number(limite),
      offset,
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["id", "nombre", "email"],
        },
      ],
    });

    // Calcular estadísticas
    const estadoPendiente = await Order.count({
      where: { estado: "pendiente" },
    });
    const estadoProcesando = await Order.count({
      where: { estado: "procesando" },
    });
    const estadoEnviado = await Order.count({ where: { estado: "enviado" } });
    const estadoEntregado = await Order.count({
      where: { estado: "entregado" },
    });
    const estadoCancelado = await Order.count({
      where: { estado: "cancelado" },
    });

    const totalVentas = await Order.sum("total");

    const estadisticas = {
      totalVentas: totalVentas || 0,
      pedidosPendientes: estadoPendiente,
      pedidosProcesando: estadoProcesando,
      pedidosEnviados: estadoEnviado,
      pedidosEntregados: estadoEntregado,
      pedidosCancelados: estadoCancelado,
    };

    res.json({
      success: true,
      count: pedidos.length,
      total: count,
      pagina: Number(pagina),
      paginas: Math.ceil(count / Number(limite)),
      estadisticas,
      pedidos,
    });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener pedidos",
      error: error.message,
    });
  }
};

// @desc    Actualizar estado del pedido (Admin)
// @route   PUT /api/orders/:id/estado
// @access  Privado/Admin
export const actualizarEstadoPedido = async (req, res) => {
  try {
    const { estado, comentario } = req.body;

    const estadosValidos = [
      "pendiente",
      "procesando",
      "enviado",
      "entregado",
      "cancelado",
    ];

    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido",
      });
    }

    const pedido = await Order.findByPk(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    // Actualizar estado
    pedido.estado = estado;

    // Agregar al historial
    const historial = pedido.historialEstados || [];
    historial.push({
      estado,
      fecha: new Date(),
      comentario: comentario || `Estado actualizado a ${estado}`,
    });
    pedido.historialEstados = historial;

    await pedido.save();

    res.json({
      success: true,
      message: "Estado actualizado exitosamente",
      pedido,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar estado",
      error: error.message,
    });
  }
};

// @desc    Cancelar pedido
// @route   PUT /api/orders/:id/cancelar
// @access  Privado
export const cancelarPedido = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const pedido = await Order.findByPk(req.params.id, { transaction });

    if (!pedido) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    // Verificar que el usuario sea el dueño
    if (pedido.userId !== req.usuario.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "No autorizado para cancelar este pedido",
      });
    }

    // Solo se puede cancelar si está pendiente o procesando
    if (!["pendiente", "procesando"].includes(pedido.estado)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "No se puede cancelar un pedido que ya ha sido enviado",
      });
    }

    // Restaurar stock de productos
    for (const item of pedido.productos) {
      const producto = await Product.findByPk(item.producto, { transaction });
      if (producto) {
        await producto.update(
          { stock: producto.stock + item.cantidad },
          { transaction }
        );
      }
    }

    // Actualizar estado
    pedido.estado = "cancelado";
    const historial = pedido.historialEstados || [];
    historial.push({
      estado: "cancelado",
      fecha: new Date(),
      comentario: "Pedido cancelado por el usuario",
    });
    pedido.historialEstados = historial;

    await pedido.save({ transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: "Pedido cancelado exitosamente",
      pedido,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error al cancelar pedido:", error);
    res.status(500).json({
      success: false,
      message: "Error al cancelar pedido",
      error: error.message,
    });
  }
};
