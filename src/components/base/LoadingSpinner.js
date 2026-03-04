// src/components/LoadingSpinner.js
import React from 'react';
import './LoadingSpinner.css'; // Crée ce fichier CSS

const LoadingSpinner = () => {
  return (
    <div className="spinner-overlay">
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner; 