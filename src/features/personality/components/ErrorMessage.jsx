import React from 'react';

/**
 * Error message component for displaying errors in personality components
 */
const ErrorMessage = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="error-message" role="alert">
      {message}
    </div>
  );
};

export default ErrorMessage;