import { AuthUserContext } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserContext;
    }
  }
}
