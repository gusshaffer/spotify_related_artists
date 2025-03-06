// src/components/UI/LoadingSpinner.js
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text, overlay = false }) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  const spinnerClass = sizeClasses[size] || sizeClasses.medium;
  
  return (
    <div className={`spinner-container ${overlay ? 'spinner-overlay' : ''}`}>
      <div className={`spinner ${spinnerClass}`}></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
