/**
 * 错误类导出
 */

const GitCodeError = require('./gitcode-error');
const ApiError = require('./api-errors');
const ConfigError = require('./config-errors');
const ValidationError = require('./validation-errors');
const NetworkError = require('./network-error');
const AuthenticationError = require('./authentication-error');
const NotFoundError = require('./not-found-error');
const RateLimitError = require('./rate-limit-error');

module.exports = {
  GitCodeError,
  ApiError,
  ConfigError,
  ValidationError,
  NetworkError,
  AuthenticationError,
  NotFoundError,
  RateLimitError
};