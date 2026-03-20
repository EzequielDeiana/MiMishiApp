import mongoose from 'mongoose';
 
const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Clave interna de categoría (igual que en Transaction)
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  // Monto límite para el período
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  // Mes al que aplica: "2026-03" — si es null aplica a todos los meses (recurrente)
  month: {
    type: String,
    default: null,
    match: /^\d{4}-\d{2}$/,
  },
}, { timestamps: true });
 
// Un usuario no puede tener dos presupuestos para la misma categoría en el mismo mes
budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });
 
export default mongoose.model('Budget', budgetSchema);