import Express from 'express';
import * as path from 'path';
import bodyParser from 'body-parser';
import * as http from 'http';
import * as os from 'os';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import l from './logger.js';
import { fileURLToPath } from 'url';
import fs from "fs";
import YAML from 'yaml'

const app = new Express();

export default class ExpressServer {
  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const root = path.normalize(`${__dirname}/../..`);
    const file = fs.readFileSync(`${__dirname}/swagger/Api.yaml`, 'utf-8');
    app.set('appPath', `${root}client`);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser(process.env.SESSION_SECRET));
    app.use(Express.static(`${root}/public`));
    app.use('/api/spec', (req, res) => res.status(200).json(YAML.parse(file)))
    app.enable("trust proxy"); // because we are behind reverse proxy (cyclic)
  }

  router(routes) {
    routes(app)
    return this;
  }

  async listen(port = process.env.PORT || 3000, host = process.env.HOST || '0.0.0.0') {
    mongoose.set("strictQuery", false);
    await mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.7xrgs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`);
    const welcome = p => () => l.info(`up and running in ${process.env.NODE_ENV || 'development'} @: ${os.hostname()} on port: ${p}}`);
    http.createServer(app).listen(port, host, welcome(port));
    return app;
  }
}
