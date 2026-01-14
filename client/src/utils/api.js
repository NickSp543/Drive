const API_URL = "http://localhost:3000/api"; 
//getting the token from local storage
 export const getToken = () => localStorage.getItem('token');
//saving the token
export const setToken = (token) => localStorage.setItem('token', token);
//deleting the token
export const removeToken = () => localStorage.removeItem('token');

// api fetch function with token handling 
export const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // adding the token to the headers if it exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
// handling unauthorized response
    if (response.status === 401) {
      removeToken();
      // Dispatch custom event to notify contexts to clear
      window.dispatchEvent(new Event('unauthorized'));
      window.location.href = '/login'; // redirection to login screen
      return null;
    }
    
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};