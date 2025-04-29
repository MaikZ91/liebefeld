
/**
 * Get initials from a name string
 */
export const getInitials = (name: string): string => {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
};
