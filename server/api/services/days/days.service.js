import moment from 'moment';
import l from '../../../common/logger.js';
import { Day, Activity } from '../../../common/models/Day.js';
import Token from '../../../common/models/AccessToken.js';

class CategoriesService {
  async get(req) {
    l.info(`${this.constructor.name}.get()`);
    const token = await Token
      .findOne({ token: req.headers.accesstoken || req.cookies.accesstoken }).catch(err => {
        const error = new Error();
        error.error = 'Token not valid! Log in User!';
        error.code = 'NOT_AUTH';
        return error;
      });
    if (!token) {
      const error = new Error();
      error.error = 'Token not valid! Log in User!';
      error.code = 'NOT_AUTH';
      return error;
    }
    const days = Day.find({ user: token.user }).catch(error => error);
    if (days instanceof Error) {
      return days;
    }
    return days;
  }

  async create(user, body) {
    l.info(`${this.constructor.name}.create()`);
    const dayConfig = {
      startedAt: `${moment(body.startedAt).utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS)}Z`,
      user: user._id,
    };
    const result = await Day.create(dayConfig).catch(error => error);
    return result;
  }

  async update(user, body) {
    l.info(`${this.constructor.name}.patch(${body.id})`);
    const day = await Day.findOne({ _id: body.id }).catch(error => error);
    if (day instanceof Error || !day || (day.user.toString() !== user._id.toString())) {
      const error = new Error('No such day found!');
      error.error = 'No such day found!';
      error.code = 'NOT_EXIST';
      return error;
    }
    let error;
    let activitiesCopy = body.activities;
    const activities = day.activities.map(item => {
      const temp = body.activities.filter(secondItem => {
        if (secondItem.id) {
          return (item._id.toString() === secondItem.id.toString());
        }
        return false;
      });
      if (temp.length === 1) {
        if (temp[0].startedAt) {
          if (moment(temp[0].startedAt, `${moment.HTML5_FMT.DATETIME_LOCAL_MS}Z`, true)
            .isValid()) {
            item.startedAt = temp[0].startedAt;
          } else {
            const newError = new Error('Dates are not formatted properly!');
            newError.error = 'Dates are not formatted properly!';
            newError.code = 'INVALID_DATE';
            error = newError;
          }
        }
        if (temp[0].endedAt) {
          if (moment(temp[0].endedAt, `${moment.HTML5_FMT.DATETIME_LOCAL_MS}Z`, true)
            .isValid()) {
            item.endedAt = temp[0].endedAt;
          } else {
            const newError = new Error('Dates are not formatted properly!');
            newError.error = 'Dates are not formatted properly!';
            newError.code = 'INVALID_DATE';
            error = newError;
          }
        }
        if (temp[0].category) {
          const categoryArray = user.categories.filter(category =>
            (category._id.toString() === temp[0].category.toString()));
          if (categoryArray.length !== 1) {
            const newError = new Error('User does not have request category!');
            newError.error = 'User does not have category!';
            newError.code = 'INVALID_CATEGORY';
            newError.id = temp[0].category;
            error = newError;
          } else {
            item.category = categoryArray[0].name;
          }
        }
        if (temp[0].action === 'REMOVE') {
          // remove the item from our copy to avoid activity does not exist error because it was removed from activities array by filter.
          activitiesCopy.splice(activitiesCopy.indexOf(temp[0]), 1);
          item.action = temp[0].action;
        }
      }
      return item;
    }).filter(item => (item.action !== 'REMOVE'));
    const newActivitiesArray = activitiesCopy.filter(activity =>
      activities.filter(activitySecond => {
        if (activity.id) {
          return (activity.id.toString() === activitySecond._id.toString());
        }
        return false;
      }).length === 0);
    const newActivities = newActivitiesArray.map(activity => {
      if (activity.startedAt && activity.category) {
        let activityConfig = {};
        const categoryArray = user.categories.filter(category =>
          (category._id.toString() === activity.category.toString()));
        if (categoryArray.length !== 1) {
          const newError = new Error('User does not have requested category!');
          newError.error = 'User does not have category!';
          newError.code = 'INVALID_CATEGORY';
          newError.id = activity.category;
          error = newError;
        } else {
          if (activity.id) {
            // even if all data is valid throw error if non-matching id is provided
            const newError = new Error(`No such activity with id of ${activity.id} found!`);
            newError.error = `No such activity with id of ${activity.id} found!`;
            newError.code = 'ACTIVITY_NOT_EXIST';
            newError.id = activity.id;
            error = newError;
          }
          if (activity.endedAt) {
            if (moment(activity.endedAt, `${moment.HTML5_FMT.DATETIME_LOCAL_MS}Z`, true)
              .isValid()) {
              activityConfig.endedAt = activity.endedAt;
            } else {
              const newError = new Error('Dates are not formatted properly!');
              newError.error = 'Dates are not formatted properly!';
              newError.code = 'INVALID_DATE';
              error = newError;
            }
          }
          if (moment(activity.startedAt, `${moment.HTML5_FMT.DATETIME_LOCAL_MS}Z`, true)
            .isValid()) {
            if (activity.endedAt && !activityConfig.endedAt) {
              return null;
            }
            activityConfig.startedAt = activity.startedAt;
            activityConfig.category = categoryArray[0].name;
            const temp = new Activity(activityConfig);
            if (temp instanceof Error) error = temp;
            return temp;
            // If category and started at are valid and no other errors exist,
            // create activity and return before date error is thrown.
          }
          const newError = new Error('Dates are not formatted properly!');
          newError.error = 'Dates are not formatted properly!';
          newError.code = 'INVALID_DATE';
          error = newError;
        }
      } else if (activity.id) {
        // would trip if removed activities were not removed from activitiesCopy.
        // Now it catches only activities with non-matching ids.
        const newError = new Error(`No such activity with id of ${activity.id} found!`);
        newError.error = `No such activity with id of ${activity.id} found!`;
        newError.code = 'ACTIVITY_NOT_EXIST';
        newError.id = activity.id;
        error = newError;
      }
      return null;
    }).filter(activity => (activity !== null));
    day.activities = activities.concat(newActivities);
    if (error) {
      return error;
    }
    const result = day.save().catch(error => error);
    if (result instanceof Error) {
      return result;
    }
    return result;
  }

  async remove(req) {
    l.info(`${this.constructor.name}.remove(${req.body.id})`);
    const token = await Token
      .findOne({ token: req.headers.accesstoken || req.cookies.accesstoken }).catch(err => {
        const error = new Error();
        error.error = 'Token not valid! Log in User!';
        error.code = 'NOT_AUTH';
        return error;
      });
    if (!token) {
      const error = new Error();
      error.error = 'Token not valid! Log in User!';
      error.code = 'NOT_AUTH';
      return error;
    }
    const day = await Day.findOne({ _id: req.body.id }).catch(error => error);
    if (day instanceof Error || !day || (day.user.toString() !== token.user.toString())) {
      const error = new Error('No such day found!');
      error.error = 'No such day found!';
      error.code = 'NOT_EXIST';
      return error;
    }
    day.remove();
    const response = { message: `Day with id ${day._id} and all associated data successfully removed!`, code: 'REMOVED' };
    return response;
  }
}

export default new CategoriesService();
