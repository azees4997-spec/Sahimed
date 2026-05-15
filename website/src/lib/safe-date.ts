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

    // Proper way to get a Date object "representing" the time in a specific timezone
    // for formatting purposes:
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    
    const istD = new Date(
      Number(getPart('year')),
      Number(getPart('month')) - 1,
      Number(getPart('day')),
      Number(getPart('hour')),
      Number(getPart('minute')),
      Number(getPart('second'))
    );

    return format(istD, formula);
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
