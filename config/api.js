// API Configuration
// Change BACKEND_URL here to update it across the entire app

const BACKEND_URL = 'https://api.leadscraftmarketing.com';
const API_BASE_URL = `${BACKEND_URL}/api/v1`;
const SOCKET_URL = BACKEND_URL;

// ES6 exports (for TypeScript/ES6 modules)
export { BACKEND_URL, API_BASE_URL, SOCKET_URL };

// CommonJS exports (for require() syntax)
module.exports = {
  BACKEND_URL,
  API_BASE_URL,
  SOCKET_URL,
};

// Default export for convenience
export default {
  BACKEND_URL,
  API_BASE_URL,
  SOCKET_URL,
};

