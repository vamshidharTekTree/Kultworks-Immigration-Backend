import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id:  { type: String },
  seq:  { type: Number, default: 0 },
});

counterSchema.statics.nextVal = async function (key) {
  const year = new Date().getFullYear();
  const counter = await this.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  const padded = String(counter.seq).padStart(5, '0');
  return `${key}-${year}-${padded}`;
};

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
