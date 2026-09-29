// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext();

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api/notifications`;

// Every event type the backend's notificationService can emit. Registered
// with one shared handler below instead of a separate .on(...) per type.
const NOTIFICATION_EVENT_TYPES = [
  'newJobPosted',
  'newApplication',
  'applicationConfirmation',
  'applicationStatusUpdated',
];

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const getAuthHeaders = () => {
    if (user && user.token) {
      return { Authorization: `Bearer ${user.token}` };
    }
    return {};
  };

  // Fetch notification history on login/page load — this is what was
  // missing before. Without this, a user only ever saw notifications for
  // events that happened while they personally had a live socket connection
  // open, which is why logging in fresh (or switching accounts) showed
  // nothing for things that happened while they were logged out.
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.token) {
      if (!isLoading && !isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
      }
      return;
    }

    let cancelled = false;

    axios
      .get(API_URL, { headers: getAuthHeaders() })
      .then((res) => {
        if (cancelled) return;
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.read).length);
      })
      .catch((err) => {
        console.error('NotificationContext: failed to fetch notification history:', err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, isLoading]);

  // Live socket connection — unchanged in spirit, still gives instant
  // updates for anyone currently online, now generalized to one handler
  // covering every notification type instead of three separate near-copies.
  useEffect(() => {
    if (isLoading) return;

    if (socketRef.current) {
      console.log('Notification Socket Cleanup: Existing socket found, disconnecting.');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    socketRef.current = io(BACKEND_URL, {
      query: { token: isAuthenticated && user ? user.token : '' },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Notification Socket Connected:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log(`Notification Socket Disconnected: ${reason}`);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Notification Socket Connection Error:', err.message);
    });

    const handleLiveNotification = (notification) => {
      // Broadcast (role) notifications arrive with id: null from the backend
      // since each recipient's real row id isn't known at emit time — give
      // it a client-side fallback key so React/state dedup logic still works
      // until the next fetch picks up the real persisted id.
      const withId = notification.id != null ? notification : { ...notification, id: `${notification.timestamp}-${Math.random()}` };
      setNotifications((prev) => [withId, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    NOTIFICATION_EVENT_TYPES.forEach((eventType) => {
      socketRef.current.on(eventType, handleLiveNotification);
    });

    return () => {
      if (socketRef.current) {
        console.log('Notification Socket Cleanup: Disconnecting socket on unmount/user change.');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user, isLoading]);

  const markAsRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      setUnreadCount(updated.filter((n) => !n.read).length);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    // Persist to backend too — previously this only updated local state, so
    // a refresh would bring back the same items marked unread again.
    if (isAuthenticated && user?.token) {
      axios
        .patch(`${API_URL}/mark-all-read`, {}, { headers: getAuthHeaders() })
        .catch((err) => console.error('NotificationContext: failed to persist mark-all-read:', err.message));
    }
  };

  const addNotification = (newNotification) => {
    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  return useContext(NotificationContext);
};
