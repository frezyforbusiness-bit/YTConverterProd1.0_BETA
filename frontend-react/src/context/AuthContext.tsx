import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { adminService } from '../services/admin.service';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    if (adminService.isAuthenticated()) {
      setIsAuthenticated(true);
      // Try to get username from token or load profile
      adminService.getProfile().then((profile) => {
        setUsername(profile.username);
      }).catch(() => {
        // Token might be invalid, logout
        adminService.logout();
        setIsAuthenticated(false);
      });
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await adminService.login({ username, password });
    setIsAuthenticated(true);
    setUsername(response.username);
  };

  const logout = () => {
    adminService.logout();
    setIsAuthenticated(false);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

