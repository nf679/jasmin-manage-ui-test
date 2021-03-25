import React, { useState } from 'react';

import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import FormControl from 'react-bootstrap/FormControl';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';

import classNames from 'classnames';

import moment from 'moment';

import ReactSelect from 'react-select';

import { useNotifications } from 'react-bootstrap-notify';

import {
    InstanceDeleteButton,
    Status,
    useNestedResource
} from '../../rest-resource';

import { useCurrentUser } from '../../api';

import { notificationFromError, sortByKey, SpinnerWithText } from '../utils';

import { useProjectPermissions } from './actions';

import '../../css/stacked-modals.css';


const collaboratorRoles = ["CONTRIBUTOR", "OWNER"];


/**
 * Renders a select that allows the collaborator role to be changed.
 */
const CollaboratorRoleSelect = ({ collaborator, className, disabled, ...props }) => {
    const notify = useNotifications();

    const [selectedRole, setSelectedRole] = useState(collaborator.data.role);
    const options = collaboratorRoles.map(role => ({ value: role, label: role }));
    const selectedOption = options.find(opt => opt.value === selectedRole);

    const handleChange = async option => {
        const role = option.value;
        // Store the updated value for the time being
        setSelectedRole(role);
        // Try to update the contributor
        try {
            await collaborator.update({ role });
        }
        catch(error) {
            // On error, produce a notification and reset the value
            notify(notificationFromError(error));
            setSelectedRole(collaborator.data.role);
        }
    }

    return (
        <ReactSelect
            {...props}
            className={classNames("rich-select", className)}
            options={options}
            value={selectedOption}
            onChange={handleChange}
            isDisabled={collaborator.updating || disabled}
        />
    );
};


const CollaboratorDeleteButton = ({ collaborator, disabled }) => {
    const notify = useNotifications();

    const collaboratorName = collaborator.data.user.last_name ?
        `${collaborator.data.user.first_name} ${collaborator.data.user.last_name}` :
        collaborator.data.username;

     // Handle a delete error by producing a notification
     const handleError = error => notify(notificationFromError(error));

    return (
        <InstanceDeleteButton
            instance={collaborator}
            onError={handleError}
            disabled={disabled}
        >
            <Modal.Header>
                <Modal.Title>Delete collaborator</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    Are you sure you want to remove{" "}
                    <strong>{collaboratorName}</strong>{" "}
                    as a collaborator?
                </p>
                <p className="mb-0">
                    <strong>
                        Once removed, a collaborator can only rejoin the project by invitation.
                    </strong>
                </p>
            </Modal.Body>
        </InstanceDeleteButton>
    )
};


const CollaboratorUserDetails = ({ collaborator, displayName }) => {
    const currentUser = useCurrentUser();
    const createdAt = moment(collaborator.data.created_at).fromNow();
    return (<>
        <p className="mb-1">
            {displayName(collaborator)}
            {collaborator.data.user.id === currentUser.data.id && (
                <Badge variant="warning" style={{ fontSize: '90%' }} className="ml-2">
                    You
                </Badge>
            )}
        </p>
        <p className="mb-0">
            <small className="text-muted">Added {createdAt}</small>
        </p>
    </>);
};


const CollaboratorListItemNoEdit = ({ collaborator, displayName }) => (
    <ListGroup.Item>
        <div className="d-flex align-items-center">
            <div className="flex-grow-1">
                <CollaboratorUserDetails
                    collaborator={collaborator}
                    displayName={displayName}
                />
            </div>
            <div>
                <Badge variant="success" style={{ fontSize: '100%' }}>
                    {collaborator.data.role}
                </Badge>
            </div>
        </div>
    </ListGroup.Item>
);


const CollaboratorListItemEdit = ({ collaborator, displayName, disabled }) => (
    <ListGroup.Item>
        <Row className="align-items-center">
            <Col xs={12} lg={8}>
                <CollaboratorUserDetails
                    collaborator={collaborator}
                    displayName={displayName}
                />
            </Col>
            <Col xs={12} lg={4}>
                <div className="d-flex">
                    <FormControl
                        as={CollaboratorRoleSelect}
                        collaborator={collaborator}
                        className="mr-2"
                        disabled={disabled}
                    />
                    <CollaboratorDeleteButton
                        collaborator={collaborator}
                        disabled={disabled}
                    />
                </div>
            </Col>
        </Row>
    </ListGroup.Item>
);


const CollaboratorsList = ({ project }) => {
    const collaborators = useNestedResource(project, "collaborators");

    // See if the current user is allowed to edit the collaborators
    const { canEditCollaborators } = useProjectPermissions(project);
    const CollaboratorListItemComponent = canEditCollaborators ?
        CollaboratorListItemEdit :
        CollaboratorListItemNoEdit;

    // Check if the project has multiple owners
    // If there is only only one owner, we want to disable the deleting or changing of the owner
    const numOwners = Object.values(collaborators.data)
        .filter(c => c.data.role === "OWNER")
        .length;
    const soleOwner = numOwners === 1;

    // Sort the collaborators by display name, using the username as a fallback
    const displayName = c => c.data.user.last_name ?
        `${c.data.user.first_name} ${c.data.user.last_name} (${c.data.user.username})` :
        c.data.user.username;
    const sortedCollaborators = sortByKey(Object.values(collaborators.data), displayName);

    return (
        <Status fetchable={collaborators}>
            <Status.Loading>
                <Modal.Body>
                    <div className="d-flex justify-content-center my-5">
                        <SpinnerWithText iconSize="lg" textSize="110%">
                            Loading collaborators...
                        </SpinnerWithText>
                    </div>
                </Modal.Body>
            </Status.Loading>
            <Status.Unavailable>
                <Modal.Body>
                    <Alert variant="danger">Unable to load collaborators.</Alert>
                </Modal.Body>
            </Status.Unavailable>
            <Status.Available>
                <ListGroup>
                    {sortedCollaborators.map(collaborator => (
                        <CollaboratorListItemComponent
                            key={collaborator.data.id}
                            collaborator={collaborator}
                            displayName={displayName}
                            disabled={soleOwner && collaborator.data.role === "OWNER"}
                        />
                    ))}
                </ListGroup>
            </Status.Available>
        </Status>
    )
};


export const ProjectCollaboratorsLink = ({ children, project }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    // See if the current user is allowed to edit the collaborators
    const { canEditCollaborators } = useProjectPermissions(project);

    return (<>
        <Button variant="link" className="p-0" onClick={showModal}>
            <strong>{children}</strong>
        </Button>
        <Modal
            show={modalVisible}
            onHide={hideModal}
            // For editing, use a large modal
            size={canEditCollaborators ? "lg" : undefined}
        >
            <Modal.Header>
                <Modal.Title>Project collaborators</Modal.Title>
            </Modal.Header>
            <CollaboratorsList project={project} />
            <Modal.Footer>
                <Button onClick={hideModal}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    </>);
};
