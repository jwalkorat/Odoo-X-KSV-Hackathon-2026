import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load credentials from localStorage on startup
    const savedToken = localStorage.getItem('galaxy_token');
    const savedUser = localStorage.getItem('galaxy_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Setup axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Create url encoded form data
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, role, email } = response.data;
      
      const userData = { username, email, role };
      
      localStorage.setItem('galaxy_token', access_token);
      localStorage.setItem('galaxy_user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true, role };
    } catch (error) {
      console.warn("Backend auth failed. Attempting mock auth bypass...");
      
      // MOCK LOGIN FALLBACK FOR HACKATHON OFFLINE TESTING
      let mockRole = 'OFFICER';
      if (username === 'manager') mockRole = 'MANAGER';
      if (username.startsWith('vendor')) mockRole = 'VENDOR';
      if (username === 'admin') mockRole = 'ADMIN';
      
      if (password === 'galaxy123' || password === 'admin123' || password === 'officer123' || password === 'manager123' || password === 'vendor123') {
        const mockToken = 'mock_jwt_token_for_hackathon';
        const userData = { username, email: `${username}@galaxy.com`, role: mockRole };
        
        localStorage.setItem('galaxy_token', mockToken);
        localStorage.setItem('galaxy_user', JSON.stringify(userData));
        
        setToken(mockToken);
        setUser(userData);
        
        return { success: true, role: mockRole, isMock: true };
      }
      
      throw new Error(error.response?.data?.detail || "Invalid credentials");
    }
  };

  const logout = () => {
    localStorage.removeItem('galaxy_token');
    localStorage.removeItem('galaxy_user');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
