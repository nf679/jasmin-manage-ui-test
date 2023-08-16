import React, { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';

import moment from 'moment';

import { useNotifications } from 'react-bootstrap-notify';

import { Form as ResourceForm } from '../../rest-resource';

import { useCategories, useResources } from '../../api';

import { notificationFromError } from '../utils';

import { StatusIconWithText } from './StatusIcon';


export const RequirementEditButton = ({ project, service, requirement, ...props }) => {
    const notify = useNotifications();
    const categories = useCategories();
    const resources = useResources();

    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    const handleError = error => {
        notify(notificationFromError(error));
        hideModal();
    };

    // We can safely assume that the categories and resources have been initialised
    // higher up the component tree
    const category = categories.data[service.data.category];
    const resource = resources.data[requirement.data.resource];
    const today = moment();
    const startDate = moment(requirement.data.start_date);
    const endDate = moment(requirement.data.end_date);
    const format = "YYYY-MM-DD";

    // Only unprovisioned resources can be edited
    // So adjust the start and end dates to be a minimum of today
    const initialData = {
        start_date: (startDate.isBefore(today) ? today : startDate).format(format),
        end_date: (endDate.isBefore(today) ? today : endDate).format(format)
    };

    return (<>
        <Button onClick={showModal} size="sm" {...props}>
            <i className="fas fa-fw fa-pen" />
            <span className="sr-only">Update requirement</span>
        </Button>

        <Modal show={modalVisible} backdrop="static" keyboard={false}>
            <ResourceForm.UpdateInstanceForm
                instance={requirement}
                fields={['amount', 'start_date', 'end_date']}
                onSuccess={hideModal}
                onError={handleError}
                onCancel={hideModal}
                initialData={initialData}
            >
                <Modal.Header>
                    <Modal.Title>Update requirement</Modal.Title>
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
                    <Form.Group controlId="amount">
                        <Form.Label>Amount required</Form.Label>
                        {/* Show the units on the amount field if required */}
                        {resource.data.units ? (
                            <InputGroup>
                                <Form.Control
                                    as={ResourceForm.Controls.Input}
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder={`Amount required (${resource.data.units})`}
                                    required
                                    autoComplete="off"
                                />
                                <InputGroup.Append>
                                    console.log(resource.data.units);
                                    <InputGroup.Text>{resource.data.units}</InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                        ) : (
                            <Form.Control
                                as={ResourceForm.Controls.Input}
                                type="number"
                                min="1"
                                step="1"
                                placeholder="Amount required"
                                required
                                autoComplete="off"
                            />
                        )}
                        <ResourceForm.Controls.ErrorList />
                    </Form.Group>
                    <Form.Row>
                        <Form.Group as={Col} controlId="start_date">
                            <Form.Label>From</Form.Label>
                            <Form.Control
                                as={ResourceForm.Controls.Input}
                                type="date"
                                min={today.format(format)}
                                required
                                autoComplete="off"
                            />
                            <ResourceForm.Controls.ErrorList />
                        </Form.Group>
                        <Form.Group as={Col} controlId="end_date">
                            <Form.Label>Until</Form.Label>
                            <Form.Control
                                as={ResourceForm.Controls.Input}
                                type="date"
                                min={today.format(format)}
                                required
                                autoComplete="off"
                            />
                            <ResourceForm.Controls.ErrorList />
                        </Form.Group>
                    </Form.Row>
                </Modal.Body>
                <Modal.Footer>
                    <ResourceForm.Controls.CancelButton>Cancel</ResourceForm.Controls.CancelButton>
                    <ResourceForm.Controls.SubmitButton>Update</ResourceForm.Controls.SubmitButton>
                </Modal.Footer>
            </ResourceForm.UpdateInstanceForm>
        </Modal>
    </>);
};
