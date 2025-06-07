import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    role: {
      type: String,
      enum: ["ADMIN", "USER", "DEVELOPER"],
      default: "USER",
      uppercase: true,
    },
     phone: {
    type: String,
    required: [true, "El número de teléfono es obligatorio"],
    trim: true,
    unique: true,
    minlength: [8, "El teléfono debe tener exactamente 8 dígitos"],
    maxlength: [8, "El teléfono debe tener exactamente 8 dígitos"],
    validate: {
      validator: function(v) {
        // Comprueba que sean sólo dígitos y exactamente 8 caracteres
        return /^\d{8}$/.test(v);
      },
      message: props => `‘${props.value}’ no es un número de teléfono válido. Debe contener exactamente 8 dígitos numéricos.`
    }
  },
    email: {
      type: String,
      // required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 255,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email",
      },
    },
    access_code: {
      type: String,
      required: [true, "Access code is required"],
      unique: true,
      match: [/^\w{8}$/, "The access_code must be exactly 8 characters long"],
    },
    is_active: { type: Boolean, default: true },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    refreshToken: { type: String, select: false },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    profileImage: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        return ret;
      },
    },
  }
);

/** 🔹 Métodos de instancia */
userSchema.methods = {
  async comparePassword(enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
  },
  async deactivateAccount() {
    this.is_active = false;
    return this.save();
  },
  async updateProfileImage(imageUrl) {
    this.profileImage = imageUrl;
    return this.save();
  },
};

const User = mongoose.model("User", userSchema);
export default User;
