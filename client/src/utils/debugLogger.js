// Debug logger utility for file logging
class DebugLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;
    }

    log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.logs.push(logEntry);
        
        // Keep only last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Console log as well
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data);

        // Try to save to localStorage
        try {
            localStorage.setItem('debugLogs', JSON.stringify(this.logs));
        } catch (e) {
            console.warn('Could not save logs to localStorage:', e);
        }
    }

    info(message, data) {
        this.log('info', message, data);
    }

    error(message, data) {
        this.log('error', message, data);
    }

    warn(message, data) {
        this.log('warn', message, data);
    }

    debug(message, data) {
        this.log('debug', message, data);
    }

    // Export logs as downloadable file
    exportLogs() {
        const logsJson = JSON.stringify(this.logs, null, 2);
        const blob = new Blob([logsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Get logs from localStorage
    getLogs() {
        try {
            const stored = localStorage.getItem('debugLogs');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('Could not read logs from localStorage:', e);
            return [];
        }
    }

    // Clear all logs
    clearLogs() {
        this.logs = [];
        localStorage.removeItem('debugLogs');
        console.log('Debug logs cleared');
    }
}

// Create singleton instance
const logger = new DebugLogger();

// Add global functions for easy access
window.exportDebugLogs = () => logger.exportLogs();
window.clearDebugLogs = () => logger.clearLogs();
window.getDebugLogs = () => logger.getLogs();

export default logger;