import React from 'react';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Jumbotron from 'react-bootstrap/Jumbotron';


const Home = () => (
    <Row>
        <Col>
            <Jumbotron>
                <h1>JASMIN Projects Portal</h1>
                <p>Welcome to the JASMIN Projects Portal.</p>
                <p>Using this portal, you can request JASMIN resources for your project and track their status.</p>
            </Jumbotron>
        </Col>
    </Row>
);

export default Home;
