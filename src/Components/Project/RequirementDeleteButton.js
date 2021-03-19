import React from 'react';

import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';

import { useNotifications } from 'react-bootstrap-notify';

import { InstanceDeleteButton } from '../../rest-resource';

import { useCategories, useResources } from '../../api';

import { formatAmount, notificationFromError } from '../utils';

import { StatusIconWithText } from './StatusIcon';


export const RequirementDeleteButton = ({ project, service, requirement, ...props }) => {
    const notify = useNotifications();
    const categories = useCategories();
    const resources = useResources();

    // Handle a delete error by producing a notification
    const handleError = error => notify(notificationFromError(error));

    // We can safely assume that the categories and resources have been initialised
    // higher up the component tree
    const category = categories.data[service.data.category];
    const resource = resources.data[requirement.data.resource];

    return (
        <InstanceDeleteButton
            instance={requirement}
            onError={handleError}
            title="Delete requirement"
            {...props}
        >
            <Modal.Header>
                <Modal.Title>Delete requirement</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="mb-3">
                    <Col xs={2}>Service</Col>
                    <Col>
                        <strong>{category.data.name}</strong>
                        {" / "}
                        {service.data.name}
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={2}>Resource</Col>
                    <Col>
                        <strong>{resource.data.short_name || resource.data.name}</strong>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={2}>Status</Col>
                    <Col><StatusIconWithText status={requirement.data.status} /></Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={2}>Amount</Col>
                    <Col>
                        <strong>
                            {formatAmount(requirement.data.amount, resource.data.units)}
                        </strong>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={2}>From</Col>
                    <Col>
                        <strong>{requirement.data.start_date}</strong>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={2}>Until</Col>
                    <Col>
                        <strong>{requirement.data.end_date}</strong>
                    </Col>
                </Row>
            </Modal.Body>
        </InstanceDeleteButton>
    );
};
