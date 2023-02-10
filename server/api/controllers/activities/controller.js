import moment from 'moment';
import ActivitiesService from '../../services/activities/activities.service.js';
import MeService from '../../services/me.service.js';
import l from '../../../common/logger.js';

export class Controller {
  async create(req, res) {
    if (req.body && req.body.startedAt &&
      (req.body.action || req.body.category) &&
      req.body.currentMidnight) {
      if (moment(req.body.startedAt, `${moment.HTML5_FMT.DATETIME_LOCAL_MS}Z`, true)
        .isValid() && moment(req.body.currentMidnight, `${moment.HTML5_FMT.DATETIME_LOCAL_MS}Z`, true)
        .isValid()) {
        if (req.headers.accesstoken || req.cookies.accesstoken) {
          let result = await MeService.me(req, res).catch(error => error);
          if (result instanceof Error && 'code' in result && result.code === 'NOT_AUTH') {
            return res.status(401).json(result);
          } else if (result instanceof Error) {
            l.error(result);
            return res
              .status(500)
              .json({ error: 'An internal server error occured!', code: 'INTERNAL' });
          }
          result = await ActivitiesService.create(result, req.body).catch(err => err);
          if (result instanceof Error && result.code === 'INVALID_CATEGORY') {
            return res
              .status(422)
              .json({ error: result.error, code: result.code });
          } else if (result instanceof Error) {
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
        .json({ error: 'Dates are not formatted properly!', code: 'INVALID_DATE' });
    }
    return res
      .status(422)
      .json({ error: 'Missing required parameter.', code: 'INVALID_PARAMS' });
  }
}
export default new Controller();
