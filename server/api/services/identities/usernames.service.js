import l from '../../../common/logger.js';
import { User } from '../../../common/models/User.js';

class UsernamesService {
  async unique(username) {
    l.info(`${this.constructor.name}.unique()`);
    const result = await User.findOne({ username: username }).catch(error => error);
    if(result && !(result instanceof Error) && result._id){
      return false;
    }
    if(result && (result instanceof Error)) return result;
    return true;
  }
}

export default new UsernamesService();
