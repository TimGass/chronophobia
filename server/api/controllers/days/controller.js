import moment from 'moment';
import DaysService from '../../services/days/days.service';
import MeService from '../../services/me.service';
import l from '../../../common/logger';

export class Controller {
  async get(req, res) {
    if (req.headers.accesstoken || req.cookies.accesstoken) {
      const result = await DaysService
        .get(req)
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

  async create(req, res) {
    if (req.body && req.body.startedAt) {
      if (moment(req.body.startedAt, `${moment.HTML5_FMT.DATETIME_LOCAL_MS}Z`, true).isValid()) {
        if (req.headers.accesstoken || req.cookies.accesstoken) {
          const user = await MeService.me(req).catch(error => error);
          if (user instanceof Error && 'code' in user && user.code === 'NOT_AUTH') {
            return res.status(401).json(user);
          } else if (user instanceof Error) {
            l.error(user);
            return res
              .status(500)
              .json({ error: 'An internal server error occured!', code: 'INTERNAL' });
          }
          const result = await DaysService
            .create(user, req.body)
            .catch(error => error);
          if (result instanceof Error && (result.message && (result.message.slice(0, 6) === 'E11000'))) {
            return res
              .status(422)
              .json({ error: 'Day already exists!', code: 'ALREADY_EXISTS' });
          } else if (result instanceof Error) {
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
        .json({ error: 'startedAt parameter is not a valid date-time string!', code: 'INVALID_DATE' });
    }
    return res
      .status(422)
      .json({ error: 'Missing required parameter.', code: 'INVALID_PARAMS' });
  }

  async patch(req, res) {
    if (req.body && req.body.id && req.body.activities && req.body.activities.length > 0) {
      if (req.headers.accesstoken || req.cookies.accesstoken) {
        const user = await MeService.me(req).catch(error => error);
        if (user instanceof Error && 'code' in user && user.code === 'NOT_AUTH') {
          return res.status(401).json(user);
        } else if (user instanceof Error) {
          l.error(user);
          return res
            .status(500)
            .json({ error: 'An internal server error occured!', code: 'INTERNAL' });
        }
        const result = await DaysService
          .update(user, req.body)
          .catch(error => error);
        if (result instanceof Error && (result.code === 'NOT_EXIST' || result.code === 'INVALID_CATEGORY' || result.code === 'INVALID_DATE' || result.code === 'ACTIVITY_NOT_EXIST')) {
          if (result.id) {
            return res
              .status(422)
              .json({ error: result.error, code: result.code, id: result.id });
          }
          return res
            .status(422)
            .json({ error: result.error, code: result.code });
        } else if (result instanceof Error) {
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

  async remove(req, res) {
    if (req.body && req.body.id) {
      if (req.headers.accesstoken || req.cookies.accesstoken) {
        const result = await DaysService
          .remove(req)
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
