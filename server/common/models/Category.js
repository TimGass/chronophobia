import mongoose from 'mongoose';
import { User } from './User.js';

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

CategorySchema.virtual('newUser').get(function() {
  return this.__newUser;
}).set(function(newUser) {
  this.__newUser = newUser;
});

CategorySchema.pre('save', async function (next) {
  if(this.newUser){
    return next();
  }
  let result = await User.findOne({ _id: this.user }).catch(error => error);
  const hexes = [
    '#001399',
    '#12574F',
    '#FFACEE',
    '#FF3333',
    '#E5E52D',
    '#800080',
    '#A52A2A',
    '#FFA500',
    '#00FF00',
    '#A5DDFD',
  ];
  let copy = result.toObject();
  let duplicates = copy.categories.filter(element => (element.name === this.name));
  if (result instanceof Error) {
    return next(result);
  } else if (this.isNew && duplicates.length > 0) {
    // category is not unique
    const newError = new Error('Category already exists!');
    newError.code = 'ALREADY_EXISTS';
    newError.error = 'Category already exists!';
    return next(newError);
  } else if (result.categories.length + 1 > 10) {
    let newError = new Error('Max categories reached! Delete before you add more!');
    newError.code = 'MAX_NUM';
    newError.error = 'Max categories reached! Delete before you add more!';
    return next(newError);
  }
  if (this.isNew && copy.categories && copy.categories.length !== 0) {
    this.color = hexes[copy.categories.length];
  }
  else if (this.isNew) {
    this.color = hexes[0];
  }
  // do nothing, that means there are no problems and we should proceed with storage.
  return next();
});

export default CategorySchema;
