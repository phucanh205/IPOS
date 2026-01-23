import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'pos_auth';

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage immediately
    const checkAuth = async () => {
      try {
        const savedAuth = sessionStorage.getItem(STORAGE_KEY);
        if (savedAuth) {
          const parsed = JSON.parse(savedAuth);
          setAuth(parsed);

          const token = parsed?.token;
          const role = parsed?.user?.role;

          if (token && !role) {
            try {
              const res = await fetch('/api/auth/me', {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (res.ok) {
                const user = await res.json();
                const next = { ...parsed, user };
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                setAuth(next);
              } else if (res.status === 401) {
                sessionStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem('pos_user');
                setAuth(null);
              }
            } catch (e) {
              // ignore
            }
          }

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

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('pos_user');
      setAuth(normalized);
    } catch (error) {
      console.error('Error saving auth:', error);
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
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


