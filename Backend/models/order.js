import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "./User.js";

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productos: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue("subtotal");
        return value ? parseFloat(value) : 0; // AGREGAR ESTA LÍNEA
      },
    },
    impuestos: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      get() {
        const value = this.getDataValue("impuestos");
        return value ? parseFloat(value) : 0; // AGREGAR ESTA LÍNEA
      },
    },
    envio: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      get() {
        const value = this.getDataValue("envio");
        return value ? parseFloat(value) : 0; // AGREGAR ESTA LÍNEA
      },
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue("total");
        return value ? parseFloat(value) : 0; // AGREGAR ESTA LÍNEA
      },
    },
    estado: {
      type: DataTypes.ENUM(
        "pendiente",
        "procesando",
        "enviado",
        "entregado",
        "cancelado"
      ),
      defaultValue: "pendiente",
    },
    direccionEnvio: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    metodoPago: {
      type: DataTypes.ENUM("tarjeta", "paypal", "transferencia", "efectivo"),
      defaultValue: "tarjeta",
    },
    notasCliente: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    historialEstados: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: (order) => {
        order.historialEstados = [
          {
            estado: order.estado,
            fecha: new Date(),
            comentario: "Pedido creado",
          },
        ];
      },
    },
  }
);

// Relación con User
Order.belongsTo(User, { foreignKey: "userId", as: "usuario" });
User.hasMany(Order, { foreignKey: "userId" });

export default Order;
