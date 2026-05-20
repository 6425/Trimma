export type UserRole = 'admin' | 'salon_owner' | 'agent' | 'customer';

export const RolePermissions = {
  admin: {
    allowedRoutes: ['/admin', '/dashboard', '/reports', '/settings'],
    canAccess: (route: string) => true, // Admins can access everything
  },
  salon_owner: {
    allowedRoutes: ['/dashboard', '/salon', '/appointments', '/staff'],
    canAccess: (route: string) => route.startsWith('/dashboard') || route.startsWith('/salon') || route.startsWith('/appointments') || route.startsWith('/staff'),
  },
  agent: {
    allowedRoutes: ['/agent', '/leads', '/dashboard'],
    canAccess: (route: string) => route.startsWith('/agent') || route.startsWith('/leads') || route.startsWith('/dashboard'),
  },
  customer: {
    allowedRoutes: ['/profile', '/bookings'],
    canAccess: (route: string) => route.startsWith('/profile') || route.startsWith('/bookings'),
  }
};

export const getRequiredRolesForRoute = (route: string): UserRole[] => {
  const requiredRoles: UserRole[] = [];
  
  // Public routes require no roles
  if (route === '/' || route === '/login' || route === '/register' || route.startsWith('/public')) {
    return [];
  }

  // Check which roles can access this route
  (Object.keys(RolePermissions) as UserRole[]).forEach(role => {
    if (RolePermissions[role].canAccess(route)) {
      requiredRoles.push(role);
    }
  });

  return requiredRoles;
};

export const hasPermission = (userRole: UserRole | null | undefined, route: string): boolean => {
  if (!userRole) return false;
  return RolePermissions[userRole]?.canAccess(route) || false;
};
