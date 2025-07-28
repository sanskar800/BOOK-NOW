import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AppContext } from './AppContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { token, userData } = useContext(AppContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (token && userData) {
            // Connect to WebSocket
            const newSocket = io('http://localhost:4000', {
                withCredentials: true
            });

            // Authenticate socket with user ID
            newSocket.emit('authenticate', userData._id);

            // Listen for new notifications
            newSocket.on('newNotification', (notification) => {
                console.log('New notification received:', notification);
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            });

            // Listen for notification updates
            newSocket.on('notificationRead', (notificationId) => {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif._id === notificationId 
                            ? { ...notif, read: true } 
                            : notif
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            });

            newSocket.on('allNotificationsRead', () => {
                setNotifications(prev => 
                    prev.map(notif => ({ ...notif, read: true }))
                );
                setUnreadCount(0);
            });

            newSocket.on('notificationDeleted', (notificationId) => {
                setNotifications(prev => 
                    prev.filter(notif => notif._id !== notificationId)
                );
                setUnreadCount(prev => 
                    prev - (notifications.find(n => n._id === notificationId && !n.read) ? 1 : 0)
                );
            });

            setSocket(newSocket);

            // Fetch existing notifications
            fetchNotifications();

            return () => {
                newSocket.close();
            };
        }
    }, [token, userData]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setNotifications(data.data);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(`http://localhost:4000/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif._id === notificationId 
                            ? { ...notif, read: true } 
                            : notif
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/notifications/mark-all-read', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setNotifications(prev => 
                    prev.map(notif => ({ ...notif, read: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    return (
        <NotificationContext.Provider 
            value={{ 
                notifications, 
                unreadCount, 
                markAsRead, 
                markAllAsRead 
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}; 