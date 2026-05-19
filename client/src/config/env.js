/**
 * Create React App exposes only variables prefixed with REACT_APP_.
 * Restart `npm start` after changing any .env file.
 *
 * Load order (development): .env.development.local → .env.local → .env.development → .env
 * Load order (production build): .env.production.local → .env.local → .env.production → .env
 */

const raw = process.env.REACT_APP_SERVER_ORIGIN || 'http://localhost:5000'

/** Base URL of the API / Socket.IO server (no trailing slash) */
export const SERVER_ORIGIN = raw.replace(/\/$/, '')
