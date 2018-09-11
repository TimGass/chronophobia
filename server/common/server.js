import Express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import * as os from 'os';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';
import rateLimit from 'express-rate-limit';
import swaggerify from './swagger';
import l from './logger';

const app = new Express();

export default class ExpressServer {
  constructor() {
    const root = path.normalize(`${__dirname}/../..`);
    app.set('appPath', `${root}client`);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser(process.env.SESSION_SECRET));
    app.use(Express.static(`${root}/public`));
    app.enable("trust proxy"); // because we are behind reverse proxy (Heroku)
    const limiter = rateLimit({
      store: new RedisStore({
        client: Redis.createClient(process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379', { no_ready_check: true }),
      }),
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 20 // limit each IP to 20 requests per minute
    });
    app.use(limiter);
  }

  router(routes) {
    swaggerify(app, routes);
    return this;
  }

  listen(port = process.env.PORT || 3000) {
    mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@ds119442.mlab.com:19442/chronophobia`);
    const welcome = p => () => l.info(`up and running in ${process.env.NODE_ENV || 'development'} @: ${os.hostname()} on port: ${p}}`);
    http.createServer(app).listen(port, welcome(port));
    return app;
  }
}
