import React from 'react';

import { LinkContainer } from 'react-router-bootstrap';
import Nav from 'react-bootstrap/Nav'

class NotFoundPage extends React.Component{
    render(){
        return (
            <div>
                {/* <div style={{class:"alert alert-with-icon alert-warning", role:"alert"}}>
                    <i style={{class:"fas fa-exclamation-circle"}}></i> <span>The page you are looking for does not exist</span>
                </div> */}
                <p>The page you requested does not exist on this server.</p>
        
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