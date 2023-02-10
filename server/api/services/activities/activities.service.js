import moment from 'moment';
import l from '../../../common/logger.js';
import { Activity, Day } from '../../../common/models/Day.js';

class ActivitiesService {
  async create(user, body) {
    let category;
    if (body.action !== 'STOP') {
      category = user.categories.filter(item => item._id.toString() === body.category);
      if (category.length !== 1) {
        const newError = new Error('User does not have request category!');
        newError.error = 'User does not have category!';
        newError.code = 'INVALID_CATEGORY';
        return newError;
      }
    }
    let currentDay;
    if (user.currentDay) {
      currentDay = moment(user.currentDay.startedAt)
        .utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS);
    }
    const userDay = moment(body.currentMidnight)
      .utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS);
    if (!userDay || (userDay !== currentDay)) {
      let activitiesLength;
      let newActivity;
      if (user.currentDay && user.currentDay.activities) {
        activitiesLength = user.currentDay.activities.length;
        let activityConfig;
        if (activitiesLength > 0 &&
          !user.currentDay.activities[user.currentDay.activities.length - 1].endedAt) {
          user.currentDay.activities[user.currentDay.activities.length - 1].endedAt = `${moment(currentDay).add(24, 'hours').subtract(1, 'milliseconds').utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS)}Z`;
          const checkError = user.currentDay.save().catch(error => error);
          if (checkError instanceof Error) return checkError;
          activityConfig = {
            startedAt: `${userDay}Z`,
            category: user.currentDay.activities[user.currentDay.activities.length - 1].category,
          };
          newActivity = await new Activity(activityConfig);
        }
      }
      const newDay = {
        startedAt: `${moment(body.currentMidnight).utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS)}Z`,
        user: user._id,
      };
      let dayResult = await Day.findOne(newDay).catch(error => error);
      if (dayResult === null) {
        dayResult = await Day.create(newDay).catch(error => error);
      }
      if (dayResult instanceof Error) return dayResult;
      user.currentDay = dayResult._id;
      const temp = await user.save()
        .then(userObj => {
          let clone = userObj.toObject();
          delete clone.password;
          return clone;
        }).catch(error => error);
      if (temp instanceof Error) return temp;
      user.currentDay = dayResult;
      if (activitiesLength && activitiesLength > 0) {
        user.currentDay.activities.push(newActivity);
        const checkError = await user.currentDay.save().catch(error => error);
        if (checkError instanceof Error) return checkError;
      }
    }
    l.info(`${this.constructor.name}.create()`);
    if (user.currentDay.activities.length > 0 &&
      !user.currentDay.activities[user.currentDay.activities.length - 1].endedAt) {
      user.currentDay.activities[user.currentDay.activities.length - 1].endedAt = `${moment(body.startedAt).subtract(1, 'milliseconds').utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS)}Z`;
    }
    if (body.action === 'STOP') {
      const result = await user.currentDay.save().catch(err => err);
      if (result instanceof Error) return result;
      return result;
    }
    const activityData = {
      startedAt: body.startedAt,
      category: category[0].name,
    };
    const activity = await new Activity(activityData);
    if (activity instanceof Error) return activity;
    user.currentDay.activities.push(activity);
    const result = await user.currentDay.save().catch(err => err);
    if (result instanceof Error) return result;
    return result;
  }
}

export default new ActivitiesService();
