import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { generateSlug } from "./slug"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { generateSlug }

export function formatInIST(date: Date | string | number) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
