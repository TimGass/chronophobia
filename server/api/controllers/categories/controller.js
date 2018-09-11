import CategoriesService from '../../services/categories/categories.service';
import MeService from '../../services/me.service';
import l from '../../../common/logger';

export class Controller {
  async get(req, res) {
    if (req.headers.accesstoken || req.cookies.accesstoken) {
      let result = await MeService.me(req, res);
      if (result instanceof Error && 'code' in result && result.code === 'NOT_AUTH') {
        return res.status(401).json(result);
      } else if (result instanceof Error) {
        l.error(result);
        return res
          .status(500)
          .json({ error: 'An internal server error occured!', code: 'INTERNAL' });
      }
      let copy = result.toObject();
      delete copy.password;
      return res.status(200).json(copy.categories);
    }
    return res
      .status(401)
      .json({ error: 'Missing required header accessToken.', code: 'NOT_AUTH' });
  }

  async create(req, res) {
    if (req.body && req.body.name && req.body.name.length > 20) {
      return res
        .status(422)
        .json({ error: 'Parameter name is too long! Keep under 20 characters!', code: 'TOO_LONG' });
    }
    if (req.body && req.body.name) {
      if (req.headers.accesstoken || req.cookies.accesstoken) {
        let result = await MeService.me(req, res);
        if (result instanceof Error && 'code' in result && result.code === 'NOT_AUTH') {
          return res.status(401).json(result);
        } else if (result instanceof Error) {
          l.error(result);
          return res
            .status(500)
            .json({ error: 'An internal server error occured!', code: 'INTERNAL' });
        }
        result = await CategoriesService.create(result, req.body).catch(err => err);
        if ((result.message && (result.message.slice(0, 6) === 'E11000')) || (result.code && result.code === 'ALREADY_EXISTS')) {
          return res
            .status(409)
            .json({ error: 'Category already exists!', code: 'ALREADY_EXISTS' });
        } else if (result instanceof Error) {
          if (result.code && result.code === 'MAX_NUM') {
            return res
              .status(400)
              .json({ error: 'Maximum number of categories reached! Please delete one before adding another.', code: result.code })
          }
          l.error(result);
          return res
            .status(500)
            .json({ error: 'An internal server error occured!', code: 'INTERNAL' });
        }
        return res
          .status(201)
          .json(result);
      }
      return res
        .status(401)
        .json({ error: 'Missing required header accessToken.', code: 'NOT_AUTH' });
    }
    return res
      .status(422)
      .json({ error: 'Missing required parameter.', code: 'INVALID_PARAMS' });
  }

  async remove(req, res) {
    if (req.body && req.body.id) {
      if (req.headers.accesstoken || req.cookies.accesstoken) {
        let result = await MeService.me(req, res);
        if (result instanceof Error && 'code' in result && result.code === 'NOT_AUTH') {
          return res.status(401).json(result);
        } else if (result instanceof Error) {
          l.error(result);
          return res
            .status(500)
            .json({ error: 'An internal server error occured!', code: 'INTERNAL' });
        }
        result = await CategoriesService
          .remove(result, req.body.id)
          .catch(error => error);
        if (result instanceof Error) {
          l.error(result);
          return res
            .status(500)
            .json({ error: 'An internal server error occured!', code: 'INTERNAL' });
        }
        return res.status(200).json(result);
      }
      return res
        .status(401)
        .json({ error: 'Missing required header accessToken.', code: 'NOT_AUTH' });
    }
    return res
      .status(422)
      .json({ error: 'Missing required parameter.', code: 'INVALID_PARAMS' });
  }
}
export default new Controller();
