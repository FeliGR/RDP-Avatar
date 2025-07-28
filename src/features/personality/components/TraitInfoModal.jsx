import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { formatTrait } from "../../../shared/utils";
import "./TraitInfoModal.css";

const TraitInfoModal = ({ trait, detailedInfo, onClose }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("click", handleClickOutside);

    // Focus management
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  if (!detailedInfo) {
    return null;
  }

  return createPortal(
    <div className="trait-modal-container" aria-modal="true" role="dialog">
      <div className="trait-modal-overlay" ref={overlayRef}></div>
      <div className={`trait-modal ${trait}`} ref={modalRef} tabIndex={-1}>
        <div className="trait-modal-header">
          <div className="trait-modal-icon">{detailedInfo.icon || "?"}</div>
          <h3 className="trait-modal-title">{detailedInfo.title || formatTrait(trait)}</h3>
          <button className="trait-modal-close" onClick={handleCloseClick} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <div className="trait-modal-content">
          <div className="trait-modal-section">
            <h4 className="trait-modal-section-title">{t('personality.modal.whatIsIt')}</h4>
            <p className="trait-modal-text">{detailedInfo.description}</p>
          </div>

          <div className="trait-modal-section">
            <h4 className="trait-modal-section-title">{t('personality.modal.howItAffects')}</h4>
            <p className="trait-modal-text">{detailedInfo.effects}</p>
          </div>

          <div className="trait-modal-section">
            <h4 className="trait-modal-section-title">{t('personality.modal.examples')}</h4>
            <div className="trait-modal-examples">
              <div className="trait-modal-example">
                <h5 className="trait-modal-example-title">{t('personality.modal.high')} {formatTrait(trait)}</h5>
                <p className="trait-modal-example-text">{detailedInfo.highExample}</p>
              </div>
              <div className="trait-modal-example">
                <h5 className="trait-modal-example-title">{t('personality.modal.low')} {formatTrait(trait)}</h5>
                <p className="trait-modal-example-text">{detailedInfo.lowExample}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="trait-modal-footer">
          <button className="trait-modal-button" onClick={handleCloseClick}>
            {t('personality.modal.close')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default TraitInfoModal;
