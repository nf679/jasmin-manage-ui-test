import React, { useEffect } from 'react';

import { Redirect, useParams } from 'react-router-dom';

import Alert from 'react-bootstrap/Alert';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import classNames from 'classnames';

import { useNotifications } from 'react-bootstrap-notify';

import { PageHeader } from 'fwtheme-react-jasmin';

import { Status, useNestedResource } from '../../rest-resource';

import { useCategories, useProject } from '../../api';

import {
    sortByKey,
    useInitialDataFromLocation,
    SpinnerWithText,
    notificationFromError
} from '../utils';

import { ProjectMetaCard } from './MetaCard';
import { ServiceCard } from './ServiceCard';


const ProjectDetail = ({ project }) => {
    const services = useNestedResource(project, "services");
    const categories = useCategories();
    return (<>
        <PageHeader>{project.data.name}</PageHeader>
        <Row className={classNames({ "text-muted": project.data.status === "COMPLETED" })}>
            {/* Use custom classes for an xxl breakpoint */}
            <Col xs={12} lg={5} xl={4} className="order-lg-1 col-xxl-3">
                <ProjectMetaCard project={project} services={services} />
            </Col>
            <Col xs={12} lg={7} xl={8} className="order-lg-0 col-xxl-9 my-3">
                {/*
                    Because we want to sort the services by category name, we need to wait for
                    the categories and project services to load before rendering.
                */}
                <Status.Many fetchables={[services, categories]}>
                    <Status.Loading>
                        <div className="d-flex justify-content-center my-5">
                            <SpinnerWithText iconSize="lg" textSize="120%">Loading services...</SpinnerWithText>
                        </div>
                    </Status.Loading>
                    <Status.Unavailable>
                        <Alert variant="danger">Unable to load services.</Alert>
                    </Status.Unavailable>
                    <Status.Available>
                        {([serviceData, categoryData]) => {
                            const sortedServices = sortByKey(
                                Object.values(serviceData),
                                // Sort by category name then by service name
                                service => {
                                    const category = categoryData[service.data.category];
                                    return [category.data.name, service.data.name];
                                }
                            );
                            return sortedServices.length > 0 ? (
                                // Use a custom class for xxl breakpoint
                                <Row xs={1} className="row-cols-xxl-2">
                                    {sortedServices.map(service => (
                                        <Col key={service.data.id}>
                                            <ServiceCard
                                                project={project}
                                                service={service}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <Row><Col className="text-center text-muted py-5">No services yet.</Col></Row>
                            );
                        }}
                    </Status.Available>
                </Status.Many>
            </Col>
        </Row>
    </>);
};


const ProjectDetailWrapper = () => {
    const notify = useNotifications();

    // Get the project that was specified in the params
    const { id: projectId } = useParams();
    // Get any initial data specified in the location state
    const initialData = useInitialDataFromLocation();
    // Initialise the project
    const project = useProject(projectId, { initialData });

    // If the project failed to load, notify the user
    useEffect(
        () => {
            if( project.fetchError ) {
                notify(notificationFromError(project.fetchError));
            }
        },
        [project.fetchError]
    );

    return (
        <Status fetchable={project}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="lg">Loading project...</SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Redirect to="/projects" />
            </Status.Unavailable>
            <Status.Available>
                <ProjectDetail project={project} />
            </Status.Available>
        </Status>
    );
};


export default ProjectDetailWrapper;
