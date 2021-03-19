import React, { useState } from 'react';

import { Link, useHistory } from 'react-router-dom';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Alert from 'react-bootstrap/Alert';

import { PageHeader } from 'fwtheme-react-jasmin';

import { useNotifications } from 'react-bootstrap-notify';

import { Form as ResourceForm, Status } from '../../rest-resource';

import { useCurrentUser, useConsortia, useProjects } from '../../api';

import {
    notificationFromError,
    sortByKey,
    SpinnerWithText,
    MarkdownEditor
} from '../utils';

import {
    ProjectStatusListItem,
    ProjectConsortiumListItem,
    ProjectCollaboratorsListItem,
    ProjectCreatedAtListItem
} from './CardItems';


const ProjectCreateButton = ({ projects }) => {
    const notify = useNotifications();
    const currentUser = useCurrentUser();
    const consortia = useConsortia();

    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    const history = useHistory();

    // When a project is created, redirect to it
    // We don't need to hide the modal as we will be redirected
    const handleSuccess = projectData => {
        history.push(`/projects/${projectData.id}`, { initialData: projectData });
    };

    const handleError = error => {
        notify(notificationFromError(error));
        hideModal();
    };

    // This function limits the consortia that are available to select
    const consortiumIsAllowed = consortium => currentUser.data.is_staff || consortium.data.is_public;
    // This function formats the options
    const formatConsortiumOption = (option, { context }) => (
        context === 'menu' ? (
            <>
                <strong className="d-block">{option.data.name}</strong>
                <small className="d-block">{option.data.description}</small>
            </>
        ) : (
            option.data.name
        )
    );

    // Mark the markdown editor control into a resource form control
    const MarkdownEditorControl = ResourceForm.Controls.asControl(
        MarkdownEditor,
        evt => evt.target.value
    );

    return (<>
        <Button onClick={showModal} size="lg" variant="success">New project</Button>

        <Modal show={modalVisible} backdrop="static" keyboard={false}>
            <ResourceForm.CreateInstanceForm
                resource={projects}
                onSuccess={handleSuccess}
                onError={handleError}
                onCancel={hideModal}
                // Disable the form if the consortia are not initialised
                disabled={!consortia.initialised}
            >
                <Modal.Header>
                    <Modal.Title>Create a project</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="name">
                        <Form.Label>Project name</Form.Label>
                        <Form.Control
                            as={ResourceForm.Controls.Input}
                            placeholder="My project"
                            required
                            autoComplete="off"
                        />
                        <ResourceForm.Controls.ErrorList />
                    </Form.Group>
                    <Form.Group controlId="consortium">
                        <Form.Label>Consortium</Form.Label>
                        <Form.Control
                            as={ResourceForm.Controls.ResourceSelect}
                            resource={consortia}
                            resourceName="consortium"
                            resourceNamePlural="consortia"
                            required
                            // Only show allowed consortia
                            filterResources={consortiumIsAllowed}
                            // Use a custom label renderer
                            formatOptionLabel={formatConsortiumOption}
                        />
                        <ResourceForm.Controls.ErrorList />
                    </Form.Group>
                    <Form.Group controlId="description">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as={MarkdownEditorControl} required />
                        <ResourceForm.Controls.ErrorList />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <ResourceForm.Controls.CancelButton>Cancel</ResourceForm.Controls.CancelButton>
                    <ResourceForm.Controls.SubmitButton>Create</ResourceForm.Controls.SubmitButton>
                </Modal.Footer>
            </ResourceForm.CreateInstanceForm>
        </Modal>
    </>);
};


const ProjectCard = ({ project }) => {
    const numServices = project.data.num_services || 0;
    const numRequirements = project.data.num_requirements || 0;
    return (
        <Card className="mb-3" style={{ borderWidth: '3px' }}>
            <Card.Header>
                <h5 className="mb-0">{project.data.name}</h5>
            </Card.Header>
            <ListGroup variant="flush" className="border-0">
                <ProjectStatusListItem project={project} />
                <ProjectConsortiumListItem project={project} />
                <ListGroup.Item>
                    Project has{" "}
                    <strong>{numRequirements} requirement{numRequirements !== 1  ? 's' : ''}</strong> in{" "}
                    <strong>{numServices} service{numServices !== 1  ? 's' : ''}</strong>.
                </ListGroup.Item>
                <ProjectCollaboratorsListItem project={project} />
                <ProjectCreatedAtListItem project={project} />
            </ListGroup>
            <Card.Footer className="text-right">
                {/* Pass the project data as state */}
                <Link to={{
                    pathname: `/projects/${project.data.id}`,
                    state: { initialData: project.data }
                }}>
                    <Button variant="outline-primary">Go to project</Button>
                </Link>
            </Card.Footer>
        </Card>
    );
};


const ProjectList = () => {
    const projects = useProjects();

    return (<>
        <PageHeader>My Projects</PageHeader>
        <Status fetchable={projects}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">Loading projects...</SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Alert variant="danger">Unable to load projects.</Alert>
            </Status.Unavailable>
            <Status.Available>
                {data => (
                    <Row xs={1} sm={2} lg={3}>
                        {sortByKey(Object.values(data), p => p.data.name).map(p =>
                            <Col key={p.data.id}><ProjectCard project={p} /></Col>
                        )}
                        <Col>
                            <Card className="text-center mb-3" body>
                                <ProjectCreateButton projects={projects} />
                            </Card>
                        </Col>
                    </Row>
                )}
            </Status.Available>
        </Status>
    </>);
};


export default ProjectList;
