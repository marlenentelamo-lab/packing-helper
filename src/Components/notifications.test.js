import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NotificationBell from './notifications';

const notifications = [
  {
    id: 1,
    type: 'move_countdown',
    message: 'Move coming up',
    trigger_date: '2026-10-10',
    is_read: false,
  },
  {
    id: 2,
    type: 'task_due',
    message: 'Task due today',
    trigger_date: '2026-10-03',
    is_read: true,
  },
];

function response(data = {}) {
  return {
    ok: true,
    json: async () => data,
  };
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue(response(notifications));
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('loads notifications and displays the unread count when opened', async () => {
  render(<NotificationBell />);

  const bell = await screen.findByRole('button', {
    name: 'Notifications, 1 unread',
  });
  expect(global.fetch).toHaveBeenCalledWith('/api/notifications');

  fireEvent.click(bell);

  expect(await screen.findByText('Move coming up')).toBeInTheDocument();
  expect(screen.getByText('Task due today')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mark all read' })).toBeInTheDocument();
});

test('dismisses a notification without marking it as read', async () => {
  render(<NotificationBell />);

  fireEvent.click(
    await screen.findByRole('button', { name: 'Notifications, 1 unread' }),
  );
  await screen.findByText('Move coming up');

  fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss notification' })[0]);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/1', {
      method: 'DELETE',
    });
  });
  expect(global.fetch).not.toHaveBeenCalledWith('/api/notifications/1/read', {
    method: 'PATCH',
  });
});
