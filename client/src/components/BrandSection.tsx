import React from 'react';

export const BrandSection: React.FC = () => {
  return (
    <aside className="brand-column" aria-label="Brand Overview">
      <div className="brand-header">
        <div className="brand-mark" aria-hidden="true" />
        <span className="brand-wordmark">MOCK</span>
      </div>

      <div className="brand-content">
        <div className="brand-badge">
          <span className="brand-pulse-dot" />
          <span>LOCAL DEMO ENVIRONMENT</span>
        </div>
        <h1 className="brand-statement">
          A minimal, production-conscious authentication application built for demonstration.
        </h1>
        <p className="brand-subtext">
          Designed with clean isolated architecture, secure cookie sessions, and local SQLite persistence.
        </p>
      </div>

      <div className="brand-footer">
        <div className="brand-spec-item">
          <span>STACK:</span>
          <span>REACT • EXPRESS • SQLITE</span>
        </div>
        <div className="brand-spec-item">
          <span>PORT:</span>
          <span>4000 / 5173</span>
        </div>
      </div>

      <div className="brand-geometry" aria-hidden="true" />
    </aside>
  );
};
