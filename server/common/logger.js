import pino from 'pino';

const l = pino({
  name: process.env.APP_ID,
  level: process.env.NODE_ENV,
});

export default l;
