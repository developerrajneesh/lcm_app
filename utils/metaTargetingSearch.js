import axios from "axios";

/**
 * Search Meta Marketing API for detailed targeting
 * @param {string} accessToken - Facebook access token
 * @param {string} type - Search type: 'adworkposition', 'adinterest', or 'adworkemployer'
 * @param {string} query - Search query
 * @param {string} version - API version (default: v24.0)
 * @returns {Promise<Object>} Search results
 */
export async function searchDetailedTargeting(accessToken, type, query, version = 'v24.0') {
  try {
    if (!accessToken) {
      return {
        success: false,
        error: 'Access token is required',
        data: []
      };
    }

    if (!type || !query) {
      return {
        success: false,
        error: 'Type and query are required',
        data: []
      };
    }

    const validTypes = ['adworkposition', 'adinterest', 'adworkemployer'];
    if (!validTypes.includes(type)) {
      return {
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        data: []
      };
    }

    const url = `https://graph.facebook.com/${version}/search`;
    const params = {
      type: type,
      q: query,
      access_token: accessToken
    };

    const response = await axios.get(url, { params });

    return {
      success: true,
      data: response.data.data || [],
      paging: response.data.paging || null
    };
  } catch (error) {
    console.error('Meta Marketing API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || 'Failed to search Meta Marketing API',
      data: []
    };
  }
}

/**
 * Search Work Positions
 * @param {string} accessToken - Facebook access token
 * @param {string} query - Search query
 * @param {string} version - API version (default: v24.0)
 */
export async function searchWorkPosition(accessToken, query, version = 'v24.0') {
  return searchDetailedTargeting(accessToken, 'adworkposition', query, version);
}

/**
 * Search Interests
 * @param {string} accessToken - Facebook access token
 * @param {string} query - Search query
 * @param {string} version - API version (default: v24.0)
 */
export async function searchInterest(accessToken, query, version = 'v24.0') {
  return searchDetailedTargeting(accessToken, 'adinterest', query, version);
}

/**
 * Search Employers/Companies
 * @param {string} accessToken - Facebook access token
 * @param {string} query - Search query
 * @param {string} version - API version (default: v24.0)
 */
export async function searchEmployer(accessToken, query, version = 'v24.0') {
  return searchDetailedTargeting(accessToken, 'adworkemployer', query, version);
}

