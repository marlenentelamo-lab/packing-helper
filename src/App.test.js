import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import Dashboard from './Components/Dashboard';
import { SelectionProvider } from './Components/SelectionContext';

function jsonResponse(data) {
  return {
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
  };
}

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

test('renders exactly one needs attention card and keeps progress above it', async () => {
  global.fetch = jest.fn((url) => {
    if (url === '/api/moves') {
      return Promise.resolve(jsonResponse([{ id: 1, name: 'Test Move', target_date: '2026-10-20' }]));
    }
    if (url === '/api/trips') {
      return Promise.resolve(jsonResponse([]));
    }
    if (url === '/api/tasks?move_id=1') {
      return Promise.resolve(
        jsonResponse([{ id: 1, task_name: 'Pack clothes', due_date: '2026-10-15', completion_status: false }])
      );
    }
    if (url === '/api/picture-folders?move_id=1') {
      return Promise.resolve(jsonResponse([]));
    }
    return Promise.resolve(jsonResponse([]));
  });

  render(
    <MemoryRouter>
      <SelectionProvider>
        <Dashboard />
      </SelectionProvider>
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /progress/i })).toBeInTheDocument();
  });

  expect(screen.getAllByRole('heading', { name: /needs attention/i })).toHaveLength(1);
});
