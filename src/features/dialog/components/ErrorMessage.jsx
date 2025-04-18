import React from "react";

/**
 * Component for displaying error messages in the dialog
 * @param {Object} props - Component props
 * @param {string} props.message - The error message to display
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
