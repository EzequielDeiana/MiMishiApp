import express from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import verifyToken from '../middleware/verifyToken.js';
const router = express.Router();
 
router.use(verifyToken); // Todas las rutas requieren autenticación
 
// ─── POST / — Crear transacción ───────────────────────────────────────────────
 
router.post("/", async (req, res) => {
  try {
    const newTransaction = new Transaction({
      ...req.body,
      userId: new mongoose.Types.ObjectId(req.user.userId),
    });
    await newTransaction.save();
    res.status(201).json({
      message: "Transacción agregada exitosamente",
      transaction: newTransaction,
    });
  } catch (err) {
    console.error("Error agregando transacción:", err);
    res.status(400).json({ error: err.message });
  }
});
 
// ─── GET / — Listar transacciones del usuario ─────────────────────────────────
 
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: new mongoose.Types.ObjectId(req.user.userId),
    }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});
 
// ─── GET /summary — Resumen por mes para el gráfico ──────────────────────────
 
router.get("/summary", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
 
    const summary = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          ingresos: {
            $sum: { $cond: [{ $eq: ["$type", "ingreso"] }, "$value", 0] },
          },
          gastos: {
            $sum: { $cond: [{ $eq: ["$type", "gasto"] }, "$value", 0] },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);
 
    res.json(summary);
  } catch (err) {
    console.error("Error en summary:", err.stack);
    res.status(500).json({ error: "Error interno" });
  }
});
 
router.patch("/:id", async (req, res) => {
  try {
    const { type, title, description, value } = req.body;
 
    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: new mongoose.Types.ObjectId(req.user.userId),
      },
      { type, title, description, value },
      { new: true, runValidators: true }
    );
 
    if (!transaction) {
      return res.status(404).json({ error: "Transacción no encontrada o no pertenece al usuario" });
    }
 
    res.json({
      message: "Transacción actualizada exitosamente",
      transaction,
    });
  } catch (err) {
    console.error("Error editando transacción:", err);
    res.status(400).json({ error: err.message });
  }
});
 
// ─── DELETE /:id — Eliminar transacción ──────────────────────────────────────
 
router.delete("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });
 
    if (!transaction) {
      return res.status(404).json({ error: "Transacción no encontrada o no pertenece al usuario" });
    }
 
    res.json({ message: "Transacción eliminada exitosamente" });
  } catch (err) {
    console.error("Error borrando transacción:", err);
    res.status(500).json({ error: "Error interno al eliminar" });
  }
});
 
export default router;