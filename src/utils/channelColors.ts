export const getChannelColor = (groupType: 'ausgehen' | 'sport' | 'kreativität') => {
  switch (groupType) {
    case 'sport':
      return {
        primary: 'hsl(var(--ausgehen-primary))',
        secondary: 'hsl(var(--ausgehen-secondary))',
        borderStyle: { borderColor: 'hsl(var(--ausgehen-primary))' },
        bgStyle: { backgroundColor: 'hsl(var(--ausgehen-primary))' },
        hoverStyle: { backgroundColor: 'hsl(var(--ausgehen-secondary))' },
        textStyle: { color: 'hsl(var(--ausgehen-primary))' },
        shadowStyle: { boxShadow: '0 4px 6px -1px hsl(var(--ausgehen-primary) / 0.1)' }
      };
    case 'kreativität':
      return {
        primary: 'hsl(var(--kreativität-primary))',
        secondary: 'hsl(var(--kreativität-secondary))',
        borderStyle: { borderColor: 'hsl(var(--kreativität-primary))' },
        bgStyle: { backgroundColor: 'hsl(var(--kreativität-primary))' },
        hoverStyle: { backgroundColor: 'hsl(var(--kreativität-secondary))' },
        textStyle: { color: 'hsl(var(--kreativität-primary))' },
        shadowStyle: { boxShadow: '0 4px 6px -1px hsl(var(--kreativität-primary) / 0.1)' }
      };
    case 'ausgehen':
      return {
        primary: 'hsl(var(--sport-primary))',
        secondary: 'hsl(var(--sport-secondary))',
        borderStyle: { borderColor: 'hsl(var(--sport-primary))' },
        bgStyle: { backgroundColor: 'hsl(var(--sport-primary))' },
        hoverStyle: { backgroundColor: 'hsl(var(--sport-secondary))' },
        textStyle: { color: 'hsl(var(--sport-primary))' },
        shadowStyle: { boxShadow: '0 4px 6px -1px hsl(var(--sport-primary) / 0.1)' }
      };
    default:
      return {
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--primary))',
        borderStyle: { borderColor: 'hsl(var(--primary))' },
        bgStyle: { backgroundColor: 'hsl(var(--primary))' },
        hoverStyle: { backgroundColor: 'hsl(var(--primary))' },
        textStyle: { color: 'hsl(var(--primary))' },
        shadowStyle: { boxShadow: '0 4px 6px -1px hsl(var(--primary) / 0.1)' }
      };
  }
};