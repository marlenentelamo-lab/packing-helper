import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders the navbar', () => {
  render(<App />);
  const linkElement = screen.getByText(/packing helper/i);
  expect(linkElement).toBeInTheDocument();
});

test('redirects unauthenticated users away from protected routes', async () => {
  window.history.pushState({}, '', '/tasks');

  render(<App />);

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });
});
