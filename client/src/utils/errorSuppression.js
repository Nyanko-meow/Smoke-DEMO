// Global Error Suppression Utility
// Prevents ResizeObserver errors from showing in the console and UI

/**
 * Suppresses ResizeObserver errors that commonly occur with Ant Design components
 * This error doesn't affect functionality but can be annoying during development
 */

// Suppress ResizeObserver error overlays
const suppressResizeObserverError = () => {
    // Hide webpack dev server error overlays for ResizeObserver
    const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay-div');
    const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');

    if (resizeObserverErr) {
        resizeObserverErr.setAttribute('style', 'display: none');
    }
    if (resizeObserverErrDiv) {
        resizeObserverErrDiv.setAttribute('style', 'display: none');
    }
};

// Add global error handlers for ResizeObserver
const setupGlobalErrorHandlers = () => {
    if (typeof window === 'undefined') return;

    // Handle synchronous errors
    window.addEventListener('error', (e) => {
        if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
            e.stopImmediatePropagation();
            suppressResizeObserverError();
            console.log('🔧 ResizeObserver error suppressed');
            return false;
        }
    });

    // Handle promise rejections
    window.addEventListener('unhandledrejection', (e) => {
        if (e.reason?.message?.includes('ResizeObserver loop')) {
            e.preventDefault();
            suppressResizeObserverError();
            console.log('🔧 ResizeObserver rejection suppressed');
            return false;
        }
    });

    // Override console.error to filter ResizeObserver messages
    const originalConsoleError = console.error;
    console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('ResizeObserver loop completed') ||
            message.includes('ResizeObserver loop limit exceeded')) {
            // Suppress ResizeObserver errors in console
            return;
        }
        originalConsoleError.apply(console, args);
    };

    console.log('✅ Global error suppression for ResizeObserver is active');
};

// Initialize error handlers
setupGlobalErrorHandlers();

// Export utility functions
export {
    suppressResizeObserverError,
    setupGlobalErrorHandlers
};

// Auto-setup when imported
export default setupGlobalErrorHandlers; 