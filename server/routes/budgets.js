import express from 'express';
import mongoose from 'mongoose';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import verifyToken from '../middleware/verifyToken.js';
 
const router = express.Router();
router.use(verifyToken);
 
// ─── GET /api/budgets ─────────────────────────────────────────────────────────
// Devuelve todos los presupuestos del usuario
router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find({
      userId: new mongoose.Types.ObjectId(req.user.userId),
    }).sort({ category: 1 });
    res.json(budgets);
  } catch (err) {
    console.error('Error obteniendo presupuestos:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});
 
// ─── GET /api/budgets/progress?month=2026-03 ──────────────────────────────────
// Devuelve presupuestos del mes con el gasto real acumulado
router.get('/progress', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const month = req.query.month || new Date().toISOString().slice(0, 7);
 
    // Presupuestos que aplican al mes (específicos o recurrentes)
    const budgets = await Budget.find({
      userId,
      $or: [{ month }, { month: null }],
    });
 
    if (budgets.length === 0) return res.json([]);
 
    // Rango de fechas del mes
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 1);
 
    // Gasto real por categoría en el mes
    const spent = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'gasto',
          date: { $gte: startDate, $lt: endDate },
          category: { $in: budgets.map(b => b.category) },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$value' },
        },
      },
    ]);
 
    const spentMap = Object.fromEntries(spent.map(s => [s._id, s.total]));
 
    const progress = budgets.map(b => ({
      _id: b._id,
      category: b.category,
      amount: b.amount,
      month: b.month,
      spent: spentMap[b.category] || 0,
      percentage: Math.min(((spentMap[b.category] || 0) / b.amount) * 100, 100),
      exceeded: (spentMap[b.category] || 0) > b.amount,
    }));
 
    res.json(progress);
  } catch (err) {
    console.error('Error calculando progreso:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});
 
// ─── POST /api/budgets ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { category, amount, month } = req.body;
    if (!category || !amount) {
      return res.status(400).json({ error: 'Categoría y monto son obligatorios' });
    }
 
    const budget = new Budget({
      userId: new mongoose.Types.ObjectId(req.user.userId),
      category,
      amount,
      month: month || null,
    });
 
    await budget.save();
    res.status(201).json({ message: 'Presupuesto creado', budget });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Ya existe un presupuesto para esa categoría en ese período' });
    }
    console.error('Error creando presupuesto:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});
 
// ─── PATCH /api/budgets/:id ───────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const { amount, month } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: new mongoose.Types.ObjectId(req.user.userId) },
      { amount, month },
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ error: 'Presupuesto no encontrado' });
    res.json({ message: 'Presupuesto actualizado', budget });
  } catch (err) {
    console.error('Error actualizando presupuesto:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});
 
// ─── DELETE /api/budgets/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user.userId),
    });
    if (!budget) return res.status(404).json({ error: 'Presupuesto no encontrado' });
    res.json({ message: 'Presupuesto eliminado' });
  } catch (err) {
    console.error('Error eliminando presupuesto:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});
 
export default router;