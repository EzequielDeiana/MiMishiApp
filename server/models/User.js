import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
 
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name:     { type: String, required: true },
  lastname: { type: String, required: true },
  age:      { type: Number, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
 
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});
 
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
 
export default mongoose.model('User', userSchema);
 