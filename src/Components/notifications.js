import React, { useState, useEffect, useRef, useCallback } from 'react';

const POLL_INTERVAL_MS = 60000;

const TYPE_META = {
  move_countdown: { label: 'Move', className: 'dot-move' },
  trip_countdown: { label: 'Trip', className: 'dot-trip' },
  task_due: { label: 'Task', className: 'dot-task' },
}

function formatTriggerDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return 'Today';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationBell({ apiBaseUrl = '' }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/notifications`, { credentials: 'include' });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Could not load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to mark notification as read');
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [apiBaseUrl, fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/notifications/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to mark all notifications as read');
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [apiBaseUrl, fetchNotifications]);

  const deleteNotification = useCallback(async (notificationId, event) => {
    event?.stopPropagation?.();

    try {
      const res = await fetch(`${apiBaseUrl}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete notification');
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [apiBaseUrl, fetchNotifications]);

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleDelete = (notificationId, event) => {
    deleteNotification(notificationId, event);
  };

  return (
    <div className="notifications-bell">
      <button
        ref={buttonRef}
        className="bell-button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
          <path
            d="M12 3a6 6 0 0 0-6 6v3.5c0 .6-.2 1.2-.6 1.7L4 16.5c-.5.6-.1 1.5.7 1.5h14.6c.8 0 1.2-.9.7-1.5l-1.4-2.3c-.4-.5-.6-1.1-.6-1.7V9a6 6 0 0 0-6-6Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M9.5 20a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel" ref={panelRef} role="menu">
          <div className="panel-header">
            <span className="notif-panel-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="mark-all-button" onClick={handleMarkAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="panel-body">
            {isLoading && <div className="panel-state">Loading…</div>}

            {!isLoading && error && <div className="panel-state panel-error">{error}</div>}

            {!isLoading && !error && notifications.length === 0 && (
              <div className="panel-state">You're all caught up.</div>
            )}

            {!isLoading &&
              !error &&
              notifications.map((n) => {
                const meta = TYPE_META[n.type] || { label: '', className: 'dot-default' };
                return (
                  <div
                    key={n.id}
                    className={`notification-item${n.is_read ? ' is-read' : ''}`}
                    onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                    role="menuitem"
                    tabIndex={0}
                  >
                    <span className={`type-dot ${meta.className}`} aria-hidden="true" />
                    <div className="item-content">
                      <p className="item-message">{n.message}</p>
                      <span className="item-date">{formatTriggerDate(n.trigger_date)}</span>
                    </div>
                    <button
                      className="item-delete"
                      onClick={(e) => handleDelete(n.id, e)}
                      aria-label="Dismiss notification"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

