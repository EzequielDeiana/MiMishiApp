import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import verifyToken from "../middleware/verifyToken.js";
import multer from "multer";
import path from "path";
import fs from "fs";
 
const router = express.Router();
 
// ─── Multer config ────────────────────────────────────────────────────────────
 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/avatars/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${req.user.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});
 
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error("Solo imágenes jpeg, jpg o png"));
  },
});
 
// ─── Helper: firmar token ─────────────────────────────────────────────────────
 
const signToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      username: user.username,
      name: user.name,
      // ✅ Operador lógico OR corregido — antes era bitwise | que convertía el string a 0
      avatar: user.avatar || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
 
// ─── GET /me ──────────────────────────────────────────────────────────────────
 
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
 
    res.json({
      user: {
        userId: user._id,
        username: user.username,
        name: user.name,
        lastname: user.lastname,
        age: user.age,
        email: user.email,
        avatar: user.avatar || null,
      },
    });
  } catch (err) {
    console.error("Error obteniendo usuario:", err);
    res.status(500).json({ error: "Error interno" });
  }
});
 
// ─── POST /register ───────────────────────────────────────────────────────────
 
router.post("/register", async (req, res) => {
  try {
    const { username, name, lastname, age, email, password } = req.body;
 
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Faltan campos obligatorios (username, email, password)",
      });
    }
 
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: "El email o username ya está registrado" });
    }
 
    const user = new User({
      username,
      name: name || "",
      lastname: lastname || "",
      age: age || null,
      email,
      password,
    });
 
    await user.save();
 
    const token = signToken(user);
 
    res.status(201).json({
      message: "Usuario creado exitosamente",
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
      },
    });
  } catch (err) {
    console.error("Error en registro:", err.stack || err);
    res.status(500).json({ error: "Error interno al registrar usuario" });
  }
});
 
// ─── POST /login ──────────────────────────────────────────────────────────────
 
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }
 
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });
 
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: "Credenciales inválidas" });
 
    const token = signToken(user);
 
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error interno en el login" });
  }
});
 
// ─── PATCH /profile ───────────────────────────────────────────────────────────
 
router.patch("/profile", verifyToken, async (req, res) => {
  try {
    const { username, name, lastname, password, currentPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
 
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({
          error: "Debes proporcionar la contraseña actual para cambiarla",
        });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }
 
    if (username) user.username = username;
    if (name) user.name = name;
    if (lastname) user.lastname = lastname;
    if (password) user.password = password; // se hashea por pre-save
 
    await user.save();
 
    const newToken = signToken(user);
 
    res.json({
      message: "Perfil actualizado exitosamente",
      token: newToken,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        avatar: user.avatar || null,
      },
    });
  } catch (err) {
    console.error("Error actualizando perfil:", err);
    res.status(500).json({ error: "Error interno al actualizar perfil" });
  }
});
 
// ─── POST /profile/avatar ─────────────────────────────────────────────────────
 
router.post("/profile/avatar", verifyToken, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ninguna imagen" });
    }
 
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
 
    // Borrar avatar anterior si existe
    if (user.avatar) {
      const oldPath = path.join(process.cwd(), "public", user.avatar);
      try {
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch (unlinkErr) {
        console.error("Error borrando avatar anterior:", unlinkErr.message);
      }
    }
 
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();
 
    const newToken = signToken(user);
 
    res.json({
      message: "Imagen de perfil actualizada",
      avatar: user.avatar,
      token: newToken,
    });
  } catch (err) {
    console.error("Error en POST /profile/avatar:", err.stack || err.message);
    res.status(500).json({ error: "Error al subir imagen" });
  }
});
 
// ─── DELETE /profile/avatar ───────────────────────────────────────────────────
 
router.delete("/profile/avatar", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    if (!user.avatar) return res.status(400).json({ error: "No hay imagen para borrar" });
 
    const imagePath = path.join(process.cwd(), "public", user.avatar);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
 
    user.avatar = null;
    await user.save();
 
    const newToken = signToken(user);
 
    res.json({ message: "Imagen de perfil eliminada", token: newToken });
  } catch (err) {
    console.error("Error borrando avatar:", err);
    res.status(500).json({ error: "Error al eliminar imagen" });
  }
});
 
export default router;