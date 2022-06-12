import React from 'react';

import { LinkContainer } from 'react-router-bootstrap';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';

class NotFoundPage extends React.Component{
    render(){
        return (
            <Row>
                <Col>
                    <h1 className='border-bottom mt-4 mb-3'>Page Not Found</h1>
                    <Alert variant='warning'>
                        <i className="fas fa-exclamation-circle"></i> The page you are looking for does not exist
                    </Alert>

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
                </Col>
            </Row>
        );
    }
}

export default NotFoundPage;