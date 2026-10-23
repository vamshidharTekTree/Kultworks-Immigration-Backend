import JWT from 'jsonwebtoken';
import { tokenSecret, portalTokenSecret } from '../configs/env.config.js';
import { AsyncWrapper, ResponseHandler } from '../utils/wrappers/responseWrapper.util.js';

export const AuthenticateReq = AsyncWrapper(async (req, res, next) => {
  const userToken = req.cookies?.token || req.headers['x-access-token'];
  if (!userToken) ResponseHandler.error(5, 401, 'Token not found');

  let payload;
  try {
    payload = JWT.verify(userToken, tokenSecret);
  } catch {
    ResponseHandler.error(5, 401, 'Invalid or expired token');
  }

  req.user = payload;
  next();
});

export const AuthenticatePortal = AsyncWrapper(async (req, res, next) => {
  const portalToken = req.cookies?.portal_token || req.headers['x-portal-token'];
  if (!portalToken) ResponseHandler.error(5, 401, 'Portal token not found');

  let payload;
  try {
    payload = JWT.verify(portalToken, portalTokenSecret);
  } catch {
    ResponseHandler.error(5, 401, 'Invalid or expired portal token');
  }

  req.portalUser = payload;
  next();
});

export const authorizeRoles = (...roles) =>
  AsyncWrapper(async (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      ResponseHandler.error(26, 403, 'Role not authorized');
    }
    next();
  });
