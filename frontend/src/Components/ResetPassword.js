import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api.js';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(
    token ? '' : 'This password reset link is invalid or expired.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/reset-password', { token, password });
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <h1 className="auth-title">Choose a new password</h1>
      {message ? (
        <>
          <p role="status" className="panel-state">{message}</p>
          <p className="auth-switch"><Link to="/login">Go to login</Link></p>
        </>
      ) : (
        <>
          <form className="item-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="field-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                disabled={!token || isSubmitting}
              />
            </div>
            <div className="form-field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="field-input"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
                disabled={!token || isSubmitting}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary auth-submit-button"
              disabled={!token || isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Reset password'}
            </button>
          </form>
          {error && <p role="alert" className="panel-error">{error}</p>}
          <p className="auth-switch"><Link to="/login">Back to login</Link></p>
        </>
      )}
    </div>
  );
}

export default ResetPassword;
