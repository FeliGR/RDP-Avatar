import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { formatTrait } from '../../../shared/utils';

/**
 * Modal dialog component for displaying detailed trait information
 */
const TraitInfoModal = ({ trait, traitInfo, isOpen, onClose }) => {
  const modalRef = useRef(null);
  const overlayRef = useRef(null);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Close when clicking outside the modal
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      // Small delay to avoid immediate trigger
      setTimeout(() => {
        overlayRef.current?.addEventListener('mousedown', handleOutsideClick);
      }, 10);
    }

    return () => {
      overlayRef.current?.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Focus trap for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const detailedInfo = traitInfo || {};

  // Create portal to render modal at the document body level
  return createPortal(
    <div className="trait-modal-container" aria-modal="true" role="dialog">
      <div className="trait-modal-overlay" ref={overlayRef}></div>
      <div 
        className={`trait-modal ${trait}`} 
        ref={modalRef}
        tabIndex={-1}
      >
        <div className="trait-modal-header">
          <div className="trait-modal-icon">{detailedInfo.icon || '?'}</div>
          <h3 className="trait-modal-title">{detailedInfo.title || formatTrait(trait)}</h3>
          <button className="trait-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        
        <div className="trait-modal-content">
          <div className="trait-modal-section">
            <h4 className="trait-modal-section-title">What is it?</h4>
            <p className="trait-modal-text">{detailedInfo.description}</p>
          </div>
          
          <div className="trait-modal-section">
            <h4 className="trait-modal-section-title">How it affects AI responses</h4>
            <p className="trait-modal-text">{detailedInfo.effects}</p>
          </div>
          
          <div className="trait-modal-section">
            <h4 className="trait-modal-section-title">Examples</h4>
            <div className="trait-modal-examples">
              <div className="trait-modal-example">
                <h5 className="trait-modal-example-title">High {formatTrait(trait)}</h5>
                <p className="trait-modal-example-text">{detailedInfo.highExample}</p>
              </div>
              <div className="trait-modal-example">
                <h5 className="trait-modal-example-title">Low {formatTrait(trait)}</h5>
                <p className="trait-modal-example-text">{detailedInfo.lowExample}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="trait-modal-footer">
          <button className="trait-modal-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TraitInfoModal;