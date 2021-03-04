import React, { useState } from 'react';

import { Link } from 'react-router-dom';

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

import { useCurrentUser, useConsortia, useProjects } from '../api';

import Resource from './Resource';
import {
    notificationFromError,
    sortByKey,
    SpinnerWithText,
    MarkdownEditor
} from './utils';

import {
    ProjectStatusListItem,
    ProjectConsortiumListItem,
    ProjectCollaboratorsListItem,
    ProjectCreatedAtListItem
} from './ProjectEdit';


const ProjectCreateButton = ({ projects }) => {
    const notify = useNotifications();
    const currentUser = useCurrentUser();
    const consortia = useConsortia();

    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

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

    return (<>
        <Button onClick={showModal} size="lg" variant="success">New project</Button>

        <Modal show={modalVisible} backdrop="static" keyboard={false}>
            <Resource.Form.CreateForm
                resource={projects}
                onSuccess={hideModal}
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
                        <Resource.Form.Control placeholder="My project" required autoComplete="off" />
                    </Form.Group>
                    <Form.Group controlId="consortium">
                        <Form.Label>Consortium</Form.Label>
                        <Resource.Form.Control
                            as={Resource.Form.ResourceSelect}
                            resource={consortia}
                            resourceName="consortium"
                            resourceNamePlural="consortia"
                            required
                            // Only show allowed consortia
                            filterResources={consortiumIsAllowed}
                            // Use a custom label renderer
                            formatOptionLabel={formatConsortiumOption}
                        />
                    </Form.Group>
                    <Form.Group controlId="description">
                        <Form.Label>Description</Form.Label>
                        <Resource.Form.Control as={MarkdownEditor} required />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Resource.Form.CancelButton>Cancel</Resource.Form.CancelButton>
                    <Resource.Form.SubmitButton>Create</Resource.Form.SubmitButton>
                </Modal.Footer>
            </Resource.Form.CreateForm>
        </Modal>
    </>);
};


const ProjectCard = ({ project }) => {
    const numServices = project.data.num_services || 0;
    const numRequirements = project.data.num_requirements || 0;
    return (
        <Card className="mb-3">
            <Card.Header>
                <h5 className="mb-0">{project.data.name}</h5>
            </Card.Header>
            <ListGroup variant="flush">
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
                {/* Pass the project data as state with the link */}
                <Link to={{
                    pathname: `/projects/${project.data.id}`,
                    state: { project: project.data }
                }}>
                    <Button variant="outline-primary">Go to project</Button>
                </Link>
            </Card.Footer>
        </Card>
    );
};


const ProjectList = () => {
    const projects = useProjects();

    return (
        <>
            <PageHeader>My Projects</PageHeader>
            <Resource resource={projects}>
                <Resource.Loading>
                    <div className="d-flex justify-content-center my-5">
                        <SpinnerWithText>Loading projects...</SpinnerWithText>
                    </div>
                </Resource.Loading>
                <Resource.Unavailable>
                    <Alert variant="danger">Unable to load projects.</Alert>
                </Resource.Unavailable>
                <Resource.Available>
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
                </Resource.Available>
            </Resource>
        </>
    );
};


export default ProjectList;
