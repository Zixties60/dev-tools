// Token expiration time in seconds (30 days)
export const TOKEN_EXPIRATION = 30 * 24 * 60 * 60;

// Redis key prefixes
export const REDIS_KEYS = {
  TOKEN: 'webhook:token:',
  REQUEST: 'webhook:request:',
};