import React, { useEffect, useRef, useState } from 'react';

import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Row from 'react-bootstrap/Row';

import classNames from 'classnames';

import { Status, useNestedResource } from '../../rest-resource';

import { useCategories, useResources } from '../../api';

import { formatAmount, sortByKey, SpinnerWithText } from '../utils';

import { useProjectPermissions, useProjectActions } from './actions';

import { RequirementsTable } from './RequirementsTable';
import { RequirementCreateButton } from './RequirementCreateButton';


const ProvisionedSummary = ({ project, service, requirements }) => {
    // This component provides a summary of what is currently PROVISIONED for the service
    // We want to display the total provisioned for each resource in the service's category
    const categories = useCategories();
    const resources = useResources();

    // We can assume the categories and resources have been initialised successfully
    // higher up the component tree
    const category = categories.data[service.data.category];
    // Sort the resources for the category by name
    const categoryResources = sortByKey(
        Object.values(resources.data).filter(resource =>
            category.data.resources.includes(resource.data.id)
        ),
        resource => resource.data.short_name || resource.data.name
    );

    // Get the total provisioned per resource from the requirements
    const provisionedAmounts = Object.values(requirements.data)
        .filter(req => req.data.status === "PROVISIONED")
        .reduce(
            (amounts, req) => ({
                ...amounts,
                [req.data.resource]: (amounts[req.data.resource] || 0) + req.data.amount
            }),
            {}
        );

    return (
        <Card.Body>
            <Row className="justify-content-center row-cols-xxl-4" xs={3} sm={4} md={5} lg={4} xl={5}>
                {categoryResources.map(resource => {
                    const amount = provisionedAmounts[resource.data.id] || 0;
                    return (
                        <Col key={resource.data.id}>
                            <Card className="mb-2 text-center">
                                <Card.Body
                                    className={`p-2 ${amount === 0 && "text-muted"}`}
                                    style={{ fontSize: '1.2rem' }}
                                >
                                    <strong>{formatAmount(amount, resource.data.units, 1)}</strong>
                                </Card.Body>
                                <Card.Footer className="text-center px-2 py-1">
                                    <strong>{resource.data.short_name || resource.data.name}</strong>
                                </Card.Footer>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </Card.Body>
    );
};


export const ServiceCard = ({ project, service, scrollTo = false }) => {
    const categories = useCategories();
    const resources = useResources();
    const requirements = useNestedResource(service, "requirements");

    const category = categories.data[service.data.category];

    const { canEditRequirements } = useProjectPermissions(project);
    const { allowEditRequirements } = useProjectActions(project);

    // Scroll the service into view if required
    // When the service is scrolled into view, highlight it briefly
    const [highlighted, setHighlighted] = useState(false);
    const ref = useRef(null);
    useEffect(
        () => {
            if( ref.current && scrollTo ) {
                ref.current.scrollIntoView({ behaviour: 'smooth' });
                setHighlighted(true);
                const timer = setTimeout(() => setHighlighted(false), 2000);
                return () => clearTimeout(timer);
            }
        },
        [scrollTo]
    );

    return (
        <Card
            id={`service-${service.data.id}`}
            ref={ref}
            className={classNames("service-card", { "highlight": highlighted })}
        >
            <Card.Header>
                <strong>{category.data.name}</strong>
                {" / "}
                {service.data.name}
            </Card.Header>
            {/*
                We need the resources to order the requirements, so wait for both to load.
            */}
            <Status.Many fetchables={[requirements, resources]}>
                <Status.Loading>
                    <ListGroup variant="flush">
                        <ListGroup.Item>
                            <SpinnerWithText>Loading requirements...</SpinnerWithText>
                        </ListGroup.Item>
                    </ListGroup>
                </Status.Loading>
                <Status.Unavailable>
                    <ListGroup variant="flush">
                        <ListGroup.Item>
                            <span className="text-danger">
                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                Unable to load requirements.
                            </span>
                        </ListGroup.Item>
                    </ListGroup>
                </Status.Unavailable>
                <Status.Available>
                    <ProvisionedSummary
                        project={project}
                        service={service}
                        requirements={requirements}
                    />
                    <RequirementsTable
                        project={project}
                        service={service}
                        requirements={requirements}
                    />
                    {canEditRequirements && (
                        <RequirementCreateButton
                            project={project}
                            service={service}
                            requirements={requirements}
                            disabled={!allowEditRequirements}
                        />
                    )}
                </Status.Available>
            </Status.Many>
        </Card>
    );
};
