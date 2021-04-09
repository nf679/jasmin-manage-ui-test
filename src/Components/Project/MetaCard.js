import React, { useState } from 'react';

import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';

import { useNotifications } from 'react-bootstrap-notify';

import {
    Form as ResourceForm,
    InstanceActionButton,
    useNestedResource,
    useAggregateResource
} from '../../rest-resource';

import { notificationFromError, MarkdownEditor } from '../utils';

import {
    ProjectStatusListItem,
    ProjectConsortiumListItem,
    ProjectCollaboratorsListItem,
    ProjectCreatedAtListItem
} from './CardItems';

import { useProjectPermissions, useProjectActions } from './actions';

import { ProjectCollaboratorsLink } from './CollaboratorsLink';
import { ServiceCreateButton } from './ServiceCreateButton';


const ProjectActionCommentButton = ({
    children,
    project,
    action,
    onSuccess,
    onError,
    triggerButtonText,
    submitButtonText = "Confirm",
    ...props
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    // These actions add comments, so we need to trigger a refresh of the comments
    // So we need the nested resource but we don't want to be a fetch point
    const comments = useNestedResource(project, "comments", { fetchPoint: false });

    const handleSuccess = (...args) => {
        // Trigger a refresh of the comments by marking them as dirty
        comments.markDirty();
        if( onSuccess ) onSuccess(...args);
        hideModal();
    };

    const handleError = (...args) => {
        if( onError ) onError(...args);
        hideModal();
    };

    // Make the markdown editor control into a resource form control
    const MarkdownEditorControl = ResourceForm.Controls.asControl(
        MarkdownEditor,
        evt => evt.target.value
    );

    return (<>
        <Button {...props} onClick={showModal}>{triggerButtonText}</Button>

        <Modal show={modalVisible} backdrop="static" keyboard={false}>
            <ResourceForm.InstanceActionForm
                instance={project}
                action={action}
                onSuccess={handleSuccess}
                onError={handleError}
                onCancel={hideModal}
            >
                <Modal.Header>
                    <Modal.Title>{triggerButtonText}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {children}
                    <Form.Group controlId="comment">
                        <Form.Label srOnly>Comment</Form.Label>
                        <Form.Control as={MarkdownEditorControl} required />
                        <ResourceForm.Controls.ErrorList />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <ResourceForm.Controls.CancelButton>
                        Cancel
                    </ResourceForm.Controls.CancelButton>
                    <ResourceForm.Controls.SubmitButton>
                        {submitButtonText}
                    </ResourceForm.Controls.SubmitButton>
                </Modal.Footer>
            </ResourceForm.InstanceActionForm>
        </Modal>
    </>);
};


export const ProjectMetaCard = ({ project }) => {
    const notify = useNotifications();

    const {
        canEditRequirements,
        canSubmitForReview,
        canRequestChanges,
        canSubmitForProvisioning
    } = useProjectPermissions(project);
    const {
        allowEditRequirements,
        allowSubmitForReview,
        allowRequestChanges,
        allowSubmitForProvisioning
    } = useProjectActions(project);

    // When an action results in an error, we want to make a notification for it
    const handleError = error => notify(notificationFromError(error));

    // When the project is submitted for provisioning, it updates the status of the requirements
    // So we need to force the requirements to refresh in order to pick up the new status
    const services = useNestedResource(project, "services", { fetchPoint: false });
    const requirements = useAggregateResource(services, "requirements", { fetchPoint: false });
    const handleSubmitForProvisioning = () => { requirements.markDirty(); }

    // Check if there is at least one button to show
    const showButtons = (
        canEditRequirements ||
        canSubmitForReview ||
        canRequestChanges ||
        canSubmitForProvisioning
    );

    return (
        <div className="sticky-top pt-3">
            <Card style={{ borderWidth: '2px' }}>
                <ListGroup variant="flush">
                    {showButtons && (
                        <ListGroup.Item className="text-center">
                            <ButtonGroup vertical>
                                {canEditRequirements && (
                                    <ServiceCreateButton
                                        project={project}
                                        disabled={!allowEditRequirements}
                                    />
                                )}
                                {canSubmitForReview && (
                                    <ProjectActionCommentButton
                                        project={project}
                                        action="submit_for_review"
                                        onError={handleError}
                                        triggerButtonText="Submit for review"
                                        className="mt-1"
                                        size="lg"
                                        disabled={!allowSubmitForReview}
                                    >
                                        <p className="text-center font-weight-bold">
                                            Please provide any information that may be helpful for
                                            the consortium manager when reviewing your project.
                                        </p>
                                    </ProjectActionCommentButton>
                                )}
                                {canRequestChanges && (
                                    <ProjectActionCommentButton
                                        project={project}
                                        action="request_changes"
                                        onError={handleError}
                                        triggerButtonText="Request changes"
                                        size="lg"
                                        variant="danger"
                                        disabled={!allowRequestChanges}
                                    >
                                        <p className="text-center font-weight-bold">
                                            Please provide some detail on why the project requirements
                                            have been rejected and the changes that are required.
                                        </p>
                                    </ProjectActionCommentButton>
                                )}
                                {canSubmitForProvisioning && (
                                    <InstanceActionButton
                                        className="mt-1"
                                        size="lg"
                                        instance={project}
                                        action="submit_for_provisioning"
                                        onError={handleError}
                                        onSuccess={handleSubmitForProvisioning}
                                        disabled={!allowSubmitForProvisioning}
                                    >
                                        Submit for provisioning
                                    </InstanceActionButton>
                                )}
                            </ButtonGroup>
                        </ListGroup.Item>
                    )}
                    <ProjectStatusListItem project={project} />
                    <ProjectConsortiumListItem project={project} />
                    <ProjectCollaboratorsListItem
                        project={project}
                        CollaboratorsComponent={ProjectCollaboratorsLink}
                    />
                    <ProjectCreatedAtListItem project={project} />
                </ListGroup>
            </Card>
        </div>
    );
};
