import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clearing, setClearing] = useState(false);
    const { user } = useAuth();
    const dropdownRef = useRef(null);

    const loadNotifications = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const [unreadRes, allRes] = await Promise.all([
                notificationService.getUnread(user.id),
                notificationService.getAll(user.id)
            ]);
            setNotifications(allRes.data);
            setUnreadCount(unreadRes.data.length);
        } catch (err) {
            console.error('Ошибка загрузки уведомлений:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            loadNotifications();
        } catch (err) {
            console.error('Ошибка:', err);
        }
    };

    const handleClearAll = async () => {
        if (!user?.id) return;
        setClearing(true);
        try {
            await notificationService.markAllAsRead(user.id);
            loadNotifications();
        } catch (err) {
            console.error('Ошибка:', err);
        } finally {
            setClearing(false);
        }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [user?.id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин назад`;
        if (diffHours < 24) return `${diffHours} ч назад`;
        return `${diffDays} д назад`;
    };

    const styles = {
        container: { position: 'relative', display: 'inline-block' },
        bellButton: {
            background: 'none',
            border: 'none',
            fontSize: '1.3rem',
            cursor: 'pointer',
            position: 'relative',
            padding: '8px',
            borderRadius: '50%',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        badge: {
            position: 'absolute',
            top: '-2px',
            right: '-8px',
            backgroundColor: '#dc3545',
            color: 'white',
            borderRadius: '20px',
            padding: '2px 7px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            minWidth: '18px',
            textAlign: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        },
        dropdown: {
            position: 'absolute',
            top: '45px',
            right: '0',
            width: '420px',
            maxHeight: '500px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 5px 25px rgba(0,0,0,0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            border: '1px solid #e9ecef',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: '1px solid #e9ecef',
            backgroundColor: '#fff',
        },
        titleWrapper: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        },
        title: {
            margin: 0,
            fontSize: '1rem',
            fontWeight: 'bold',
            color: '#2c3e50',
        },
        titleCount: {
            backgroundColor: '#e9ecef',
            color: '#495057',
            borderRadius: '20px',
            padding: '2px 8px',
            fontSize: '0.7rem',
            fontWeight: '500',
        },
        clearBtn: {
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            padding: '5px 12px',
            fontSize: '0.7rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
            color: '#495057',
            whiteSpace: 'nowrap',
        },
        clearBtnHover: {
            backgroundColor: '#e9ecef',
            borderColor: '#ced4da',
        },
        list: { maxHeight: '420px', overflowY: 'auto' },
        notificationItem: {
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
        },
        unreadItem: {
            backgroundColor: '#f0f7ff',
            borderLeft: '3px solid #007bff',
        },
        titleText: {
            fontWeight: 'bold',
            marginBottom: '5px',
            fontSize: '0.85rem',
            color: '#2c3e50',
        },
        messageText: {
            fontSize: '0.78rem',
            color: '#6c757d',
            marginBottom: '5px',
            lineHeight: '1.4',
        },
        timeText: {
            fontSize: '0.65rem',
            color: '#adb5bd',
        },
        emptyText: {
            padding: '30px 20px',
            textAlign: 'center',
            color: '#adb5bd',
            fontSize: '0.85rem',
        },
        loadingText: {
            padding: '30px 20px',
            textAlign: 'center',
            color: '#adb5bd',
            fontSize: '0.85rem',
        },
    };

    return (
        <div style={styles.container} ref={dropdownRef}>
            <button
                style={styles.bellButton}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div style={styles.dropdown}>
                    <div style={styles.header}>
                        <div style={styles.titleWrapper}>
                            <span style={styles.title}>Уведомления</span>
                            {unreadCount > 0 && (
                                <span style={styles.titleCount}>непрочитанных: {unreadCount}</span>
                            )}
                        </div>
                        <button
                            style={styles.clearBtn}
                            onClick={handleClearAll}
                            disabled={clearing}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = styles.clearBtnHover.backgroundColor;
                                e.currentTarget.style.borderColor = styles.clearBtnHover.borderColor;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                e.currentTarget.style.borderColor = '#dee2e6';
                            }}
                        >
                            {clearing ? 'Очистка...' : 'Очистить все'}
                        </button>
                    </div>
                    <div style={styles.list}>
                        {loading ? (
                            <div style={styles.loadingText}>Загрузка...</div>
                        ) : notifications.length === 0 ? (
                            <div style={styles.emptyText}>Нет уведомлений</div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    style={{
                                        ...styles.notificationItem,
                                        ...(!notif.isRead ? styles.unreadItem : {})
                                    }}
                                    onClick={() => handleMarkAsRead(notif.id)}
                                >
                                    <div style={styles.titleText}>{notif.title}</div>
                                    <div style={styles.messageText}>{notif.message}</div>
                                    <div style={styles.timeText}>{formatDate(notif.sentAt)}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;