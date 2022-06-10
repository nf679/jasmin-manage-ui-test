import React from 'react';

import { LinkContainer } from 'react-router-bootstrap';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';

class NotFoundPage extends React.Component{
    render(){
        return (
            <div>
                {/* <h1>Page Not Found</h1>
                <div className="alert alert-with-icon alert-warning">
                    <i className="fas fa-exclamation-circle"></i> <span>The page you are looking for does not exist</span>
                </div> 
                <Alert variant={warning}>
                    The page you are looking for does not exist
                </Alert> */}

                <p>The page you requested does not exist on this server.</p>
                <p>
                You could try:
                </p>
                <LinkContainer to="/">
                    <Nav.Link>Return to homepage</Nav.Link> 
                </LinkContainer>
                <LinkContainer to="/projects">
                    <Nav.Link>Return to your projects</Nav.Link>
                </LinkContainer>
            </div>
        );
    }
}

export default NotFoundPage;