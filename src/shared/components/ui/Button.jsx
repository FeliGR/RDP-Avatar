/**
 * Shared UI Button component
 * Reusable button with consistent styling and behavior
 */
import React from "react";
import "./Button.css";

const Button = ({
  children,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  ...props
}) => {
  const baseClass = "shared-button";
  const classes = [
    baseClass,
    `${baseClass}--${variant}`,
    `${baseClass}--${size}`,
    disabled && `${baseClass}--disabled`,
    loading && `${baseClass}--loading`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className={`${baseClass}__spinner`}>⟳</span>}
      <span className={`${baseClass}__content`}>{children}</span>
    </button>
  );
};

export default Button;
