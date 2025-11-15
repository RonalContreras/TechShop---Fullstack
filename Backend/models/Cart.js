import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import User from "./User.js";
import Product from "./Product.js";

const Cart = sequelize.define(
  "Cart",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Relaciones
Cart.belongsTo(User, { foreignKey: "userId" });
Cart.belongsTo(Product, { foreignKey: "productId" });

User.hasMany(Cart, { foreignKey: "userId", as: "carrito" });
Product.hasMany(Cart, { foreignKey: "productId" });

export default Cart;
