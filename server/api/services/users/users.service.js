import l from '../../../common/logger.js';
import { User } from '../../../common/models/User.js';

class UsersService {
  async create(body) {
    l.info(`${this.constructor.name}.create()`);
    const userData = {
      email: body.email,
      username: body.username,
      password: body.password,
      currentDayStart: body.currentDayStart,
    };
    let result = await User.create(userData)
      .catch(err => {
        if (err.message.slice(0, 6) !== 'E11000') l.error(err);
        return err;
      });
    if (result instanceof Error) return result;
    result = await result.populate('currentDay').catch(err => err);
    if (result instanceof Error) return result;
    let clone = result.toObject();
    delete clone.password;
    return clone;
  }
}

export default new UsersService();
