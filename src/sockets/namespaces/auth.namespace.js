import events from '../events.js';
import {
  registerUser,        
  loginUser,           
  logoutUser           
} from '../../services/auth.service.js';
import { refreshAccessToken } from '../../services/token.service.js';

export default function authNS(nsp, socket) {
    // 1️⃣ Registro de usuario
    socket.on(events.USER_REGISTER, async (payload) => {
      try {
        const { name, email, password, passwordConfirmed, role } = payload;
        const userData = await registerUser(name, email, password, passwordConfirmed, role);
        
        // unimos el socket a su sala privada
        socket.join(`user_${userData._id}`);
        
        // emitimos respuesta solo a este socket
        socket.emit(
          events.USER_REGISTER + events.SUCCESS,
          { user: userData }
        );
      } catch (err) {
        socket.emit(
          events.USER_REGISTER + events.ERROR,
          { message: err.message }
        );
      }
    });
  
    // 2️⃣ Login de usuario
    socket.on(events.USER_LOGIN, async (payload) => {
      try {
        const { email, password } = payload;
        const { user, accessToken, refreshToken } = await loginUser(email, password);
  
        // agregamos a la sala privada
        socket.join(`user_${user._id}`);
        
        socket.emit(
          events.USER_LOGIN + events.SUCCESS,
          { user, accessToken, refreshToken }
        );
      } catch (err) {
        socket.emit(
          events.USER_LOGIN + events.ERROR,
          { message: err.message }
        );
      }
    });
  
    // 3️⃣ Refrescar token
    socket.on(events.USER_REFRESH, async (payload) => {
      try {
        const { refreshToken } = payload;
        const newAccessToken = await refreshAccessToken(refreshToken);
        
        socket.emit(
          events.USER_REFRESH + events.SUCCESS,
          { accessToken: newAccessToken }
        );
      } catch (err) {
        socket.emit(
          events.USER_REFRESH + events.ERROR,
          { message: err.message }
        );
      }
    });
  
    // 4️⃣ Logout de usuario
    socket.on(events.USER_LOGOUT, async () => {
      try {
        const userId = socket.user._id;
        await logoutUser(userId);
  
        // sale de su sala y desconecta
        socket.leave(`user_${userId}`);
        socket.emit(events.USER_LOGOUT + events.SUCCESS, { ok: true });
        socket.disconnect(true);
      } catch (err) {
        socket.emit(
          events.USER_LOGOUT + events.ERROR,
          { message: err.message }
        );
      }
    });
  }