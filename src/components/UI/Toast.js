// src/components/UI/Toast.js
import React, { useState, useEffect } from 'react';
import './Toast.css';

const Toast = ({ type, message, duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          if (onClose) onClose();
        }, 300); // Allow time for exit animation
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Allow time for exit animation
  };

  return (
    <div className={`toast toast-${type} ${visible ? 'toast-visible' : 'toast-hidden'}`}>
      <div className="toast-icon">
        {type === 'success' && '✓'}
        {type === 'error' && '!'}
        {type === 'info' && 'i'}
        {type === 'warning' && '⚠'}
      </div>
      <div className="toast-content">
        <p>{message}</p>
      </div>
      <button className="toast-close" onClick={handleClose}>×</button>
    </div>
  );
};

export default Toast;
