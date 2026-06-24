const BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  get: async (endpoint) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.message || 'Something went wrong');
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (error) {
      if (error.status !== 401 && error.status !== 403) {
        console.error(`API GET error on ${endpoint}:`, error);
      }
      throw error;
    }
  },

  post: async (endpoint, body) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.message || 'Something went wrong');
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (error) {
      if (error.status !== 401 && error.status !== 403) {
        console.error(`API POST error on ${endpoint}:`, error);
      }
      throw error;
    }
  },

  put: async (endpoint, body) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.message || 'Something went wrong');
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (error) {
      if (error.status !== 401 && error.status !== 403) {
        console.error(`API PUT error on ${endpoint}:`, error);
      }
      throw error;
    }
  },

  delete: async (endpoint) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.message || 'Something went wrong');
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (error) {
      if (error.status !== 401 && error.status !== 403) {
        console.error(`API DELETE error on ${endpoint}:`, error);
      }
      throw error;
    }
  },

  // Custom method for file downloads (like Excel/CSV reports)
  download: async (endpoint, filename) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const data = await response.json();
        const error = new Error(data.message || 'Download failed');
        error.status = response.status;
        throw error;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (error.status !== 401 && error.status !== 403) {
        console.error(`Download error on ${endpoint}:`, error);
      }
      throw error;
    }
  }
};
