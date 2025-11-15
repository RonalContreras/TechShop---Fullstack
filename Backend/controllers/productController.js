import { validationResult } from "express-validator";
import Product from "../models/Product.js";
import { Op } from "sequelize";

// @desc    Obtener todos los productos
// @route   GET /api/products
// @access  Público
export const obtenerProductos = async (req, res) => {
  try {
    const {
      categoria,
      destacado,
      minPrecio,
      maxPrecio,
      ordenar,
      limite = 50,
      pagina = 1,
    } = req.query;

    // Construir filtros
    const where = { activo: true };

    if (categoria) {
      where.categoria = categoria.toLowerCase();
    }

    if (destacado !== undefined) {
      where.destacado = destacado === "true";
    }

    if (minPrecio || maxPrecio) {
      where.precio = {};
      if (minPrecio) where.precio[Op.gte] = Number(minPrecio);
      if (maxPrecio) where.precio[Op.lte] = Number(maxPrecio);
    }

    // Construir opciones de ordenamiento
    let order = [["createdAt", "DESC"]];
    if (ordenar) {
      switch (ordenar) {
        case "precio-asc":
          order = [["precio", "ASC"]];
          break;
        case "precio-desc":
          order = [["precio", "DESC"]];
          break;
        case "nombre-asc":
          order = [["nombre", "ASC"]];
          break;
        case "nombre-desc":
          order = [["nombre", "DESC"]];
          break;
      }
    }

    const offset = (Number(pagina) - 1) * Number(limite);

    const { count, rows: productos } = await Product.findAndCountAll({
      where,
      order,
      limit: Number(limite),
      offset,
    });

    res.json({
      success: true,
      count: productos.length,
      total: count,
      pagina: Number(pagina),
      paginas: Math.ceil(count / Number(limite)),
      productos,
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos",
      error: error.message,
    });
  }
};

// @desc    Obtener producto por ID
// @route   GET /api/products/:id
// @access  Público
export const obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Product.findOne({
      where: {
        id: req.params.id,
        activo: true,
      },
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    res.json({
      success: true,
      producto,
    });
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener producto",
      error: error.message,
    });
  }
};

// @desc    Crear nuevo producto
// @route   POST /api/products
// @access  Privado/Admin
export const crearProducto = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Errores de validación",
        errores: errores.array(),
      });
    }

    const producto = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      producto,
    });
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear producto",
      error: error.message,
    });
  }
};

// @desc    Actualizar producto
// @route   PUT /api/products/:id
// @access  Privado/Admin
export const actualizarProducto = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Errores de validación",
        errores: errores.array(),
      });
    }

    const producto = await Product.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    await producto.update(req.body);

    res.json({
      success: true,
      message: "Producto actualizado exitosamente",
      producto,
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar producto",
      error: error.message,
    });
  }
};

// @desc    Eliminar producto (soft delete)
// @route   DELETE /api/products/:id
// @access  Privado/Admin
export const eliminarProducto = async (req, res) => {
  try {
    const producto = await Product.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    await producto.update({ activo: false });

    res.json({
      success: true,
      message: "Producto eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar producto",
      error: error.message,
    });
  }
};

// @desc    Obtener productos destacados
// @route   GET /api/products/destacados
// @access  Público
export const obtenerProductosDestacados = async (req, res) => {
  try {
    const productos = await Product.findAll({
      where: {
        destacado: true,
        activo: true,
      },
      limit: 6,
    });

    res.json({
      success: true,
      count: productos.length,
      productos,
    });
  } catch (error) {
    console.error("Error al obtener productos destacados:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos destacados",
      error: error.message,
    });
  }
};

// @desc    Buscar productos
// @route   GET /api/products/buscar?q=termino
// @access  Público
export const buscarProductos = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Se requiere un término de búsqueda",
      });
    }

    const productos = await Product.findAll({
      where: {
        activo: true,
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${q}%` } },
          { descripcion: { [Op.iLike]: `%${q}%` } },
          { marca: { [Op.iLike]: `%${q}%` } },
          { modelo: { [Op.iLike]: `%${q}%` } },
        ],
      },
      limit: 20,
    });

    res.json({
      success: true,
      count: productos.length,
      productos,
    });
  } catch (error) {
    console.error("Error en búsqueda:", error);
    res.status(500).json({
      success: false,
      message: "Error en la búsqueda",
      error: error.message,
    });
  }
};

// @desc    Obtener productos por categoría
// @route   GET /api/products/categoria/:categoria
// @access  Público
export const obtenerProductosPorCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;

    const productos = await Product.findAll({
      where: {
        categoria: categoria.toLowerCase(),
        activo: true,
      },
    });

    res.json({
      success: true,
      count: productos.length,
      categoria,
      productos,
    });
  } catch (error) {
    console.error("Error al obtener productos por categoría:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos",
      error: error.message,
    });
  }
};
