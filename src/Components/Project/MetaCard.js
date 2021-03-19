import React from 'react';

import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';

import ReactMarkdown from 'react-markdown';

import { useNotifications } from 'react-bootstrap-notify';

import { InstanceActionButton, useNestedResource } from '../../rest-resource';

import { notificationFromError } from '../utils';

import {
    ProjectStatusListItem,
    ProjectConsortiumListItem,
    ProjectCollaboratorsListItem,
    ProjectCreatedAtListItem
} from './CardItems';

import { useProjectPermissions, useProjectActions } from './actions';

import { ProjectCollaboratorsLink } from './CollaboratorsLink';
import { ServiceCreateButton } from './ServiceCreateButton';


export const ProjectMetaCard = ({ project }) => {
    const notify = useNotifications();

    // We need the services so that we can reset them, but we don't want to be a fetch point
    const services = useNestedResource(project, "services", { fetchPoint: false });

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
    // So we need to force the project services to reload in order to pick up the new requirements
    const handleSubmitForProvisioning = () => { services.reset(); }

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
                                    <InstanceActionButton
                                        className="mt-1"
                                        size="lg"
                                        instance={project}
                                        action="submit_for_review"
                                        onError={handleError}
                                        disabled={!allowSubmitForReview}
                                    >
                                        Submit for review
                                    </InstanceActionButton>
                                )}
                                {canRequestChanges && (
                                    <InstanceActionButton
                                        size="lg"
                                        variant="danger"
                                        instance={project}
                                        action="request_changes"
                                        onError={handleError}
                                        disabled={!allowRequestChanges}
                                    >
                                        Request changes
                                    </InstanceActionButton>
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
                    <ListGroup.Item className="markdown">
                        <ReactMarkdown children={project.data.description} />
                    </ListGroup.Item>
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
