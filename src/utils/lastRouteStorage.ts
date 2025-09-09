// Last route storage utilities for localStorage
const LAST_ROUTE_KEY = 'lastVisitedRoute';

export const saveLastRoute = (pathname: string, search?: string) => {
  try {
    const fullPath = search ? `${pathname}${search}` : pathname;
    // Don't save certain routes like onboarding or error pages
    const excludedRoutes = ['/about', '/impressum', '/privacy', '/policies', '*'];
    
    if (!excludedRoutes.includes(pathname)) {
      localStorage.setItem(LAST_ROUTE_KEY, fullPath);
    }
  } catch (error) {
    console.error('Error saving last route:', error);
  }
};

export const getLastRoute = (): string | null => {
  try {
    return localStorage.getItem(LAST_ROUTE_KEY);
  } catch (error) {
    console.error('Error loading last route:', error);
    return null;
  }
};

export const clearLastRoute = () => {
  try {
    localStorage.removeItem(LAST_ROUTE_KEY);
  } catch (error) {
    console.error('Error clearing last route:', error);
  }
};