import React, { useState, useEffect } from 'react';

const Alert = ({ message, type, onClose, autoClose = true }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-700';
      case 'error':
        return 'bg-red-100 border-red-500 text-red-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'info':
      default:
        return 'bg-blue-100 border-blue-500 text-blue-700';
    }
  };

  if (!visible) return null;

  return (
    <div className={`border-l-4 p-4 mb-4 ${getBackgroundColor()}`} role="alert">
      <p>{message}</p>
      <button 
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
        className="absolute top-0 right-0 p-2"
      >
        &times;
      </button>
    </div>
  );
};

export default Alert;