import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import api from '../api.js';
import Signup from './Signup';

jest.mock('../api.js', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

test('signs the user in and navigates to the app after signup', async () => {
  const user = { id: 1, name: 'New User', email: 'new@example.com' };
  const onAuthSuccess = jest.fn();
  api.post.mockResolvedValue({ user, message: 'Account created.' });

  render(
    <MemoryRouter
      initialEntries={['/signup']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/signup" element={<Signup onAuthSuccess={onAuthSuccess} />} />
        <Route path="/" element={<h1>Dashboard</h1>} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: user.name } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: user.email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

  await waitFor(() => {
    expect(onAuthSuccess).toHaveBeenCalledWith(user);
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });
});
