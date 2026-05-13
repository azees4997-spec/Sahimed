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

    // FORCING IST (+5:30) for display consistency
    const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
    
    // We use UTC methods or format with a fixed offset if we want to be absolute,
    // but adding the offset to the timestamp and then formatting is the simplest 'force' method.
    // NOTE: This assumes the input was UTC.
    return format(istDate, formula);
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
