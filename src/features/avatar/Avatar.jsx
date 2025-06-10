import React from 'react';
import AvatarViewer from './components/AvatarViewer';
import './Avatar.css';

/**
 * Main Avatar Feature Component
 * 
 * This component serves as the main entry point for the avatar feature,
 * providing a clean interface for avatar rendering and management.
 */
const Avatar = (props) => {
  return <AvatarViewer {...props} />;
};

export default Avatar;
