import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'pos_auth';

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage immediately
    const checkAuth = () => {
      try {
        const savedAuth = localStorage.getItem(STORAGE_KEY);
        if (savedAuth) {
          setAuth(JSON.parse(savedAuth));
          return;
        }

        const legacyUser = localStorage.getItem('pos_user');
        if (legacyUser) {
          setAuth({ user: { username: legacyUser }, token: null });
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (authPayload) => {
    try {
      const normalized =
        typeof authPayload === 'string'
          ? { user: { username: authPayload }, token: null }
          : authPayload;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      localStorage.removeItem('pos_user');
      setAuth(normalized);
    } catch (error) {
      console.error('Error saving auth:', error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('pos_user');
      setAuth(null);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  };

  const isAuthenticated = !!auth;
  const user = auth?.user || null;
  const token = auth?.token || null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, isLoading }}>
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


