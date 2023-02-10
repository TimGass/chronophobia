import LoginController from './api/controllers/login.js';
import MeController from './api/controllers/me.js';
import EmailsController from './api/controllers/identities/emails.js';
import UsernamesController from './api/controllers/identities/usernames.js';

import UsersRouter from './api/controllers/users/router.js';
import CategoriesRouter from './api/controllers/categories/router.js';
import ActivitiesRouter from './api/controllers/activities/router.js';
import DaysRouter from './api/controllers/days/router.js';

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
