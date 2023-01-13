import React, { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';

import classNames from 'classnames';

import { useNotifications } from 'react-bootstrap-notify';

import {
    InstanceActionButton,
    Status,
    useEnsureRefreshed,
    useNestedResource
} from '../../rest-resource';

import { useCategories, useConsortia, useResources } from '../../api';

import { formatAmount, notificationFromError, SpinnerWithText } from '../utils';

import { QuotaProgressBar } from '../Consortium/QuotaProgressBar';

import { StatusIconWithText } from './StatusIcon';


const QuotaProgressCaptionComponent = ({ children, className, ...props }) => (
    <p className={classNames("mb-1", className)} {...props}>
        {children}
    </p>
);


const QuotaSummary = ({ consortium, resource, requirement }) => {
    // Ensure that we have an up-to-date view of the quotas
    const quotas = useNestedResource(consortium, "quotas");
    const refreshedQuotas = useEnsureRefreshed(quotas);
    return (
        <Status fetchable={refreshedQuotas}>
            <Status.Loading>
                <SpinnerWithText className="text-muted text-center p-2">
                    Loading quotas...
                </SpinnerWithText>
            </Status.Loading>
            <Status.Unavailable>
                <span className="text-danger">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Unable to load quotas.
                </span>
            </Status.Unavailable>
            <Status.Available>
                {data => {
                    // Get the quota for the resource
                    const quota = Object.values(data)
                        .filter(q => q.data.resource === resource.data.id)
                        .shift();
                    return quota ? (
                        <QuotaProgressBar
                            quota={quota}
                            resource={resource}
                            requirement={requirement}
                            CaptionComponent={QuotaProgressCaptionComponent}
                        />
                    ) : (
                        <span className="text-danger">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            No quota for {resource.data.name}.
                        </span>
                    )
                }}
            </Status.Available>
        </Status>
    );
};


export const RequirementApproveButton = ({ project, service, requirement, ...props }) => {
    const notify = useNotifications();
    const categories = useCategories();
    const consortia = useConsortia();
    const resources = useResources();

    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    const handleError = error => {
        notify(notificationFromError(error));
        console.log(error)
        hideModal();
    };

    // We can safely assume that the categories and resources have been initialised
    // higher up the component tree
    const category = categories.data[service.data.category];
    const resource = resources.data[requirement.data.resource];

    return (<>
        <Button onClick={showModal} size="sm" {...props}>
            <i className="fas fa-fw fa-question" />
            <span className="sr-only">Approve or reject requirement</span>
        </Button>

        <Modal show={modalVisible} backdrop="static" keyboard={false}>
            <Modal.Header>
                <Modal.Title>Approve or reject requirement</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="mb-3">
                    <Col xs={3} className="align-right">Service</Col>
                    <Col>
                        <strong>{category.data.name}</strong>
                        {" / "}
                        {service.data.name}
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={3}>Resource</Col>
                    <Col>
                        <strong>{resource.data.short_name || resource.data.name}</strong>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={3}>Status</Col>
                    <Col><StatusIconWithText status={requirement.data.status} /></Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={3}>Amount</Col>
                    <Col>
                        <strong>
                            {formatAmount(requirement.data.amount, resource.data.units)}
                        </strong>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={3}>From / Until</Col>
                    <Col>
                        <strong>{requirement.data.start_date}</strong>
                        {" "}/{" "}
                        <strong>{requirement.data.end_date}</strong>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12} className="mb-2">Current commitments</Col>
                    <Col xs={12}>
                        {/* We need to ensure the consortia are loaded before fetching quotas */}
                        <Status fetchable={consortia}>
                            <Status.Loading>
                                <SpinnerWithText className="text-muted text-center p-2">
                                    Loading quotas...
                                </SpinnerWithText>
                            </Status.Loading>
                            <Status.Unavailable>
                                <span className="text-danger">
                                    <i className="fas fa-exclamation-triangle mr-2"></i>
                                    Unable to load quotas.
                                </span>
                            </Status.Unavailable>
                            <Status.Available>
                                {data => (
                                    <QuotaSummary
                                        consortium={data[project.data.consortium]}
                                        resource={resource}
                                        requirement={requirement}
                                    />
                                )}
                            </Status.Available>
                        </Status>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={hideModal} disabled={requirement.updating}>Cancel</Button>
                <InstanceActionButton
                    instance={requirement}
                    action="reject"
                    onSuccess={hideModal}
                    onError={handleError}
                    variant="danger"
                    disabled={requirement.updating}
                >
                    Reject
                </InstanceActionButton>
                <InstanceActionButton
                    instance={requirement}
                    action="approve"
                    onSuccess={hideModal}
                    onError={handleError}
                    variant="success"
                    disabled={requirement.updating}
                >
                    Approve
                </InstanceActionButton>
            </Modal.Footer>
        </Modal>
    </>);
};
