/**
 * Checks if a Firebase error indicates a missing index
 * @param error The error from Firebase
 * @returns Human-readable error message
 */
export const getFirebaseErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  // Check if it's a Firebase error with a code
  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to perform this action';
      case 'resource-exhausted':
        return 'Too many requests. Please try again later';
      case 'not-found':
        return 'The requested resource was not found';
      case 'already-exists':
        return 'This resource already exists';
      case 'failed-precondition':
        if (error.message && error.message.includes('index')) {
          return 'This query requires a database index to be created';
        }
        return 'Operation failed due to a precondition not being met';
      default:
        return error.message || 'An error occurred with Firebase';
    }
  }
  
  // For non-Firebase errors
  return error.message || 'An unexpected error occurred';
};

/**
 * Helper function to safely perform a Firebase query that may need an index
 * Falls back to a simpler query if index error occurs
 */
export const safeFetchWithFallback = async (
  mainFetchFn: () => Promise<any>,
  fallbackFetchFn: () => Promise<any>
): Promise<any> => {
  try {
    // Try the main query first (which might need an index)
    return await mainFetchFn();
  } catch (error) {
    console.warn('Main query failed, trying fallback:', error);
    
    // Fall back to the simpler query if the main one fails
    return await fallbackFetchFn();
  }
}; 