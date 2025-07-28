import React, { useState } from 'react';
import { FaBell, FaCheck, FaTrash, FaCheckDouble } from 'react-icons/fa';
import { format } from 'date-fns';

const NotificationCard = ({ notifications, onMarkAsRead, onMarkAllAsRead, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'BOOKING':
                return '🏨';
            case 'PAYMENT':
                return '💰';
            case 'REVIEW':
                return '⭐';
            case 'SYSTEM':
                return '🔔';
            default:
                return '📌';
        }
    };

    const formatDate = (date) => {
        return format(new Date(date), 'MMM d, h:mm a');
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 p-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <FaBell className="text-white text-xl" />
                    <h3 className="text-white font-semibold text-lg">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    {notifications.length > 0 && (
                        <button
                            onClick={onMarkAllAsRead}
                            className="text-white hover:text-blue-200 transition-colors"
                            title="Mark all as read"
                        >
                            <FaCheckDouble className="text-lg" />
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-white hover:text-blue-200 transition-colors"
                    >
                        {isExpanded ? '▼' : '▲'}
                    </button>
                </div>
            </div>

            {/* Notification List */}
            <div className={`overflow-y-auto transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-[400px]'}`}>
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        No notifications
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`p-4 hover:bg-gray-50 transition-colors ${
                                    !notification.read ? 'bg-blue-50' : ''
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xl" role="img" aria-label="notification type">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <h4 className={`font-medium ${!notification.read ? 'text-blue-600' : 'text-gray-800'}`}>
                                            {notification.title}
                                        </h4>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {!notification.read && (
                                            <button
                                                onClick={() => onMarkAsRead(notification._id)}
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                title="Mark as read"
                                            >
                                                <FaCheck className="text-sm" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onDelete(notification._id)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                            title="Delete notification"
                                        >
                                            <FaTrash className="text-sm" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">
                                    {notification.message}
                                </p>
                                <div className="text-xs text-gray-400">
                                    {formatDate(notification.createdAt)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationCard; 