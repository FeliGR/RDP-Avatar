import React from "react";

const ChatPanelHeader = ({ onClose }) => {
  return (
    <div className="panel-header">
      <div className="panel-title-section">
        <h3>Chat Assistant</h3>
      </div>
      <button className="close-panel-btn" onClick={onClose} title="Close Chat">
        ×
      </button>
    </div>
  );
};

export default ChatPanelHeader;
