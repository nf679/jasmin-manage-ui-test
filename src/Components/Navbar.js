import React from 'react';

import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import { LinkContainer } from 'react-router-bootstrap';

import { Logo } from 'fwtheme-react-jasmin';

import { useCurrentUser } from '../store';


const ManageNavBar = () => {
    const currentUser = useCurrentUser();
    return (
        <Navbar expand="lg" variant="dark" bg="success">
            <Navbar.Brand><Logo height={30} /></Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse>
                <Nav className="mr-auto">
                    <LinkContainer to="/projects">
                        <Nav.Link>My Projects</Nav.Link>
                    </LinkContainer>
                </Nav>
                {currentUser.initialised && (
                    <Navbar.Text>
                        <i className="fas fa-user mr-2" />
                        {currentUser.data.username}
                    </Navbar.Text>
                )}
            </Navbar.Collapse>
        </Navbar>
    );
};


export default ManageNavBar;
