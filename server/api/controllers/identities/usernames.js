import UsernamesService from '../../services/identities/usernames.service.js';
import l from '../../../common/logger.js';

export class Controller {
  async get(req, res) {
    const usernameRegex = /^[a-z0-9_]+$/i;
    if (req.query && req.query.username) {
      const testResult = usernameRegex.test(req.query.username);
      if (testResult) {
        const result = await UsernamesService.unique(req.query.username).catch(error => error);
        if (!(result instanceof Error)) {
          if (result) {
            let complete = {};
            complete.message = 'Username not in use!';
            complete.unique = result;
            return res.status(200).json(complete);
          }
          let complete = {};
          complete.message = 'Username is already in use!';
          complete.unique = result;
          return res.status(200).json(complete);
        }
        l.error(result);
        let error = new Error();
        error.error = 'An internal server error occured!';
        error.code = 'INTERNAL';
        return res.status(500).json(error);
      }
      let error = new Error();
      error.error = 'Username is not valid!';
      error.code = 'INVALID_PARAMS';
      return res.status(422).json(error);
    }
    let error = new Error();
    error.error = 'No username provided!';
    error.code = 'NO_PARAMS';
    return res.status(422).json(error);
  }
}

export default new Controller();
