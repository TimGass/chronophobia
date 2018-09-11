import mongoose from 'mongoose';
import moment from 'moment';
import ActivitySchema from './Activity';

const DaySchema = new mongoose.Schema({
  startedAt: {
    type: Date,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  activities: [ActivitySchema],
  expireAt: {
    type: Date,
    default: () => moment().add(30, 'days'),
    expires: 60,
  },
}, { timestamps: true });

DaySchema.index({ startedAt: 1, user: 1 }, { unique: true });

module.exports.DaySchema = DaySchema;
module.exports.Day = mongoose.model('Day', DaySchema);
module.exports.Activity = mongoose.model('Activity', ActivitySchema);
