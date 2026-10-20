import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from '../api.ts';
import type { User } from '../types.ts';

interface SignInFormProps {
  onSuccess: (user: User) => void;
  onSwitchToSignUp: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSuccess, onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    const response = await api.login(email.trim(), password);
    setIsLoading(false);

    if (response.error || !response.data?.user) {
      setErrorMessage(response.error || 'Authentication failed. Please check your credentials.');
      return;
    }

    onSuccess(response.data.user);
  };

  const handleFillDemo = () => {
    setEmail('aman@gmail.com');
    setPassword('123456');
    setFieldErrors({});
    setErrorMessage(null);
  };

  return (
    <div className="auth-panel">
      <h2 className="auth-heading">Welcome back</h2>
      <p className="auth-subheading">Enter your credentials to access your account.</p>

      {errorMessage && (
        <div className="form-alert" role="alert" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="signin-email">
            Email address
          </label>
          <div className="input-wrapper">
            <input
              id="signin-email"
              type="email"
              autoComplete="email"
              className={`form-input ${fieldErrors.email ? 'has-error' : ''}`}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
              }}
              disabled={isLoading}
            />
          </div>
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signin-password">
            Password
          </label>
          <div className="input-wrapper">
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`form-input ${fieldErrors.password ? 'has-error' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
              }}
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </div>

        <button
          type="submit"
          className="btn-primary"
          id="signin-submit-button"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Demo Credentials Helper */}
      <div className="demo-card">
        <div className="demo-info">
          <span className="demo-title">Default Demo Account</span>
          <span className="demo-creds">aman@gmail.com / 123456</span>
        </div>
        <button
          type="button"
          className="demo-fill-btn"
          id="fill-demo-credentials-button"
          onClick={handleFillDemo}
          title="Auto-fill default demo account credentials"
        >
          Fill Demo
        </button>
      </div>

      <div className="auth-switch">
        <span>Don't have an account?</span>
        <button
          type="button"
          className="auth-switch-link"
          id="switch-to-signup-button"
          onClick={onSwitchToSignUp}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};
