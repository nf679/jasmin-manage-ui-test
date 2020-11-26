import React from 'react';
import ReactDOM from 'react-dom';

import JasminApp from 'fwtheme-react-jasmin';

import App from './Components';


ReactDOM.render(
    <React.StrictMode>
        <JasminApp>
            <App />
        </JasminApp>
    </React.StrictMode>,
    document.getElementById('root')
);
