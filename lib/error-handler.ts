// Centralized error handling to prevent console spam
const errorLog = new Set<string>();
const MAX_ERROR_LOG_SIZE = 50;

export function logError(error: Error | string, context?: string) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorKey = `${context || 'unknown'}:${errorMessage}`;
  
  // Prevent duplicate error logging
  if (errorLog.has(errorKey)) {
    return;
  }
  
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context || 'Error'}]`, error);
    errorLog.add(errorKey);
    
    // Clean up old errors to prevent memory leak
    if (errorLog.size > MAX_ERROR_LOG_SIZE) {
      const firstKey = errorLog.values().next().value;
      errorLog.delete(firstKey);
    }
  }
}

export function logWarning(message: string, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[${context || 'Warning'}]`, message);
  }
}


