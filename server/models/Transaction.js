import mongoose from 'mongoose';
 
const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['ingreso', 'gasto'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  // El servidor acepta cualquier string no vacío para permitir categorías personalizadas
  category: {
    type: String,
    required: false,
    default: 'other',
    trim: true,
    maxlength: 50,   // límite razonable para evitar abusos
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
 
export default mongoose.model('Transaction', transactionSchema);