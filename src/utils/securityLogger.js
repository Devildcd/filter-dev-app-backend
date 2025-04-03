export const logSecurityEvent = (eventType, metadata = {}) => {
    console.log(`[SECURITY] ${eventType}`, {
      timestamp: new Date(),
      ...metadata
    });
    // Add integration with your monitoring system here
  };