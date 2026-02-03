// utils/axiosClient.ts
import axios from 'axios';
import { API_BASE_URL } from '../lib/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL, // adjust as needed
});

// Add request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    // Do NOT attach token for login request
    if (!config.url?.includes('/login')) {
      const tokenString = localStorage.getItem('token');
      let token: { AccessToken?: string } | null = null;
      if (tokenString) {
        try {
          token = JSON.parse(tokenString);
        } catch (e) {
          token = null;
        }
      }
      if (token && token.AccessToken) {
        config.headers.Authorization = `Bearer ${token.AccessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling 401 Unauthorized
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Remove token and mark logout
      localStorage.removeItem('token');
      localStorage.setItem('logoutSuccess', 'true');
      // Optionally, clear any other user state here
      // Redirect to sign-in page
      window.location.replace('/#/login');
      // Optionally, you could also reload the page
      // window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
