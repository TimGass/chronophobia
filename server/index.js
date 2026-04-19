import './common/env.js';
import Server from './common/server.js';
import routes from './routes.js';

const newServer = await new Server().router(routes).listen(process.env.PORT, process.env.HOST);

export default newServer;
