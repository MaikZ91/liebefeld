
/**
 * Generiert Initialen aus einem Benutzernamen
 */
export const getInitials = (name: string): string => {
  if (!name) return '?';
  
  // Bei mehrteiligen Namen die ersten Buchstaben jedes Worts nehmen
  const parts = name.split(/\s+/).filter(Boolean);
  
  if (parts.length === 0) return '?';
  
  if (parts.length === 1) {
    // Bei einzeiligen Namen die ersten beiden Buchstaben oder nur den ersten
    const namePart = parts[0];
    if (namePart.length >= 2) {
      return namePart.substring(0, 2).toUpperCase();
    }
    return namePart.substring(0, 1).toUpperCase();
  }
  
  // Bei mehrteiligen Namen die Initialen der ersten beiden Teile
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};
