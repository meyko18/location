// DingLoginService.js
import request from './request';
import pathMap from './pathMap';

class DingLoginService {
  async getOAuthUrl() {
    try {
      const response = await request.get(pathMap.getOAuthUrl);
      const { oauthUrl } = response.data;
      return oauthUrl;
    } catch (error) {
      console.error('Error getting OAuth URL:', error);
      throw error;
    }
  }

}

export default new DingLoginService();
