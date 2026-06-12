import { useAuth } from './useAuth';

export const useRole = () => {
  const { user, isAuthenticated, loading } = useAuth();

  const rawRole = user?.role || null;
  const actualRole = (rawRole === 'admin' || rawRole === 'owner') ? 'proprietor' : rawRole;
  const isActualTechnician = isAuthenticated && actualRole === 'technician';

  let role = actualRole;
  if (isAuthenticated) {
    const savedRole = localStorage.getItem('active_role');
    if (savedRole) {
      role = (savedRole === 'admin' || savedRole === 'owner') ? 'proprietor' : savedRole;
    }
  }

  return {
    role,
    actualRole,
    isActualTechnician,
    isProprietor: isAuthenticated && role === 'proprietor',
    isTechnician: isAuthenticated && role === 'technician',
    isAdmin: isAuthenticated && (role === 'proprietor' || role === 'technician'),
    isEmployee: isAuthenticated && role === 'employee',
    isAuthenticated,
    loading
  };
};

export default useRole;