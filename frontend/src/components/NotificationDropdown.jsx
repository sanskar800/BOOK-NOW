import React, { useContext, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { NotificationContext } from '../context/NotificationContext';

const NotificationDropdown = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useContext(NotificationContext);
    const [isOpen, setIsOpen] = useState(false);

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'BOOKING':
                return '🏨';
            case 'REVIEW':
                return '⭐';
            case 'PAYMENT':
                return '💰';
            case 'SYSTEM':
                return '🔔';
            default:
                return '📌';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'BOOKING':
                return 'text-blue-600';
            case 'REVIEW':
                return 'text-yellow-600';
            case 'PAYMENT':
                return 'text-green-600';
            case 'SYSTEM':
                return 'text-purple-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
            >
                <FaBell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    onClick={() => {
                                        if (!notification.read) {
                                            markAsRead(notification._id);
                                        }
                                        if (notification.link) {
                                            window.location.href = notification.link;
                                        }
                                    }}
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                                        !notification.read ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex items-start">
                                        <span className={`text-2xl mr-3 ${getNotificationColor(notification.type)}`}>
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDate(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown; 