import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage immediately
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('pos_user');
        if (savedUser) {
          setUser(savedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (username) => {
    try {
      localStorage.setItem('pos_user', username);
      setUser(username);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error saving auth:', error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('pos_user');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}


