import l from '../../../common/logger';
import { Category, User } from '../../../common/models/User';

class CategoriesService {
  async create(user, body) {
    l.info(`${this.constructor.name}.create()`);
    let categoryData = {
      name: body.name,
      user: user._id
    };
    let result = await Category.create(categoryData).catch(error => error);
    if (result instanceof Error) {
      if (result.message.slice(0, 6) !== 'E11000' && result.code !== 'ALREADY_EXISTS' && result.code !== 'MAX_NUM') l.error(result.code);
      return result;
    }
    user.categories.push(result);
    result = await user.save()
      .then(user => {
        let clone = user.toObject();
        delete clone.password;
        return clone;
      })
      .catch(err => {
        if (err) {
          if (err.message.slice(0, 6) !== 'E11000') l.error(err);
          return err;
        }
      });
    if (result instanceof Error) return result;
    return result;
  }

  async remove(user, id) {
    l.info(`${this.constructor.name}.remove(${id})`);
    let category = user.categories.id(id);
    if (category.length === 0) {
      let error = new Error('No category in user model found!');
      error.error ='No category in user model found!';
      error.code = 'NOT_EXIST';
      return
    }
    category.remove();
    let result = await user.save().catch(err => err);
    if(result instanceof Error) return result;
    let copy = result.toObject();
    delete copy.password;
    return copy;
  }
}

export default new CategoriesService();
