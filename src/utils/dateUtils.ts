
import { format, startOfDay, isSameDay, parseISO, isToday, Locale } from 'date-fns';

// Normalize date to start of day for consistent comparison
export const normalizeDate = (date: Date): Date => {
  return startOfDay(date);
};

// Check if two dates are the same day
export const isSameDayDate = (date1: Date, date2: Date): boolean => {
  return isSameDay(normalizeDate(date1), normalizeDate(date2));
};

// Parse ISO string to Date, normalizing to start of day
export const parseAndNormalizeDate = (dateString: string): Date => {
  try {
    if (!dateString) throw new Error("Empty date string");
    const parsed = parseISO(dateString);
    if (isNaN(parsed.getTime())) throw new Error("Invalid date");
    return normalizeDate(parsed);
  } catch (error) {
    console.error(`Error parsing date ${dateString}:`, error);
    return normalizeDate(new Date()); // Default to today
  }
};

// Format date for display in German locale
export const formatDateForDisplay = (date: Date, formatString: string, locale: Locale): string => {
  return format(date, formatString, { locale });
};

// Check if a date is today
export const isDateToday = (date: Date): boolean => {
  return isToday(date);
};

// Debug function to help diagnose date issues
export const debugDate = (date: Date | string, label: string = "Date"): void => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    console.log(`${label}: ${dateObj.toISOString()} (${format(dateObj, 'yyyy-MM-dd')})`);
  } catch (error) {
    console.error(`Error debugging ${label}:`, error, date);
  }
};

