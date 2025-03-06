// src/components/UI/ToastContainer.js
import React, { useState, useCallback } from 'react';
import Toast from './Toast';
import './ToastContainer.css';

// Create a context to manage toasts
import { createContext, useContext } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration = 5000) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, type, message, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration) => {
    return addToast('success', message, duration);
  }, [addToast]);

  const showError = useCallback((message, duration) => {
    return addToast('error', message, duration);
  }, [addToast]);

  const showInfo = useCallback((message, duration) => {
    return addToast('info', message, duration);
  }, [addToast]);

  const showWarning = useCallback((message, duration) => {
    return addToast('warning', message, duration);
  }, [addToast]);

  return (
    <ToastContext.Provider 
      value={{ 
        showSuccess, 
        showError, 
        showInfo, 
        showWarning, 
        removeToast 
      }}
    >
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
