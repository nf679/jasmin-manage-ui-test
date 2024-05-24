import React, { useEffect } from 'react';

import {
    Redirect,
    Route,
    Switch,
    useLocation,
    useParams,
    useRouteMatch
} from 'react-router-dom';

import Badge from 'react-bootstrap/Badge';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';

import { LinkContainer } from 'react-router-bootstrap';

import { useNotifications } from 'react-bootstrap-notify';

import { PageHeader } from 'fwtheme-react-jasmin';

import {
    Status, useNestedResource,
    useEnsureInitialised
} from '../../rest-resource';

import { useConsortia, useConsortium, useConsortiumSummary} from '../../api';

import { SpinnerWithText, notificationFromError } from '../utils';

import OverviewPane from './OverviewPane';
import ProjectsPane from './ProjectsPane';
import SummaryPane from './ProjectSummaryPane';


const ConsortiumDetail = ({ consortium, conSummary }) => {
    // We don't want to be reloading resources as the user flips between tabs
    // So load both nested resources here
    const notify = useNotifications();
    const projects = useNestedResource(consortium, "projects");
    const quotas = useNestedResource(consortium, "quotas");

    if (projects.fetchError) {
        return (
            notify(notificationFromError(projects.fetchError)),
            <Redirect to='/consortia' />
        );
    }
    if (quotas.fetchError) {
        return (
            notify(notificationFromError(quotas.fetchError)),
            <Redirect to='/consortia' />
        );
    }

    const { pathname } = useLocation();
    const { path, url } = useRouteMatch();

    // Count the number of projects that are under review
    // If we do this before the projects have loaded, we get zero
    const numProjectsUnderReview = Object.values(projects.data)
        .filter(p => p.data.status === "UNDER_REVIEW")
        .length;

    return (<>
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
                <Nav variant="tabs" className="mb-3" activeKey={pathname}>
                    <Nav.Item>
                        <LinkContainer to={url} exact>
                            <Nav.Link>Overview</Nav.Link>
                        </LinkContainer>
                    </Nav.Item>
                    <Nav.Item>
                        <LinkContainer to={`${url}/projects`}>
                            <Nav.Link>
                                <div className="d-flex align-items-center">
                                    <span>Projects</span>
                                    {numProjectsUnderReview > 0 && (
                                        <Badge pill className="ml-2" variant="danger">
                                            {numProjectsUnderReview}
                                        </Badge>
                                    )}
                                </div>
                            </Nav.Link>
                        </LinkContainer>
                    </Nav.Item>
                    <Nav.Item>
                        <LinkContainer to={`${url}/summary`}>
                            <Nav.Link>
                                <div className="d-flex align-items-center">
                                    <span>Projects Summary</span>
                                </div>
                            </Nav.Link>
                        </LinkContainer>
                    </Nav.Item>
                </Nav>
                <Switch>
                    <Route exact path={path}>
                        <OverviewPane quotas={quotas} />
                    </Route>
                    <Route path={`${path}/projects`}>
                        <ProjectsPane projects={projects} />
                    </Route>
                    <Route path={`${path}/summary`}>
                        <SummaryPane conSummary={conSummary} consortium={consortium}/>
                    </Route>
                </Switch>
            </Col>
        </Row>
    </>);
};


const ConsortiumDetailWrapper = () => {
    const notify = useNotifications();
    const consortia = useConsortia();

    // Get the consortium id from the path
    const { id: consortiumId } = useParams();

    // Use the consortium id to get the summary and load at this level 
    // to ensure its loaded if user goes stright to summary page
    const conSummary = useConsortiumSummary(consortiumId)

    // Initialise the consortium, using initial data from the consortia
    const initialData = consortia.data[consortiumId]?.data;
    const consortium = useConsortium(consortiumId, { initialData });

    // If the project failed to load, notify the user
    useEffect(
        () => {
            if (consortium.fetchError) {
                notify(notificationFromError(consortium.fetchError));
            }
        },
        [consortium.fetchError]
    );

    return (
        <Status.Many fetchables={[consortium, conSummary, tags]}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="lg">
                        Loading consortium...
                    </SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Redirect to="/consortia" />
            </Status.Unavailable>
            <Status.Available>
                <ConsortiumDetail consortium={consortium} conSummary={conSummary}/>
            </Status.Available>
        </Status.Many>
    );
};


export default ConsortiumDetailWrapper;
