import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MoveTripSelector from './MoveTripSelector';

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
    if (url.endsWith('/tasks?move_id=3')) {
      return Promise.resolve(jsonResponse([]));
    }
    if (url.endsWith('/moves')) {
      return Promise.resolve(jsonResponse([move]));
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  render(
    <MemoryRouter>
      <MoveTripSelector />
    </MemoryRouter>
  );

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
    if (url.endsWith('/tasks?trip_id=7')) {
      return Promise.resolve(jsonResponse([]));
    }
    if (url.endsWith('/trips')) {
      return Promise.resolve(jsonResponse([trip]));
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  render(
    <MemoryRouter>
      <MoveTripSelector />
    </MemoryRouter>
  );
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

test('adds a trip and marks it as completed', async () => {
  const newTrip = { id: 8, name: 'Weekend away', trip_date: '2026-12-10' };
  const completedTrip = { ...newTrip, completion_status: true };
  const fetchMock = jest.fn((url, options) => {
    if (url.endsWith('/moves')) {
      return Promise.resolve(jsonResponse([]));
    }
    if (url.endsWith('/trips') && options?.method === 'POST') {
      return Promise.resolve(jsonResponse(newTrip));
    }
    if (url.endsWith('/trips')) {
      return Promise.resolve(jsonResponse([]));
    }
    if (url.endsWith('/tasks?trip_id=8')) {
      return Promise.resolve(jsonResponse([]));
    }
    if (url.endsWith('/trips/8') && options?.method === 'PUT') {
      return Promise.resolve(jsonResponse(completedTrip));
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  render(
    <MemoryRouter>
      <MoveTripSelector />
    </MemoryRouter>
  );

  fireEvent.click(await screen.findByRole('button', { name: 'Trips' }));
  await screen.findByText('No trips yet. Add one above.');
  fireEvent.change(screen.getByPlaceholderText('e.g. Summer Holiday'), {
    target: { value: newTrip.name },
  });
  fireEvent.change(screen.getByLabelText('Trip Date:'), {
    target: { value: newTrip.trip_date },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add Trip' }));

  const completionCheckbox = await screen.findByRole('checkbox', {
    name: `Mark ${newTrip.name} as completed`,
  });
  fireEvent.click(completionCheckbox);

  await waitFor(() => expect(completionCheckbox).toBeChecked());
  expect(fetchMock).toHaveBeenCalledWith('/api/trips', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({
      name: newTrip.name,
      trip_date: newTrip.trip_date,
    }),
  }));
  expect(fetchMock).toHaveBeenCalledWith('/api/trips/8', expect.objectContaining({
    method: 'PUT',
    body: JSON.stringify({ completion_status: true }),
  }));
});

test('Manage tasks navigates to the selected move in All Tasks', async () => {
  const fetchMock = jest.fn((url) => {
    if (url.endsWith('/moves')) {
      return Promise.resolve(jsonResponse([move]));
    }
    if (url.endsWith('/tasks?move_id=3')) {
      return Promise.resolve(jsonResponse([]));
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  render(
    <MemoryRouter initialEntries={['/move-trip-selector']}>
      <Routes>
        <Route path="/move-trip-selector" element={<MoveTripSelector />} />
        <Route path="/all-tasks" element={<h1>All Tasks route</h1>} />
      </Routes>
    </MemoryRouter>
  );

  const manageTasksLink = await screen.findByRole('link', { name: 'Manage tasks' });
  expect(manageTasksLink).toHaveAttribute('href', '/all-tasks?move=3');

  fireEvent.click(manageTasksLink);

  expect(await screen.findByRole('heading', { name: 'All Tasks route' })).toBeInTheDocument();
});

test.each([
  ['move', move, 'Trips'],
  ['trip', trip, 'Trips'],
])('links a %s card to its pictures page entry', async (type, item, switchType) => {
  const fetchMock = jest.fn((url) => {
    if (url.endsWith('/moves')) {
      return Promise.resolve(jsonResponse(type === 'move' ? [item] : []));
    }
    if (url.endsWith('/trips')) {
      return Promise.resolve(jsonResponse(type === 'trip' ? [item] : []));
    }
    if (url.endsWith(`/tasks?${type}_id=${item.id}`)) {
      return Promise.resolve(jsonResponse([]));
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  render(
    <MemoryRouter>
      <MoveTripSelector />
    </MemoryRouter>
  );

  if (type === 'trip') {
    fireEvent.click(await screen.findByRole('button', { name: switchType }));
  }

  const addPicturesLink = await screen.findByRole('link', { name: 'Add pictures' });
  expect(addPicturesLink).toHaveAttribute('href', `/pictures?${type}=${item.id}`);
});

test.each([
  ['move', move, 'moves', 'Trips'],
  ['trip', trip, 'trips', 'Trips'],
])('marks a %s as completed', async (type, item, endpoint, switchType) => {
  const updatedItem = { ...item, completion_status: true };
  const fetchMock = jest.fn((url, options) => {
    if (url.endsWith('/moves')) {
      return Promise.resolve(jsonResponse(type === 'move' ? [item] : []));
    }
    if (url.endsWith('/trips')) {
      return Promise.resolve(jsonResponse(type === 'trip' ? [item] : []));
    }
    if (url.endsWith(`/tasks?${type}_id=${item.id}`)) {
      return Promise.resolve(jsonResponse([]));
    }
    if (url.endsWith(`/${endpoint}/${item.id}`) && options?.method === 'PUT') {
      return Promise.resolve(jsonResponse(updatedItem));
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  render(
    <MemoryRouter>
      <MoveTripSelector />
    </MemoryRouter>
  );

  if (type === 'trip') {
    fireEvent.click(await screen.findByRole('button', { name: switchType }));
  }

  const checkbox = await screen.findByRole('checkbox', {
    name: `Mark ${item.name} as completed`,
  });
  const countdownBefore = screen.getByText(/days to go|since this/).textContent;
  fireEvent.click(checkbox);

  await waitFor(() => expect(checkbox).toBeChecked());
  expect(screen.getByText(countdownBefore)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(`/api/${endpoint}/${item.id}`, expect.objectContaining({
    method: 'PUT',
    body: JSON.stringify({ completion_status: true }),
  }));
});

test.each([
  ['move', { ...move, completion_status: true }, 'moves', 'Trips'],
  ['trip', { ...trip, completion_status: true }, 'trips', 'Trips'],
])('allows a completed %s to be marked not completed', async (type, item, endpoint, switchType) => {
  const updatedItem = { ...item, completion_status: false };
  const fetchMock = jest.fn((url, options) => {
    if (url.endsWith('/moves')) {
      return Promise.resolve(jsonResponse(type === 'move' ? [item] : []));
    }
    if (url.endsWith('/trips')) {
      return Promise.resolve(jsonResponse(type === 'trip' ? [item] : []));
    }
    if (url.endsWith(`/tasks?${type}_id=${item.id}`)) {
      return Promise.resolve(jsonResponse([]));
    }
    if (url.endsWith(`/${endpoint}/${item.id}`) && options?.method === 'PUT') {
      return Promise.resolve(jsonResponse(updatedItem));
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  render(
    <MemoryRouter>
      <MoveTripSelector />
    </MemoryRouter>
  );

  if (type === 'trip') {
    fireEvent.click(await screen.findByRole('button', { name: switchType }));
  }

  const checkbox = await screen.findByRole('checkbox', {
    name: `Mark ${item.name} as not completed`,
  });
  expect(checkbox).toBeChecked();
  const countdownBefore = screen.getByText(/days to go|since this/).textContent;
  fireEvent.click(checkbox);

  await waitFor(() => expect(checkbox).not.toBeChecked());
  expect(screen.getByText(countdownBefore)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(`/api/${endpoint}/${item.id}`, expect.objectContaining({
    method: 'PUT',
    body: JSON.stringify({ completion_status: false }),
  }));
});
