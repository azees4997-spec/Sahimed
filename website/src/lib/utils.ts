import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { generateSlug } from "./slug"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { generateSlug }
