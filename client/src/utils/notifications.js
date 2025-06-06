// Browser notification utility for chat messages

class NotificationManager {
    constructor() {
        this.permission = 'default';
        this.init();
    }

    async init() {
        // Request notification permission
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
        }
    }

    showNotification(title, options = {}) {
        if (this.permission !== 'granted') {
            return;
        }

        // Don't show notification if tab is active
        if (!document.hidden) {
            return;
        }

        const notification = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options
        });

        // Auto close after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);

        // Handle click to focus window
        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        return notification;
    }

    getUserSettings() {
        const defaultSettings = {
            browserNotifications: true,
            soundNotifications: true,
            newMessageNotifications: true,
            newConversationNotifications: true
        };

        try {
            const saved = localStorage.getItem('notificationSettings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (e) {
            return defaultSettings;
        }
    }

    showNewMessageNotification(senderName, messageContent) {
        const settings = this.getUserSettings();

        if (!settings.newMessageNotifications || !settings.browserNotifications) {
            return;
        }

        this.showNotification(`💬 Tin nhắn mới từ ${senderName}`, {
            body: messageContent,
            tag: 'new-message',
            requireInteraction: false
        });
    }

    showNewConversationNotification(memberName) {
        const settings = this.getUserSettings();

        if (!settings.newConversationNotifications || !settings.browserNotifications) {
            return;
        }

        this.showNotification(`🆕 Cuộc trò chuyện mới`, {
            body: `${memberName} đã bắt đầu cuộc trò chuyện`,
            tag: 'new-conversation',
            requireInteraction: false
        });
    }

    playNotificationSound() {
        const settings = this.getUserSettings();

        if (!settings.soundNotifications) {
            return;
        }

        try {
            // Simple notification sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
            audio.volume = 0.3;
            audio.play().catch(() => { }); // Ignore errors
        } catch (e) {
            // Ignore audio errors
        }
    }

    requestPermission() {
        if ('Notification' in window) {
            return Notification.requestPermission().then(permission => {
                this.permission = permission;
                return permission;
            });
        }
        return Promise.resolve('denied');
    }
}

// Create singleton instance
const notificationManager = new NotificationManager();

export default notificationManager; 