import React from "react";
import { useTranslation } from "react-i18next";

const ChatPanelHeader = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="panel-header">
      <div className="panel-title-section">
        <h3>{t('chat.chatAssistant')}</h3>
      </div>
      <button className="close-panel-btn" onClick={onClose} title={t('chat.closeChat')}>
        ×
      </button>
    </div>
  );
};

export default ChatPanelHeader;
