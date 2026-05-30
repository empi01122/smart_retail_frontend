import { useAuth } from './useAuth';

export const useRole = () => {
  const { user, isAuthenticated, loading } = useAuth();

  return {
    role: user?.role || null,
    isAdmin: isAuthenticated && user?.role === 'admin',
    isEmployee: isAuthenticated && user?.role === 'employee',
    isAuthenticated,
    loading
  };
};

export default useRole;