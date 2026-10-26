import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AllTasks from './AllTasks';

const task = {
  id: 11,
  task_name: 'Pack a suitcase',
  due_date: '2026-10-05',
  completion_status: false,
  trip_id: 7,
  move_id: null,
};

function jsonResponse(data, ok = true) {
  return {
    ok,
    json: async () => data,
  };
}

function renderAllTasks() {
  return render(
    <MemoryRouter>
      <AllTasks />
    </MemoryRouter>
  );
}

test('adds a task assigned to the selected trip', async () => {
  const fetchMock = jest.fn((url, options) => {
    if (options?.method === 'POST') {
      return Promise.resolve(jsonResponse(task));
    }

    if (url.endsWith('/tasks')) {
      return Promise.resolve(jsonResponse([task]));
    }
    if (url.endsWith('/moves')) {
      return Promise.resolve(jsonResponse([{ id: 3, name: 'Moving house' }]));
    }
    if (url.endsWith('/trips')) {
      return Promise.resolve(jsonResponse([{ id: 7, name: 'Summer holiday' }]));
    }

    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  renderAllTasks();

  fireEvent.change(await screen.findByLabelText('Task'), {
    target: { value: 'Pack a suitcase' },
  });
  fireEvent.change(screen.getByLabelText('Due Date'), {
    target: { value: '2026-10-05' },
  });
  await screen.findByRole('option', { name: 'Trip: Summer holiday' });
  fireEvent.change(screen.getByLabelText('Belongs To'), {
    target: { value: 'trip:7' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add Task' }));

  expect(await screen.findByText('Pack a suitcase')).toBeInTheDocument();
  const postCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'POST');
  expect(JSON.parse(postCall[1].body)).toEqual({
    task_name: 'Pack a suitcase',
    due_date: '2026-10-05',
    completion_status: false,
    move_id: null,
    trip_id: '7',
  });
  expect(screen.queryByText('Could not add task. Please try again.')).not.toBeInTheDocument();
});

test('edits a task and can reassign it to a move', async () => {
  let savedTask = task;
  const updatedTask = {
    ...task,
    task_name: 'Pack two suitcases',
    due_date: '2026-10-06',
    move_id: 3,
    trip_id: null,
  };
  const fetchMock = jest.fn((url, options) => {
    if (options?.method === 'PUT') {
      savedTask = updatedTask;
      return Promise.resolve(jsonResponse(updatedTask));
    }

    if (url.endsWith('/tasks')) {
      return Promise.resolve(jsonResponse([savedTask]));
    }
    if (url.endsWith('/moves')) {
      return Promise.resolve(jsonResponse([{ id: 3, name: 'Moving house' }]));
    }
    if (url.endsWith('/trips')) {
      return Promise.resolve(jsonResponse([{ id: 7, name: 'Summer holiday' }]));
    }

    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  renderAllTasks();

  fireEvent.click(await screen.findByRole('button', { name: 'Edit Pack a suitcase' }));
  fireEvent.change(screen.getByLabelText('Task'), {
    target: { value: 'Pack two suitcases' },
  });
  fireEvent.change(screen.getByLabelText('Due Date'), {
    target: { value: '2026-10-06' },
  });
  fireEvent.change(screen.getByLabelText('Belongs To'), {
    target: { value: 'move:3' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save Task' }));

  expect(await screen.findByText('Pack two suitcases')).toBeInTheDocument();
  const putCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'PUT');
  expect(putCall[0]).toBe('/api/tasks/11');
  expect(JSON.parse(putCall[1].body)).toEqual({
    task_name: 'Pack two suitcases',
    due_date: '2026-10-06',
    completion_status: false,
    move_id: '3',
    trip_id: null,
  });
  expect(screen.getByRole('option', { name: 'Move: Moving house' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add Task' })).toBeInTheDocument();
});

test('marks a move as completed from the All Tasks page', async () => {
  const move = { id: 3, name: 'Moving house', target_date: '2026-11-01' };
  const completedMove = { ...move, completion_status: true };
  const fetchMock = jest.fn((url, options) => {
    if (url.endsWith('/moves/3') && options?.method === 'PUT') {
      return Promise.resolve(jsonResponse(completedMove));
    }
    if (url.endsWith('/tasks')) return Promise.resolve(jsonResponse([]));
    if (url.endsWith('/moves')) return Promise.resolve(jsonResponse([move]));
    if (url.endsWith('/trips')) return Promise.resolve(jsonResponse([]));
    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  renderAllTasks();

  const checkbox = await screen.findByRole('checkbox', {
    name: 'Mark Moving house as completed',
  });
  const countdownBefore = screen.getByText(/days to go|since this/).textContent;
  fireEvent.click(checkbox);

  await waitFor(() => expect(checkbox).toBeChecked());
  expect(screen.getByText(countdownBefore)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith('/api/moves/3', expect.objectContaining({
    method: 'PUT',
    body: JSON.stringify({ completion_status: true }),
  }));
});

test.each([
  ['move', { id: 3, name: 'Moving house', target_date: '2026-11-01' }, 'moves'],
  ['trip', { id: 7, name: 'Summer holiday', trip_date: '2026-12-01' }, 'trips'],
])('allows a completed %s to be marked not completed from the All Tasks page', async (
  type,
  item,
  endpoint,
) => {
  const completedItem = { ...item, completion_status: true };
  const updatedItem = { ...item, completion_status: false };
  const fetchMock = jest.fn((url, options) => {
    if (url.endsWith(`/${endpoint}/${item.id}`) && options?.method === 'PUT') {
      return Promise.resolve(jsonResponse(updatedItem));
    }
    if (url.endsWith('/tasks')) return Promise.resolve(jsonResponse([]));
    if (url.endsWith('/moves')) {
      return Promise.resolve(jsonResponse(type === 'move' ? [completedItem] : []));
    }
    if (url.endsWith('/trips')) {
      return Promise.resolve(jsonResponse(type === 'trip' ? [completedItem] : []));
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  renderAllTasks();

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
