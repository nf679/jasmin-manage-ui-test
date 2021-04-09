import React from 'react';

import Alert from 'react-bootstrap/Alert';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import { Status,  useNestedResource, useAggregateResource } from '../../rest-resource';

import { useCategories } from '../../api';

import { sortByKey, SpinnerWithText, useStateFromLocation } from '../utils';

import { ServiceCard } from './ServiceCard';

import '../../css/project-detail.css';


export const ServicesPane = ({ project }) => {
    const categories = useCategories();
    // When this pane is loaded, fetch the services
    const services = useNestedResource(project, "services");

    // Check if we should be scrolling a particular service into view
    const { scrollTo } = useStateFromLocation();
    // Before we can scroll, we need all the requirements to be initialised,
    // otherwise we will scroll and then the loading requirements will move
    // the viewport again
    const requirements = useAggregateResource(services, "requirements", { fetchPoint: false });

    // We want to avoid too many fast UI changes, but in order to render the
    // services we need the services themselves, the categories, the aggregated
    // requirements and the resources
    return (
        <Status.Many fetchables={[services, categories]}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">
                        Loading services...
                    </SpinnerWithText>
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
                                        // Wait for all the requirements to be initialised
                                        // for all services before scrolling
                                        scrollTo={
                                            requirements.initialised &&
                                            scrollTo === service.data.id
                                        }
                                    />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Row>
                            <Col className="text-center text-muted py-5">
                                No services yet.
                            </Col>
                        </Row>
                    );
                }}
            </Status.Available>
        </Status.Many>
    );
};
