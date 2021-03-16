import React, { useEffect } from 'react';

import { Redirect, useParams } from 'react-router-dom';

import Badge from 'react-bootstrap/Badge';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Tab from 'react-bootstrap/Tab';

import { useNotifications } from 'react-bootstrap-notify';

import { PageHeader } from 'fwtheme-react-jasmin';

import { Status } from '../../rest-resource';

import { useConsortia, useConsortium } from '../../api';

import { SpinnerWithText, notificationFromError } from '../utils';

import OverviewPane from './OverviewPane';


const ConsortiumProjects = ({ consortium }) => {
    return "Consortium projects";
};


const ConsortiumDetail = ({ consortium }) => (<>
    <PageHeader>
        <div className="d-flex align-items-center">
            <span>{consortium.data.name}</span>
            <Badge
                variant={consortium.data.is_public ? "success" : "danger"}
                className="ml-4"
                style={{ fontSize: '60%' }}
            >
                {consortium.data.is_public ? "Public" : "Not Public"}
            </Badge>
        </div>
    </PageHeader>
    <Row>
        <Col>
            <Tab.Container defaultActiveKey="overview">
                <Nav variant="tabs" className="mb-3">
                    <Nav.Item>
                        <Nav.Link eventKey="overview">Overview</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="projects">Projects</Nav.Link>
                    </Nav.Item>
                </Nav>
                <Tab.Content>
                    <Tab.Pane eventKey="overview">
                        <OverviewPane consortium={consortium} />
                    </Tab.Pane>
                    <Tab.Pane eventKey="projects">
                        <ConsortiumProjects consortium={consortium} />
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
        </Col>
    </Row>
</>);


const ConsortiumDetailWrapper = () => {
    const notify = useNotifications();
    const consortia = useConsortia();

    // Get the consortium id from the path
    const { id: consortiumId } = useParams();

    // Initialise the consortium, using initial data from the consortia
    const initialData = consortia.data[consortiumId]?.data;
    const consortium = useConsortium(consortiumId, { initialData });

    // If the project failed to load, notify the user
    useEffect(
        () => {
            if( consortium.fetchError ) {
                notify(notificationFromError(consortium.fetchError));
            }
        },
        [consortium.fetchError]
    );

    return (
        <Status fetchable={consortium}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText>Loading consortium...</SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Redirect to="/consortia" />
            </Status.Unavailable>
            <Status.Available>
                <ConsortiumDetail consortium={consortium} />
            </Status.Available>
        </Status>
    );
};


export default ConsortiumDetailWrapper;
