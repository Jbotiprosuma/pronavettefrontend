// src/components/AlertMessages.jsx
import React, { useEffect } from 'react';

const AlertMessages = ({ alert, setAlert }) => {
    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => {
                setAlert(null); // Cache l'alerte après 5 secondes
            }, 5000);
            return () => clearTimeout(timer); // Nettoyage du timer
        }
    }, [alert, setAlert]);

    if (!alert) {
        return null;
    }

    const alertClass = `alert alert-${alert.type} alert-dismissible fade show`;

    return (
        <div className="container p-2">
            <div className={alertClass} role="alert">
                <strong>{alert.message}</strong>
                <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close"></button>
            </div>
        </div>
    );
};

export default AlertMessages;