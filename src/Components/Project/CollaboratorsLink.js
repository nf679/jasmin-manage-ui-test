import React, { useState } from 'react';

import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';

import moment from 'moment';

import { Status, useNestedResource } from '../../rest-resource';

import { useCurrentUser } from '../../api';

import { sortByKey, SpinnerWithText } from '../utils';


const CollaboratorsList = ({ project }) => {
    const currentUser = useCurrentUser();
    const collaborators = useNestedResource(project, "collaborators");
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
                    {sortedCollaborators.map(collaborator => {
                        const createdAt = moment(collaborator.data.created_at).fromNow();
                        return (
                            <ListGroup.Item
                                key={collaborator.data.id}
                                className="d-flex align-items-center"
                            >
                                <div className="mr-auto">
                                    <span className="d-block">
                                        {displayName(collaborator)}
                                        {collaborator.data.user.id === currentUser.data.id && (
                                            <Badge
                                                variant="warning"
                                                style={{ fontSize: '90%' }}
                                                className="ml-2"
                                            >
                                                You
                                            </Badge>
                                        )}
                                    </span>
                                    <small className="text-muted">Added {createdAt}</small>
                                </div>
                                <Badge
                                    variant="success"
                                    style={{ fontSize: '100%' }}
                                >
                                    {collaborator.data.role}
                                </Badge>
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>
            </Status.Available>
        </Status>
    )
};


export const ProjectCollaboratorsLink = ({ children, project }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    return (<>
        <Button variant="link" className="p-0" onClick={showModal}>
            <strong>{children}</strong>
        </Button>
        <Modal show={modalVisible} onHide={hideModal}>
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
