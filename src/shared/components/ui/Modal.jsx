/**
 * Shared Modal component
 * Reusable modal with portal rendering and accessibility features
 */
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "medium",
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = "",
}) => {
  const modalRef = useRef(null);
  const overlayRef = useRef(null);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && closeOnEsc) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeOnEsc, onClose]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="shared-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div
        className={`shared-modal shared-modal--${size} ${className}`}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {title && (
          <div className="shared-modal__header">
            <h2 id="modal-title" className="shared-modal__title">
              {title}
            </h2>
            <button className="shared-modal__close" onClick={onClose} aria-label="Close modal">
              ×
            </button>
          </div>
        )}
        <div className="shared-modal__content">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
