import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  startedAt: {
    type: Date,
    required: true,
  },
  endedAt: {
    type: Date,
  },
  category: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default ActivitySchema;
