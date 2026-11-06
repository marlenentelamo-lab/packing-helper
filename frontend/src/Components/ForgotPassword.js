import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/request-password-reset', { email });
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <h1 className="auth-title">Reset your password</h1>
      <p>Enter your account email and we’ll send you a reset link if it’s registered.</p>
      <form className="item-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="reset-email">Email</label>
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            className="field-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary auth-submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      {message && <p role="status" className="panel-state">{message}</p>}
      {error && <p role="alert" className="panel-error">{error}</p>}
      <p className="auth-switch"><Link to="/login">Back to login</Link></p>
    </div>
  );
}

export default ForgotPassword;
