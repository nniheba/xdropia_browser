import axios from 'axios';

const API_BASE_URL = 'https://app.xdropia.com/wp-json';

const ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/jwt-auth/v1/token`,
  VALIDATE: `${API_BASE_URL}/jwt-auth/v1/token/validate`,
  USER: `${API_BASE_URL}/wp/v2/users/me`,
  CREDENTIALS: `${API_BASE_URL}/xdropia/v1/credentials`,
  SESSIONS: `${API_BASE_URL}/xdropia/v1/sessions`
};

export const api = {
  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(ENDPOINTS.LOGIN, {
        username: email,
        password
      });
      
      localStorage.setItem('token', response.data.token);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  validateToken: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.post(
        ENDPOINTS.VALIDATE,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('token');
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.get(
        ENDPOINTS.USER,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  },
  
  getCredentials: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.get(
        ENDPOINTS.CREDENTIALS,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Get credentials error:', error);
      throw error;
    }
  },
  
  getCredentialById: async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.get(
        `${ENDPOINTS.CREDENTIALS}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Get credential by ID error:', error);
      throw error;
    }
  },
  
  checkActiveSessions: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.get(
        ENDPOINTS.SESSIONS,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Check sessions error:', error);
      throw error;
    }
  },
  
  registerSession: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.post(
        ENDPOINTS.SESSIONS,
        {
          device_name: navigator.userAgent,
          app_version: '1.0.0'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      localStorage.setItem('session_id', response.data.session_id);
      
      return response.data;
    } catch (error) {
      console.error('Register session error:', error);
      throw error;
    }
  },
  
  endSession: async () => {
    try {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('session_id');
      
      if (!token || !sessionId) {
        throw new Error('No token or session ID found');
      }
      
      const response = await axios.delete(
        `${ENDPOINTS.SESSIONS}/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      localStorage.removeItem('token');
      localStorage.removeItem('session_id');
      
      return response.data;
    } catch (error) {
      console.error('End session error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await api.endSession();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('session_id');
    }
  },
  
  getAllCredentials: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.get(
        `${ENDPOINTS.CREDENTIALS}/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Get all credentials error:', error);
      throw error;
    }
  },
  
  getUserStats: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/xdropia/v1/stats/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  },
  
  addCredential: async (credentialData: any) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.post(
        ENDPOINTS.CREDENTIALS,
        credentialData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Add credential error:', error);
      throw error;
    }
  },
  
  updateCredentialStatus: async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.patch(
        `${ENDPOINTS.CREDENTIALS}/${id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Update credential status error:', error);
      throw error;
    }
  },
  
  updateCredentialExpiration: async (id: string, expiresAt: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.patch(
        `${ENDPOINTS.CREDENTIALS}/${id}`,
        { expires_at: expiresAt },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Update credential expiration error:', error);
      throw error;
    }
  }
};

export default api;
