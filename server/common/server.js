import Express from 'express';
import * as path from 'path';
import bodyParser from 'body-parser';
import * as http from 'http';
import * as os from 'os';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';
import rateLimit from 'express-rate-limit';
import swaggerify from './swagger/index.js';
import l from './logger.js';
import { fileURLToPath } from 'url';
import fs from "fs";

const app = new Express();

export default class ExpressServer {
  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const root = path.normalize(`${__dirname}/../..`);
    app.set('appPath', `${root}client`);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser(process.env.SESSION_SECRET));
    app.use(Express.static(`${root}/public`));
    app.enable("trust proxy"); // because we are behind reverse proxy (cyclic)
  }

  router(routes) {
    swaggerify(app, routes);
    return this;
  }

  async listen(port = process.env.PORT || 3000) {
    const client = Redis.createClient({ url: process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379' });
    await client.connect();
    const limiter = rateLimit({
      store: new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
      }),
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 20 // limit each IP to 20 requests per minute
    });
    app.use(limiter);
    mongoose.set("strictQuery", false);
    await mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.7xrgs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`);
    const welcome = p => () => l.info(`up and running in ${process.env.NODE_ENV || 'development'} @: ${os.hostname()} on port: ${p}}`);
    http.createServer(app).listen(port, welcome(port));
    return app;
  }
}
