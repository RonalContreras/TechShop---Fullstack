import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../config/database.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: "El nombre es obligatorio" },
        len: {
          args: [2, 50],
          msg: "El nombre debe tener entre 2 y 50 caracteres",
        },
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: "Debe ser un email válido" },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [6],
          msg: "La contraseña debe tener al menos 6 caracteres",
        },
      },
    },
    rol: {
      type: DataTypes.ENUM("usuario", "admin"),
      defaultValue: "usuario",
    },
    telefono: {
      type: DataTypes.STRING(20),
      defaultValue: "",
    },
    direccion: {
      type: DataTypes.JSONB,
      defaultValue: {
        calle: "",
        ciudad: "",
        estado: "",
        codigoPostal: "",
        pais: "",
      },
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Método para comparar contraseñas
User.prototype.compararPassword = async function (passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

// Método para obtener perfil público
User.prototype.obtenerPerfilPublico = function () {
  const { password, ...userWithoutPassword } = this.toJSON();
  return userWithoutPassword;
};

export default User;
