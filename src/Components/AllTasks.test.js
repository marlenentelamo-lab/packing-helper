import { fireEvent, render, screen } from '@testing-library/react';
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

  render(<AllTasks />);

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

  render(<AllTasks />);

  fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
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
  expect(screen.getAllByText(/Move: Moving house/)).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Add Task' })).toBeInTheDocument();
});
