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

  category: {
    type: String,
    required: false,
    default: 'other',
    trim: true,
    maxlength: 50,
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