import React from 'react';

import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import Container from 'react-bootstrap/Container';

import Navbar from './Navbar';
import Home from './pages/Home';


const App = () => (
    <Router>
        <Navbar />
        <Container fluid>
            <Switch>
                <Route path="/"><Home /></Route>
            </Switch>
        </Container>
    </Router>
);

export default App;
