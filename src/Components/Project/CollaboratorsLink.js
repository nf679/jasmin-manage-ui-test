import React, { useState } from 'react';

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';

import { Status, useNestedResource } from '../../rest-resource';

import { SpinnerWithText } from '../utils';

import { useProjectPermissions } from './actions';

import { CollaboratorsListItems } from './CollaboratorsListItems';
import { InvitationsListItems } from './InvitationsListItems';


export const CollaboratorsModalBody = ({ project }) => {
    const collaborators = useNestedResource(project, "collaborators");
    const invitations = useNestedResource(project, "invitations");

    return (
        <Status.Many fetchables={[collaborators, invitations]}>
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
                    <CollaboratorsListItems
                        project={project}
                        collaborators={collaborators}
                    />
                    <InvitationsListItems
                        project={project}
                        invitations={invitations}
                    />
                </ListGroup>
            </Status.Available>
        </Status.Many>
    )
};


export const ProjectCollaboratorsLink = ({ children, project }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    // In order to know whether we should disable the cancel button, we need
    // to know the collaborators and invitations
    // But we don't want to be a fetch point
    const collaborators = useNestedResource(project, "collaborators", { fetchPoint: false });
    const invitations = useNestedResource(project, "invitations", { fetchPoint: false });

    // The cancel button should be disabled if any updates are taking place
    const cancelDisabled = (
        collaborators.creating ||
        Object.values(collaborators.data).some(c => c.updating || c.deleting) ||
        invitations.creating ||
        Object.values(invitations.data).some(i => i.updating || i.deleting)
    );

    // See if the current user is allowed to edit the collaborators
    const { canEditCollaborators } = useProjectPermissions(project);

    return (<>
        <Button variant="link" className="p-0" onClick={showModal}>
            <strong>{children}</strong>
        </Button>
        <Modal
            show={modalVisible}
            onHide={hideModal}
            // Disable closing the modal except with the cancel button
            backdrop="static"
            keyboard={false}
            // For editing, use a large modal
            size={canEditCollaborators ? "lg" : undefined}
        >
            <Modal.Header>
                <Modal.Title>Project collaborators</Modal.Title>
            </Modal.Header>
            <CollaboratorsModalBody project={project} />
            <Modal.Footer>
                <Button onClick={hideModal} disabled={cancelDisabled}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    </>);
};
