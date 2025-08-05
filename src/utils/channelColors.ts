export const getChannelColor = (groupType: 'ausgehen' | 'sport' | 'kreativität') => {
  switch (groupType) {
    case 'sport':
      return {
        primary: 'sport-primary',
        secondary: 'sport-secondary',
        border: 'border-sport-primary',
        bg: 'bg-sport-primary',
        hover: 'hover:bg-sport-secondary',
        focus: 'focus:border-sport-secondary focus:ring-sport-primary',
        text: 'text-sport-primary',
        shadow: 'shadow-sport-primary/10'
      };
    case 'kreativität':
      return {
        primary: 'kreativität-primary',
        secondary: 'kreativität-secondary',
        border: 'border-kreativität-primary',
        bg: 'bg-kreativität-primary',
        hover: 'hover:bg-kreativität-secondary',
        focus: 'focus:border-kreativität-secondary focus:ring-kreativität-primary',
        text: 'text-kreativität-primary',
        shadow: 'shadow-kreativität-primary/10'
      };
    case 'ausgehen':
      return {
        primary: 'ausgehen-primary',
        secondary: 'ausgehen-secondary',
        border: 'border-ausgehen-primary',
        bg: 'bg-ausgehen-primary',
        hover: 'hover:bg-ausgehen-secondary',
        focus: 'focus:border-ausgehen-secondary focus:ring-ausgehen-primary',
        text: 'text-ausgehen-primary',
        shadow: 'shadow-ausgehen-primary/10'
      };
    default:
      return {
        primary: 'primary',
        secondary: 'primary',
        border: 'border-primary',
        bg: 'bg-primary',
        hover: 'hover:bg-primary',
        focus: 'focus:border-primary focus:ring-primary',
        text: 'text-primary',
        shadow: 'shadow-primary/10'
      };
  }
};