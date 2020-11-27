import React from 'react';

import Navbar from 'react-bootstrap/Navbar';

import Logo from 'fwtheme-react-jasmin/Logo';


const ManageNavBar = () => (
    <Navbar expand="lg" variant="dark" bg="primary">
        <Navbar.Brand className="d-flex align-items-center">
            <Logo height={40} /> <span className="pt-1">Projects Portal</span>
        </Navbar.Brand>
    </Navbar>
);


export default ManageNavBar;
