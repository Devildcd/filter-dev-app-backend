import socketAuth from '../middlewares/socketAuth.middleware.js';
import authNS from './namespaces/auth.namespace.js';

export function initSockets(io) {
  // Aplica auth a *todas* las namespaces
  const nsa = io.of('/auth');
  nsa.use(socketAuth);
  nsa.on('connection', socket => authNS(nsa, socket));

}
