import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { api } from '../api.ts';
import type { User } from '../types.ts';

interface WelcomeViewProps {
  user: User;
  onLogout: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ user, onLogout }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await api.logout();
    setIsLoggingOut(false);
    onLogout();
  };

  return (
    <div className="welcome-container" role="main">
      <div className="welcome-card">
        <div className="welcome-header">
          <div>
            <h1 className="welcome-title" id="welcome-user-heading">
              Welcome, {user.name}
            </h1>
            <p className="welcome-subtitle">You have successfully authenticated.</p>
          </div>
          <div className="brand-mark" style={{ width: '8px', height: '24px' }} aria-hidden="true" />
        </div>

        <div className="user-details">
          <div className="detail-row">
            <span className="detail-label">Name</span>
            <span className="detail-value" id="user-profile-name">{user.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email</span>
            <span className="detail-value" id="user-profile-email">{user.email}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Session Status</span>
            <span className="detail-value" style={{ color: 'var(--success-text)', fontSize: '0.75rem' }}>
              ● ACTIVE (HttpOnly Cookie)
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          id="logout-button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <>
              <span className="spinner" />
              <span>Logging out...</span>
            </>
          ) : (
            <>
              <LogOut size={16} />
              <span>Log out</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
