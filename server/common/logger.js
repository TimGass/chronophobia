import pino from 'pino';

const l = pino({
  name: process.env.APP_ID,
  level: process.env.LOG_LEVEL,
  customLevels: {
    high: 50,
    low: 10
  }
});

export default l;
