import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import api from '../api.js';

jest.mock('../api.js', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

afterEach(() => {
  jest.clearAllMocks();
});

test('requests a password reset with the supplied email', async () => {
  api.post.mockResolvedValue({
    message: 'If an account exists for that email, a password reset link has been sent.',
  });
  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'person@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

  expect(await screen.findByRole('status')).toHaveTextContent('If an account exists');
  expect(api.post).toHaveBeenCalledWith('/request-password-reset', {
    email: 'person@example.com',
  });
});

test('submits the token and matching new password', async () => {
  api.post.mockResolvedValue({ message: 'Password has been reset. You can now log in.' });
  render(
    <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText('New password'), {
    target: { value: 'new-password-123' },
  });
  fireEvent.change(screen.getByLabelText('Confirm new password'), {
    target: { value: 'new-password-123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('/reset-password', {
      token: 'valid-token',
      password: 'new-password-123',
    });
  });
  expect(await screen.findByRole('status')).toHaveTextContent('Password has been reset');
});

test('does not submit when passwords do not match', async () => {
  render(
    <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText('New password'), {
    target: { value: 'new-password-123' },
  });
  fireEvent.change(screen.getByLabelText('Confirm new password'), {
    target: { value: 'different-password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match.');
  expect(api.post).not.toHaveBeenCalled();
});
