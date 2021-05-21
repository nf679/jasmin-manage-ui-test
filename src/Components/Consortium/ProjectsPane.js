import React from 'react';

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Row from 'react-bootstrap/Row';

import { LinkContainer } from 'react-router-bootstrap';

import { Status } from '../../rest-resource';

import { SpinnerWithText, sortByKey } from '../utils';

import {
    ProjectStatusListItem,
    ProjectCollaboratorsListItem,
    ProjectCreatedAtListItem
} from '../Project/CardItems';


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
                <LinkContainer to={{
                    pathname: `/projects/${project.data.id}`,
                    state: { initialData: project.data }
                }}>
                    <Button variant="outline-primary">Go to project</Button>
                </LinkContainer>
            </Card.Footer>
        </Card>
    );
};


const projectStatusOrdering = ["UNDER_REVIEW", "EDITABLE", "COMPLETED"];


const ProjectsPane = ({ projects }) => {
    // Wait for the projects to load
    return (
        <Status fetchable={projects}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">Loading projects...</SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Status.Throw />
            </Status.Unavailable>
            <Status.Available>
                {data => {
                    // Sort the projects by status, with UNDER_REVIEW projects first, then by name
                    const sortedProjects = sortByKey(
                        Object.values(data),
                        project => [
                            projectStatusOrdering.indexOf(project.data.status),
                            project.data.name
                        ]
                    );
                    return (
                        <Row xs={1} sm={2} lg={3} className="row-cols-xxl-4">
                            {sortedProjects.map(project => (
                                <Col key={project.data.id}>
                                    <ProjectCard project={project} />
                                </Col>
                        ))}
                        </Row>
                    );
                }}
            </Status.Available>
        </Status>
    );
};


export default ProjectsPane;
