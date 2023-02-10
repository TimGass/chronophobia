import l from '../../../common/logger.js';
import { User } from '../../../common/models/User.js';

class EmailsService {
  async unique(email) {
    l.info(`${this.constructor.name}.unique()`);
    const result = await User.findOne({ email: email }).catch(error => error);
    if(result && !(result instanceof Error) && result._id){
      return false;
    }
    if(result && (result instanceof Error)) return result;
    return true;
  }
}

export default new EmailsService();
