import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AppContext } from './AppContext';
import axios from 'axios';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { token, userData } = useContext(AppContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

    useEffect(() => {
        if (token && userData) {
            // Connect to WebSocket
            const newSocket = io(backendUrl, {
                withCredentials: true,
                auth: {
                    token: token
                },
                extraHeaders: {
                    'Authorization': `Bearer ${token}`,
                    'token': token
                }
            });

            // Debug socket connection
            newSocket.on('connect', () => {
                console.log('Socket connected');
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
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
    }, [token, userData, backendUrl]);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'token': token
                }
            });
            
            const data = response.data;
            if (data.success) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.notifications?.filter(n => !n.read).length || 0);
            } else {
                console.error('Failed to fetch notifications:', data.message);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            console.log(`Marking notification ${notificationId} as read with token:`, token);
            
            const response = await axios.post(
                `${backendUrl}/api/notifications/${notificationId}/read`,
                {}, // empty body
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'token': token
                    }
                }
            );
            
            const data = response.data;
            console.log('Mark as read response:', data);
            
            if (data.success) {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif._id === notificationId 
                            ? { ...notif, read: true } 
                            : notif
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
                console.log(`Notification ${notificationId} marked as read`);
            } else {
                console.error('Failed to mark notification as read:', data.message);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            console.log('Marking all notifications as read with token:', token);
            
            const response = await axios.post(
                `${backendUrl}/api/notifications/mark-all-read`,
                {}, // empty body
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'token': token
                    }
                }
            );
            
            const data = response.data;
            console.log('Mark all as read response:', data);
            
            if (data.success) {
                setNotifications(prev => 
                    prev.map(notif => ({ ...notif, read: true }))
                );
                setUnreadCount(0);
                console.log('All notifications marked as read');
            } else {
                console.error('Failed to mark all notifications as read:', data.message);
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