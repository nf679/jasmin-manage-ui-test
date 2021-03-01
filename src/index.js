import React from 'react';
import ReactDOM from 'react-dom';

import { NotificationProvider } from 'react-bootstrap-notify';

import JasminApp from 'fwtheme-react-jasmin';

import App from './Components';


ReactDOM.render(
    <React.StrictMode>
        <JasminApp>
            <NotificationProvider>
                <App />
            </NotificationProvider>
        </JasminApp>
    </React.StrictMode>,
    document.getElementById('root')
);
