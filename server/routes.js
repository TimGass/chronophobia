import LoginController from './api/controllers/login';
import MeController from './api/controllers/me';
import EmailsController from './api/controllers/identities/emails';
import UsernamesController from './api/controllers/identities/usernames';

import UsersRouter from './api/controllers/users/router';
import CategoriesRouter from './api/controllers/categories/router';
import ActivitiesRouter from './api/controllers/activities/router';
import DaysRouter from './api/controllers/days/router';

export default function routes(app) {
  app.use('/api/users', UsersRouter);
  app.use('/api/categories', CategoriesRouter);
  app.post('/api/login', LoginController.login);
  app.get('/api/me', MeController.me);
  app.get('/api/identities/emails', EmailsController.get);
  app.get('/api/identities/usernames', UsernamesController.get);
  app.use('/api/activities', ActivitiesRouter);
  app.use('/api/days', DaysRouter);
}
