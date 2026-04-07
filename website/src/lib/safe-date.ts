import { format, isValid } from 'date-fns';

/**
 * Safely format a date, preventing RangeError: Invalid time value.
 * @param date The date to format (Date, string, number, or Firestore Timestamp)
 * @param formula The format string (e.g., 'MMM dd, yyyy')
 * @param fallback The fallback string if the date is invalid (default: 'N/A')
 */
export function safeFormat(
  date: any, 
  formula: string, 
  fallback: string = 'N/A'
): string {
  try {
    if (!date) return fallback;

    let d: Date;

    // Handle Firestore Timestamp
    if (typeof date.toDate === 'function') {
      d = date.toDate();
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
    }

    if (!isValid(d)) return fallback;

    return format(d, formula);
  } catch (error) {
    console.error('SafeFormat Error:', error);
    return fallback;
  }
}

/**
 * Safely convert a value to a Date object.
 */
export function toSafeDate(date: any): Date | null {
  if (!date) return null;
  
  let d: Date;
  if (typeof date.toDate === 'function') {
    d = date.toDate();
  } else if (date instanceof Date) {
    d = date;
  } else {
    d = new Date(date);
  }

  return isValid(d) ? d : null;
}
