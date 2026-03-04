import React from 'react';

const Loading = ({ loading }) => {
    if (!loading) return null;

    return (
        <div className="loading-overlay d-flex justify-content-center align-items-center">
            <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    );
};

export default Loading;
