import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Navbar from './Navbar';
import NotificationBell, { NotificationsPage } from './Notifications';

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
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('loads notifications and displays the unread count when opened', async () => {
  render(<NotificationBell />);

  const bell = await screen.findByRole('button', {
    name: 'Notifications, 1 unread',
  });
  expect(global.fetch).toHaveBeenCalledWith('/api/notifications', {
    credentials: 'include',
  });

  fireEvent.click(bell);

  expect(await screen.findByText('Move coming up')).toBeInTheDocument();
  expect(screen.getByText('Task due today')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mark all read' })).toBeInTheDocument();
});

test('loads new notifications on the next poll', async () => {
  const newNotification = {
    id: 3,
    type: 'trip_countdown',
    message: 'Trip coming up',
    trigger_date: '2026-10-20',
    is_read: false,
  };
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce(response(notifications))
    .mockResolvedValueOnce(response([...notifications, newNotification]));
  jest.useFakeTimers();

  render(<NotificationBell open />);

  expect(await screen.findByText('Move coming up')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Notifications, 1 unread' })).toBeInTheDocument();

  await act(async () => {
    jest.advanceTimersByTime(60000);
  });

  expect(await screen.findByText('Trip coming up')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Notifications, 2 unread' })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('1 new notification');
});

test('opens the notification panel from the navbar without a notification page link', async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navbar user={null} setUser={jest.fn()} />
      <Routes>
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={null} />
      </Routes>
    </MemoryRouter>
  );

  const notificationButton = await screen.findByRole('button', {
    name: 'Notifications, 1 unread',
  });
  expect(screen.queryByRole('link', { name: 'Notifications' })).not.toBeInTheDocument();

  fireEvent.click(notificationButton);

  expect(await screen.findByText('Move coming up')).toBeInTheDocument();
  expect(screen.getByRole('menu')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
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
      credentials: 'include',
    });
  });
  expect(global.fetch).not.toHaveBeenCalledWith('/api/notifications/1/read', {
    method: 'PATCH',
    credentials: 'include',
  });
});
