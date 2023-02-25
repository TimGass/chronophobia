import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import CategorySchema from './Category.js';
import { Day } from './Day.js';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  categories: [CategorySchema],
  currentDay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Day',
    unique: true,
    required: true,
  },
}, { timestamps: true });

UserSchema.statics.authenticate = async function(emailOrUsername, password) {
  let user = await this.findOne({$or: [{ email: emailOrUsername }, { username: emailOrUsername }]});
  if (user) {
    const match = await bcrypt.compare(password, user.password);
    if (match === true) {
      user = await user.populate('currentDay').catch(error => error);
      if (user instanceof Error) return user;
      return user;
    }
    let error = new Error('Invalid credentials');
    error.code = 'INVALID_CREDS';
    return error;
  }
};

UserSchema.virtual('currentDayStart').get(function() {
  return this.__currentDayStart;
}).set(function(currentDayStart) {
  this.__currentDayStart = currentDayStart;
});

UserSchema.pre('validate', async function (next) {
  if (this.isNew) {
    const day = {
      startedAt: this.currentDayStart,
      user: this._id
    };
    let result = await Day.create(day).catch(error => error);
    if (result instanceof Error) return next(result);
    this.currentDay = result._id;
  }
  return next();
});

UserSchema.pre('save', async function (next) {
  if (this.password.length !== 60) {
    let hash = await bcrypt.hash(this.password, 10).catch(err => err);
    if (hash instanceof Error) {
      return next(hash);
    }
    this.password = hash;
    const categories = [
      { name: 'sleep', user: this._id, color: '#001399', newUser: true },
      { name: 'self-improvement', user: this._id , color: '#12574F', newUser: true },
      { name: 'maintenance', user: this._id, color: '#FFACEE', newUser: true },
      { name: 'work', user: this._id, color: '#FF3333', newUser: true },
      { name: 'free-time', user: this._id, color: '#E5E52D', newUser: true },
      { name: 'exercise', user: this._id, color: '#800080', newUser: true },
    ];
    const Category = mongoose.model('Category', CategorySchema);
    let result = await Category.create(categories).catch(error => error);
    if (result instanceof Error) return next(result);
    this.categories = result;
    return next();
  }
  return next();
});

const User = mongoose.model('User', UserSchema);
const Category = mongoose.model('Category', CategorySchema);

export { User, Category };
