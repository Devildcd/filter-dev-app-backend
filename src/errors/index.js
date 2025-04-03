import { AppError } from '../errors/appError.js';

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

export class UserRegistrationError extends AppError {
  constructor(message = 'User registration failed', details = null) {
    super(message, 400, 'USER_REGISTRATION_FAILED', details);
  }
}

export class AccountLockedError extends AppError {
  constructor(message = 'Account is locked', unlockTime) {
    super(message, 403, 'ACCOUNT_LOCKED', { unlockTime });
  }
}

export class TokenVerificationError extends AppError {
  constructor(message = 'Token verification failed') {
    super(message, 401, 'VERIFICATION_FAILED');
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = 'Token has expired') {
    super(message, 403, 'TOKEN_EXPIRED');
  }
}

export class TokenGenerationError extends AppError {
  constructor(message = 'Error generating token') {
    super(message, 500, 'GENERATION_FAILED');
  }
}

export class CookieSettingError extends AppError {
  constructor(message = 'Failed to set cookie') {
    super(message, 500, 'COOKIE_SETTING_FAILED');
  }
}
