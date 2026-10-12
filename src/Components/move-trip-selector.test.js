import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MoveTripSelector from './move-trip-selector';

const move = { id: 3, name: 'Moving house', target_date: '2026-11-01' };
const trip = { id: 7, name: 'Summer holiday', trip_date: '2026-12-01' };

function jsonResponse(data, ok = true) {
  return {
    ok,
    headers: { get: () => 'application/json' },
    json: async () => data,
  };
}

test('edits a move using its update endpoint', async () => {
  const updatedMove = { ...move, name: 'New home', target_date: '2026-11-15' };
  const fetchMock = jest.fn((url, options) => {
    if (url.endsWith('/moves/3') && options?.method === 'PUT') {
      return Promise.resolve(jsonResponse(updatedMove));
    }
    if (url.endsWith('/moves')) {
      return Promise.resolve(jsonResponse([move]));
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  render(<MoveTripSelector />);

  await screen.findByRole('button', { name: 'Edit Moving house' });
  fireEvent.click(screen.getByRole('button', { name: 'Edit Moving house' }));
  fireEvent.change(screen.getByPlaceholderText('e.g. Move to Cape Town'), {
    target: { value: 'New home' },
  });
  fireEvent.change(screen.getByLabelText('Target Date:'), {
    target: { value: '2026-11-15' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save Move' }));

  await screen.findByRole('button', { name: 'Edit New home' });
  expect(fetchMock).toHaveBeenCalledWith('/api/moves/3', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'New home', target_date: '2026-11-15' }),
    credentials: 'include',
  });
});

test('deletes a trip and removes it from the list', async () => {
  const fetchMock = jest.fn((url, options) => {
    if (url.endsWith('/trips/7') && options?.method === 'DELETE') {
      return Promise.resolve(jsonResponse({ message: 'Trip deleted successfully' }));
    }
    if (url.endsWith('/moves')) {
      return Promise.resolve(jsonResponse([]));
    }
    if (url.endsWith('/trips')) {
      return Promise.resolve(jsonResponse([trip]));
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  render(<MoveTripSelector />);
  fireEvent.click(screen.getByRole('button', { name: 'Trips' }));

  await screen.findByRole('button', { name: 'Delete Summer holiday' });
  fireEvent.click(screen.getByRole('button', { name: 'Delete Summer holiday' }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith('/api/trips/7', {
      method: 'DELETE',
      headers: {},
      credentials: 'include',
    });
  });
  expect(await screen.findByText('No trips yet. Add one above.')).toBeInTheDocument();
});
