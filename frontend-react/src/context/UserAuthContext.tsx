import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  userService,
  type UserAuthResponse,
  type UserProfile,
} from '../services/user.service';

interface UserAuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<UserAuthResponse>;
  register: (email: string, password: string) => Promise<UserAuthResponse>;
  logout: () => void;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const useUserAuth = (): UserAuthContextType => {
  const ctx = useContext(UserAuthContext);
  if (!ctx) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return ctx;
};

interface UserAuthProviderProps {
  children: ReactNode;
}

export const UserAuthProvider: React.FC<UserAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (userService.isAuthenticated()) {
      setIsAuthenticated(true);
      userService
        .getProfile()
        .then((profile) => {
          setUser(profile);
        })
        .catch(() => {
          userService.logout();
          setIsAuthenticated(false);
          setUser(null);
        });
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const result = await userService.login({ email, password });
    setIsAuthenticated(true);
    // Refresh profile from /me to keep a single shape
    const profile = await userService.getProfile();
    setUser(profile);
    return result;
  };

  const handleRegister = async (email: string, password: string) => {
    const result = await userService.register({ email, password });
    setIsAuthenticated(true);
    const profile = await userService.getProfile();
    setUser(profile);
    return result;
  };

  const handleLogout = () => {
    userService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <UserAuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

