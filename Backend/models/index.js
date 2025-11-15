import { sequelize } from "../config/database.js";
import User from "./User.js";
import Product from "./Product.js";
import Order from "./order.js";
import Cart from "./Cart.js";

// Definir relaciones

// User - Order
// Order.belongsTo(User, { foreignKey: "userId", as: "usuario" });
// User.hasMany(Order, { foreignKey: "userId" });

// // User - Cart
// Cart.belongsTo(User, { foreignKey: "userId" });
// User.hasMany(Cart, { foreignKey: "userId", as: "carrito" });

// // Product - Cart
// Cart.belongsTo(Product, { foreignKey: "productId" });
// Product.hasMany(Cart, { foreignKey: "productId" });

export { sequelize, User, Product, Order, Cart };
