import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize text input to prevent XSS/HTML injection
 * Removes HTML tags and limits length
 */
export function sanitizeText(text: string | null | undefined, maxLength: number = 500): string | null {
  if (!text || typeof text !== 'string') return null;

  // Remove HTML tags and special characters that could be dangerous
  const sanitized = text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')   // Decode HTML entities (for legitimate content)
    .replace(/&gt;/g, '>')
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();

  // Limit length
  if (sanitized.length > maxLength) {
    return sanitized.substring(0, maxLength);
  }

  return sanitized;
}
