import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from './App';
import store from './store';

// Import only our custom styles
import './index.css';

// Configure theme
const theme = {
    token: {
        colorPrimary: '#1e40af',
        borderRadius: 6,
    },
    components: {
        Menu: {
            darkItemColor: 'rgba(255, 255, 255, 0.85)',
            darkItemHoverColor: '#ffffff',
            darkItemSelectedColor: '#ffffff',
            darkItemSelectedBg: 'transparent',
        },
        Button: {
            primaryColor: '#ffffff',
        }
    }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <ConfigProvider theme={theme}>
                    <App />
                </ConfigProvider>
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
); 