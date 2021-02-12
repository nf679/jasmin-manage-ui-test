import React from 'react';

import Navbar from 'react-bootstrap/Navbar';

import { Logo } from 'fwtheme-react-jasmin';


const ManageNavBar = () => (
    <Navbar expand="lg" variant="dark" bg="success">
        <Navbar.Brand className="d-flex align-items-center">
            <Logo height={40} /> <span className="pt-1">Projects Portal</span>
        </Navbar.Brand>
    </Navbar>
);


export default ManageNavBar;
