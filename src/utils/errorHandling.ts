/**
 * Utility functions for error handling
 */

import { ApiError } from '../types/n8n.js';

/**
 * Format an error object into a human-readable string
 *
 * @param error The error object to format
 * @returns A human-readable error message
 */
export function formatError(error: unknown): string {
  // Handle ApiError objects
  if (typeof error === 'object' && error !== null) {
    // Check if it's an ApiError from our n8n types
    if ('status' in error && 'message' in error) {
      const apiError = error as ApiError;
      let errorMessage = `API Error (${apiError.status}): ${apiError.message}`;

      // Add error details if available
      if (apiError.error) {
        if (typeof apiError.error === 'string') {
          errorMessage += ` - ${apiError.error}`;
        } else if (typeof apiError.error === 'object') {
          try {
            const errorDetails = JSON.stringify(apiError.error, null, 2);
            errorMessage += `\nDetails: ${errorDetails}`;
          } catch (_e) {
            errorMessage += '\nDetails: [Complex error object]';
          }
        }
      }

      return errorMessage;
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return error.message;
    }

    // Handle other objects
    try {
      return JSON.stringify(error, null, 2);
    } catch (_e) {
      return '[Unserializable error object]';
    }
  }

  // Handle primitive error values
  return String(error);
}
