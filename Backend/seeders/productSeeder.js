import dotenv from "dotenv";
import { sequelize } from "../config/database.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

dotenv.config();

const productos = [
  {
    nombre: "iPhone 15 Pro",
    descripcion:
      "El último smartphone de Apple con chip A17 Pro y cámara de 48MP.",
    precio: 999,
    categoria: "smartphones",
    imagen:
      "https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    destacado: true,
    stock: 25,
    marca: "Apple",
    modelo: "iPhone 15 Pro",
  },
  {
    nombre: "MacBook Pro M2",
    descripcion:
      'Laptop profesional de 14" con chip M2 Pro y pantalla Liquid Retina XDR.',
    precio: 1999,
    categoria: "laptops",
    imagen:
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    destacado: false,
    stock: 15,
    marca: "Apple",
    modelo: 'MacBook Pro 14"',
  },
  {
    nombre: "AirPods Pro 2",
    descripcion:
      "Audífonos inalámbricos con cancelación activa de ruido y sonido adaptativo.",
    precio: 249,
    categoria: "accesorios",
    imagen:
      "https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    destacado: true,
    stock: 50,
    marca: "Apple",
    modelo: "AirPods Pro 2nd Gen",
  },
  {
    nombre: "iPad Pro M2",
    descripcion:
      "Tablet profesional con pantalla Liquid Retina y compatibilidad con Apple Pencil.",
    precio: 799,
    categoria: "tablets",
    imagen:
      "https://images.unsplash.com/photo-1592155931584-901ac15763e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1473&q=80",
    destacado: false,
    stock: 20,
    marca: "Apple",
    modelo: 'iPad Pro 11"',
  },
  {
    nombre: "Apple Watch Ultra",
    descripcion:
      "Reloj inteligente con GPS preciso y resistencia para deportes extremos.",
    precio: 799,
    categoria: "wearables",
    imagen:
      "https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    destacado: true,
    stock: 30,
    marca: "Apple",
    modelo: "Watch Ultra",
  },
  {
    nombre: "Samsung Galaxy S23 Ultra",
    descripcion:
      "Smartphone Android con cámara de 200MP y lápiz S-Pen integrado.",
    precio: 1199,
    categoria: "smartphones",
    imagen:
      "https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    destacado: false,
    stock: 18,
    marca: "Samsung",
    modelo: "Galaxy S23 Ultra",
  },
  {
    nombre: "Dell XPS 15",
    descripcion:
      "Laptop premium con pantalla InfinityEdge y procesador Intel Core i9.",
    precio: 1799,
    categoria: "laptops",
    imagen:
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1632&q=80",
    destacado: true,
    stock: 12,
    marca: "Dell",
    modelo: "XPS 15",
  },
  {
    nombre: "Sony WH-1000XM5",
    descripcion:
      "Audífonos con cancelación de ruido líder en la industria y 30h de batería.",
    precio: 399,
    categoria: "accesorios",
    imagen:
      "https://images.pexels.com/photos/983831/pexels-photo-983831.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    destacado: false,
    stock: 35,
    marca: "Sony",
    modelo: "WH-1000XM5",
  },
];

const usuarioAdmin = {
  nombre: "Administrador",
  email: "admin@techshop.com",
  password: "admin123456",
  rol: "admin",
};

const poblarDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado a PostgreSQL");

    // Sincronizar modelos (crear tablas)
    await sequelize.sync({ force: true });
    console.log("🗑️  Base de datos reiniciada");

    // Insertar productos
    console.log("📦 Insertando productos...");
    await Product.bulkCreate(productos);
    console.log(`✅ ${productos.length} productos insertados`);

    // Crear usuario administrador
    console.log("👤 Creando usuario administrador...");
    await User.create(usuarioAdmin);
    console.log("✅ Usuario administrador creado");
    console.log("📧 Email: admin@techshop.com");
    console.log("🔐 Password: admin123456");

    console.log("\n🎉 Base de datos poblada exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al poblar la base de datos:", error);
    process.exit(1);
  }
};

poblarDB();
