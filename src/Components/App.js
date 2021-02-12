import React, { useEffect } from 'react';

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';

import Notifications from 'react-bootstrap-notify';

import { useCurrentUser } from '../store';
import { SpinnerWithText } from './utils';

import Navbar from './Navbar';
import Home from './Home';
import ProjectList from './ProjectList';
import ProjectEdit from './ProjectEdit';

import '../css/xxl-breakpoint.css';


const AuthenticatedRoute = ({ children, ...props }) => {
    const currentUser = useCurrentUser();
    // On the first mount, load the current user
    useEffect(
        () => {
            // useEffect expects the return value to be a cleanup function
            // So we can't pass an async function directly as that returns a promise
            // Hence we have to make and call an anonymous function
            (async () => {
                // The error will be reported as part of the resource, so suppress it
                try { await currentUser.initialise(); }
                catch(error) { /* NOOP */ }
            })();
        },
        []
    );
    return (
        <Route
            {...props}
            render={({ location }) => {
                if( currentUser.initialised ) {
                    return children;
                }
                else if( currentUser.fetchError ) {
                    return <Alert variant="danger">Error fetching current user.</Alert>
                }
                else {
                    return (
                        <div className="d-flex justify-content-center my-5">
                            <SpinnerWithText>Initialising...</SpinnerWithText>
                        </div>
                    );
                }
            }}
        />
    );
};


const App = () => (
    <Router>
        <Navbar />
        <Notifications />
        <Container fluid>
            <Switch>
                <AuthenticatedRoute path="/projects" exact><ProjectList /></AuthenticatedRoute>
                <AuthenticatedRoute path="/projects/:id"><ProjectEdit /></AuthenticatedRoute>
                <Route path="/"><Home /></Route>
            </Switch>
        </Container>
    </Router>
);


export default App;
