import React from 'react';

import Badge from 'react-bootstrap/Badge';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';

import moment from 'moment';

import { useNotifications } from 'react-bootstrap-notify';

import { Form as ResourceForm, InstanceDeleteButton } from '../../rest-resource';

import { notificationFromError, sortByKey } from '../utils';

import { useProjectPermissions } from './actions';

import '../../css/stacked-modals.css';


const InvitationDeleteButton = ({ invitation }) => {
    const notify = useNotifications();

     // Handle a delete error by producing a notification
     const handleError = error => notify(notificationFromError(error));

    return (
        <InstanceDeleteButton
            instance={invitation}
            onError={handleError}
            className="ml-2"
        >
            <Modal.Header>
                <Modal.Title>Revoke invitation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="mb-0">
                    Are you sure you want to revoke the invitation for{" "}
                    <strong>{invitation.data.email}</strong>?
                </p>
            </Modal.Body>
        </InstanceDeleteButton>
    )
};


const InvitationListItem = ({ project, invitation }) => {
    const { canEditCollaborators } = useProjectPermissions(project);

    const createdAt = moment(invitation.data.created_at).fromNow();

    return (
        <ListGroup.Item className="py-2">
            <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                    <p className="mb-1">
                        {invitation.data.email}
                    </p>
                    <p className="mb-0">
                        <small className="text-muted">Invited {createdAt}</small>
                    </p>
                </div>
                <Badge
                    variant="warning"
                    style={{ fontSize: '100%' }}
                    className="px-3 py-2"
                >
                    INVITED
                </Badge>
                {canEditCollaborators && (
                    <InvitationDeleteButton invitation={invitation} />
                )}
            </div>
        </ListGroup.Item>
    );
};


const InvitationCreateListItem = ({ invitations }) => (
    <ListGroup.Item className="py-3">
        <Row className="align-items-center">
            <Col xs={12} lg={4}>
                <strong>Invite a new collaborator</strong>
            </Col>
            <Col xs={12} lg={8}>
                <ResourceForm.CreateInstanceForm
                    resource={invitations}
                >
                    <Form.Group controlId="email" className="mb-0">
                        <Form.Label srOnly>Email</Form.Label>
                        <InputGroup>
                            <Form.Control
                                as={ResourceForm.Controls.Input}
                                placeholder="Email"
                                required
                                autoComplete="off"
                            />
                            <InputGroup.Append>
                                <ResourceForm.Controls.SubmitButton>
                                    Invite
                                </ResourceForm.Controls.SubmitButton>
                            </InputGroup.Append>
                            <ResourceForm.Controls.ErrorList />
                        </InputGroup>
                    </Form.Group>
                </ResourceForm.CreateInstanceForm>
            </Col>
        </Row>
    </ListGroup.Item>
);


export const InvitationsListItems = ({ project, invitations }) => {
    // See if the current user is allowed to edit the collaborators
    const { canEditCollaborators } = useProjectPermissions(project);

    // Sort the invitations by email address
    const sortedInvitations = sortByKey(
        Object.values(invitations.data),
        invitation => invitation.data.email
    );

    return (<>
        {sortedInvitations.map(invitation => (
            <InvitationListItem
                key={invitation.data.id}
                project={project}
                invitation={invitation}
            />
        ))}
        {canEditCollaborators && (
            <InvitationCreateListItem invitations={invitations} />
        )}
    </>);
};
