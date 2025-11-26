import React, {createContext, useContext, useState, useEffect} from 'react';
import {getAuthToken, logout as logoutApi} from '../api/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await getAuthToken();
      if (storedToken) {
        setToken(storedToken);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken: string) => {
    setToken(newToken);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await logoutApi();
    setToken(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{isLoggedIn, token, login, logout, isLoading}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
