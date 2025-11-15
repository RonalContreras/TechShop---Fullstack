import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "El nombre es obligatorio" },
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: "La descripción es obligatoria" },
      },
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue("precio");
        return value ? parseFloat(value) : 0; // AGREGAR ESTA LÍNEA
      },
      validate: {
        min: {
          args: [0],
          msg: "El precio no puede ser negativo",
        },
      },
    },
    categoria: {
      type: DataTypes.ENUM(
        "smartphones",
        "laptops",
        "tablets",
        "accesorios",
        "wearables"
      ),
      allowNull: false,
    },
    imagen: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "https://via.placeholder.com/300",
    },
    destacado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: "El stock no puede ser negativo",
        },
      },
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    marca: {
      type: DataTypes.STRING(50),
      defaultValue: "",
    },
    modelo: {
      type: DataTypes.STRING(50),
      defaultValue: "",
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["categoria"] },
      { fields: ["destacado"] },
      { fields: ["activo"] },
    ],
  }
);

export default Product;
