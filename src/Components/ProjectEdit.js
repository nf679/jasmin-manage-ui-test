import React, { useEffect, useState } from 'react';

import { Redirect, useParams } from 'react-router-dom';

import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';

import ReactMarkdown from 'react-markdown';

import moment from 'moment';

import { useNotifications } from 'react-bootstrap-notify';

import { PageHeader } from 'fwtheme-react-jasmin';

import {
    useCategories,
    useConsortia,
    useCurrentUser,
    useProjects,
    useResources
} from '../store';

import Resource from './Resource';
import { sortByKey, SpinnerWithText, notificationFromError } from './utils';

import '../css/requirements-table.css';


const projectStatusVariants = {
    EDITABLE: 'warning',
    UNDER_REVIEW: 'info',
    COMPLETE: 'muted'
};


export const ProjectStatusListItem = ({ project }) => (
    <ListGroup.Item variant={projectStatusVariants[project.data.status]}>
        Project is <strong>{project.data.status}</strong>.
    </ListGroup.Item>
);


export const ProjectConsortiumListItem = ({ project }) => {
    const consortia = useConsortia();
    return (
        <ListGroup.Item>
            <Resource.Text resource={consortia} resourceName="consortia">
                {data => (<>
                    Project belongs to <strong>{data[project.data.consortium].data.name}</strong>.
                </>)}
            </Resource.Text>
        </ListGroup.Item>
    );
};


const CollaboratorsList = ({ collaborators }) => {
    const currentUser = useCurrentUser();
    // Sort the collaborators by display name
    // Use the username as a fallback
    const displayName = c => c.data.user.last_name ?
        `${c.data.user.first_name} ${c.data.user.last_name} (${c.data.user.username})` :
        c.data.user.username;
    const sortedCollaborators = sortByKey(Object.values(collaborators.data), displayName);
    return (
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
    )
};


const ProjectCollaboratorsLink = ({ children, project }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    const projectCollaborators = project.nested("collaborators");

    return (<>
        <Button variant="link" className="p-0" onClick={showModal}>
            <strong>{children}</strong>
        </Button>
        <Modal show={modalVisible} onHide={hideModal}>
            <Modal.Header>
                <Modal.Title>Project collaborators</Modal.Title>
            </Modal.Header>
            <Resource resource={projectCollaborators}>
                <Resource.Loading>
                    <Modal.Body>
                        <div className="d-flex justify-content-center my-5">
                            <SpinnerWithText>Loading collaborators...</SpinnerWithText>
                        </div>
                    </Modal.Body>
                </Resource.Loading>
                <Resource.Unavailable>
                    <Modal.Body>
                        <Alert variant="danger">Unable to load collaborators.</Alert>
                    </Modal.Body>
                </Resource.Unavailable>
                <Resource.Available>
                    {data => <CollaboratorsList collaborators={projectCollaborators} />}
                </Resource.Available>
            </Resource>
            <Modal.Footer>
                <Button onClick={hideModal}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    </>);
};


export const ProjectCollaboratorsListItem = ({ project, modalEnabled = false }) => {
    const currentUser = useCurrentUser();
    const projectCollaborators = project.nested("collaborators");
    // If the collaborators are loaded, use an accurate count
    // Otherwise use the summary number from loading the project list
    const numCollaborators = projectCollaborators.initialised ?
        Object.keys(projectCollaborators.data).length :
        (project.data.num_collaborators || 0);
    // Same for the user's role (we can safely assume the current user has been successfully
    // initialised higher up the component tree)
    const userRole = projectCollaborators.initialised ?
        Object.values(projectCollaborators.data)
            .filter(c => c.data.user.id === currentUser.data.id)
            .shift().data.role :
        (project.data.current_user_role || "UNKNOWN ROLE");
    // If the modal is enabled, render a link that opens it
    // If not, render the number of collaborators as a strong
    const CollaboratorsComponent = modalEnabled ? ProjectCollaboratorsLink : "strong";
    return (
        <ListGroup.Item>
            <p className="mb-2">
                Project has{" "}
                <CollaboratorsComponent project={project}>
                    {numCollaborators} collaborator{numCollaborators !== 1 ? 's' : ''}
                </CollaboratorsComponent>.
            </p>
            <p className="mb-0">
                You are{' '}
                {/^[aeiou]/i.test(userRole) ? 'an' : 'a'}{' '}
                <strong>{userRole.toLowerCase()}</strong>.
            </p>
        </ListGroup.Item>
    );
};


export const ProjectCreatedAtListItem = ({ project }) => {
    const createdAt = moment(project.data.created_at).fromNow();
    return <ListGroup.Item>Project was created <strong>{createdAt}</strong>.</ListGroup.Item>;
};


const ProjectMetaCard = ({ project }) => {
    const notify = useNotifications();
    const projectServices = project.nested("services");

    const handleClick = async () => {
        // If the submission fails, make a notification with the error
        try {
            await project.executeAction("submit-for-review");
        }
        catch(error) {
            notify({ ...notificationFromError(error), duration: 5000 });
        }
    };

    return (
        <div className="sticky-top pt-3">
            <Card style={{ borderWidth: '2px' }}>
                <ListGroup variant="flush">
                    <ListGroup.Item className="text-center">
                        <ButtonGroup>
                            <ServiceCreateButton
                                project={project}
                                services={projectServices}
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleClick}
                                disabled={project.data.status !== "EDITABLE" || project.updating}
                            >
                                <div className="d-flex align-items-center">
                                    {project.updating &&
                                        <Spinner as="span" animation="border" size="sm" className="mr-2" />
                                    }
                                    Submit for review
                                </div>
                            </Button>
                        </ButtonGroup>
                    </ListGroup.Item>
                    <ListGroup.Item className="markdown">
                        <ReactMarkdown children={project.data.description} />
                    </ListGroup.Item>
                    <ProjectStatusListItem project={project} />
                    <ProjectConsortiumListItem project={project} />
                    <ProjectCollaboratorsListItem project={project} modalEnabled={true} />
                    <ProjectCreatedAtListItem project={project} />
                </ListGroup>
            </Card>
        </div>
    );
};


const ServiceCreateButton = ({ project, services }) => {
    const notify = useNotifications();
    const categories = useCategories();

    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    const handleError = error => {
        notify(notificationFromError(error));
        hideModal();
    };

    const formatCategoryOption = (option, { context }) => (
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
        <Button
            onClick={showModal}
            size="lg"
            variant="success"
            // Disable the button unless the project is editable
            disabled={project.data.status !== "EDITABLE" || project.updating}
        >
            Add service
        </Button>

        <Resource.Form.Context.Create
            resource={services}
            onSuccess={hideModal}
            onError={handleError}
            onCancel={hideModal}
            // Disable the form if the categories are not initialised
            disabled={!categories.initialised}
        >
            <Resource.Form.ModalForm show={modalVisible}>
                <Modal.Header>
                    <Modal.Title>Create a service</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Resource.Form.NonFieldErrors />
                    <Form.Group controlId="category">
                        <Form.Label>Category</Form.Label>
                        <Resource.Form.Control
                            as={Resource.Form.ResourceSelect}
                            resource={categories}
                            resourceName="category"
                            resourceNamePlural="categories"
                            required
                            // Use a custom label renderer
                            formatOptionLabel={formatCategoryOption}
                        />
                    </Form.Group>
                    <Form.Group controlId="name">
                        <Form.Label>Service name</Form.Label>
                        <Resource.Form.Control placeholder="myservice" required autoComplete="off" />
                        <Form.Text>Please use a short but descriptive name.</Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Resource.Form.CancelButton>Cancel</Resource.Form.CancelButton>
                    <Resource.Form.SubmitButton>Create</Resource.Form.SubmitButton>
                </Modal.Footer>
            </Resource.Form.ModalForm>
        </Resource.Form.Context.Create>
    </>);
};


const RequirementCreateButton = ({ project, service, requirements }) => {
    const notify = useNotifications();
    const categories = useCategories();
    const resources = useResources();

    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    // We want to keep a handle on the current form state in order to know which fields to render
    const [formData, setFormData] = useState({});

    const handleError = error => {
        notify(notificationFromError(error));
        hideModal();
    };

    // We can safely assume that the categories and resources have been initialised
    // higher up the component tree
    const category = categories.data[service.data.category];
    // Define a filter function that selects only the resources for the category
    const categoryResources = resource => category.data.resources.includes(resource.data.id);
    // Define a function to extract the label for a resource
    // Don't forget that short_name is optional!
    const resourceLabel = resource => resource.data.short_name || resource.data.name;
    // Define a function to format the resources in the dropdown
    const formatResourceOption = (option, { context }) => (
        context === 'menu' ? (
            <>
                <strong className="d-block">{resourceLabel(option)}</strong>
                <small className="d-block">{option.data.description}</small>
            </>
        ) : (
            resourceLabel(option)
        )
    );

    // Get the currently selected resource
    const selectedResourceId = formData.resource;
    const selectedResource = selectedResourceId ? resources.data[selectedResourceId] : null;

    // Get the initial start and end dates for the form
    const today = moment().format("YYYY-MM-DD");
    const twoYearsFromToday = moment().add(2, 'years').format("YYYY-MM-DD");
    const initialData = { start_date: today, end_date: twoYearsFromToday };

    return (<>
        <Button
            variant="success"
            onClick={showModal}
            // Disable the button unless the project is editable
            disabled={project.data.status !== "EDITABLE" || project.updating}
        >
            New requirement
        </Button>

        <Resource.Form.Context.Create
            resource={requirements}
            onChange={setFormData}
            onSuccess={hideModal}
            onError={handleError}
            onCancel={hideModal}
            initialData={initialData}
        >
            <Resource.Form.ModalForm show={modalVisible}>
                <Modal.Header>
                    <Modal.Title>Create a requirement</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Resource.Form.NonFieldErrors />
                    <Row className="mb-3">
                        <Col xs={2}>Service</Col>
                        <Col>
                            <strong>{category.data.name}</strong>
                            {" / "}
                            {service.data.name}
                        </Col>
                    </Row>
                    <Form.Group controlId="resource">
                        <Form.Label>Resource</Form.Label>
                        <Resource.Form.Control
                            as={Resource.Form.ResourceSelect}
                            resource={resources}
                            resourceName="resource"
                            // Filter the resources to those for the category
                            filterResources={categoryResources}
                            // Use the custom label function
                            getOptionLabel={resourceLabel}
                            required
                            // Use a custom label renderer
                            formatOptionLabel={formatResourceOption}
                        />
                    </Form.Group>
                    {/* Only show the other fields once a resource is selected */}
                    {!!selectedResource && (<>
                        <Form.Group controlId="amount">
                            <Form.Label>Amount required</Form.Label>
                            {/* Show the units on the amount field if required */}
                            {selectedResource.data.units ? (
                                <InputGroup>
                                    <Resource.Form.Control
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder={`Amount required (${selectedResource.data.units})`}
                                        required
                                        autoComplete="off"
                                    />
                                    <InputGroup.Append>
                                        <InputGroup.Text>{selectedResource.data.units}</InputGroup.Text>
                                    </InputGroup.Append>
                                </InputGroup>
                            ) : (
                                <Resource.Form.Control
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Amount required"
                                    required
                                    autoComplete="off"
                                />
                            )}
                        </Form.Group>
                        <Form.Row>
                            <Form.Group as={Col} controlId="start_date">
                                <Form.Label>From</Form.Label>
                                <Resource.Form.Control
                                    type="date"
                                    min={today}
                                    required
                                    autoComplete="off"
                                />
                            </Form.Group>
                            <Form.Group as={Col} controlId="end_date">
                                <Form.Label>Until</Form.Label>
                                <Resource.Form.Control
                                    type="date"
                                    min={today}
                                    required
                                    autoComplete="off"
                                />
                            </Form.Group>
                        </Form.Row>
                    </>)}
                </Modal.Body>
                <Modal.Footer>
                    <Resource.Form.CancelButton>Cancel</Resource.Form.CancelButton>
                    <Resource.Form.SubmitButton>Create</Resource.Form.SubmitButton>
                </Modal.Footer>
            </Resource.Form.ModalForm>
        </Resource.Form.Context.Create>
    </>);
};


const statusOrdering = [
    'REQUESTED',
    'REJECTED',
    'APPROVED',
    'AWAITING_PROVISIONING',
    'PROVISIONED',
    'DECOMMISSIONED'
];


const statusTextClassNames = {
    REJECTED: 'text-danger',
    APPROVED: 'text-success',
    AWAITING_PROVISIONING: 'text-warning',
    PROVISIONED: 'text-info',
    DECOMMISSIONED: 'text-muted'
};


const statusRowClassNames = {
    REJECTED: `${statusTextClassNames.REJECTED} font-weight-bold`,
    DECOMMISSIONED: 'text-muted'
};


const statusCellClassNames = {
    ...statusTextClassNames,
    REJECTED: undefined
};


const statusIcons = {
    'REQUESTED': 'fas fa-paper-plane',
    'REJECTED': 'fas fa-ban',
    'APPROVED': 'fas fa-check',
    'AWAITING_PROVISIONING': 'fas fa-hourglass-half',
    'PROVISIONED': 'fas fa-layer-group',
    'DECOMMISSIONED': 'fas fa-power-off'
};


const sizeUnits = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
const amountSuffixes = ['', 'K', 'M', 'B', 'T'];


const formatNumber = (number, maxExponent) => {
    // This function takes a number and returns a formatted number and exponent
    // such that [result] * 1000^[exponent] ~= [original number]
    let result = number, exponent = 0;
    while( exponent < maxExponent && number > Math.pow(1000, exponent + 1) ) {
        result = result / 1000;
        exponent = exponent + 1;
    }
    // We want to truncate the result to at most one decimal place, but also indicate
    // if there is a loss of precision using >
    const truncatedResult = Math.floor(result * 10) / 10;
    const isTruncated = result !== truncatedResult;
    const formattedResult = Number.isInteger(truncatedResult) ?
        truncatedResult :
        truncatedResult.toFixed(1);
    // Return the formatted result with the exponent
    return [`${isTruncated ? '>' : ''}${formattedResult}`, exponent];
};


const formatSize = (amount, units) => {
    // If the amount is zero, then use the given units
    if( amount === 0 ) return `0 ${units}`;
    // Work out at what unit we are starting from
    const originalUnit = sizeUnits.indexOf(units);
    // Get the number and exponent
    const [formattedAmount, exponent] = formatNumber(
        amount,
        sizeUnits.length - originalUnit - 1
    );
    // Return the formatted value
    return `${formattedAmount} ${sizeUnits[originalUnit + exponent]}`;
};


const formatAmount = (amount, units) => {
    // If the amount is a size, we treat it slightly differently
    if( sizeUnits.includes(units) ) return formatSize(amount, units);
    // Otherwise, format the amount to reduce the number of zeros
    const [formattedAmount, exponent] = formatNumber(amount, amountSuffixes.length - 1);
    // Return the formatted value
    return `${formattedAmount}${amountSuffixes[exponent]}${units ? ` ${units}`: ''}`;
};


const RequirementEditButton = ({ project, service, requirement, disabled }) => {
    const notify = useNotifications();
    const categories = useCategories();
    const resources = useResources();

    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    const handleError = error => {
        notify(notificationFromError(error));
        hideModal();
    };

    // We can safely assume that the categories and resources have been initialised
    // higher up the component tree
    const category = categories.data[service.data.category];
    const resource = resources.data[requirement.data.resource];
    const today = moment();
    const startDate = moment(requirement.data.start_date);
    const endDate = moment(requirement.data.end_date);
    const format = "YYYY-MM-DD";

    // Only unprovisioned resources can be edited
    // So adjust the start and end dates to be a minimum of today
    const initialData = {
        start_date: (startDate.isBefore(today) ? today : startDate).format(format),
        end_date: (endDate.isBefore(today) ? today : endDate).format(format)
    };

    const statusIcon = statusIcons[requirement.data.status];

    return (<>
        <Button onClick={showModal} size="sm" disabled={disabled}>
            <i className="fas fa-fw fa-pen" />
            <span className="sr-only">Update requirement</span>
        </Button>

        <Resource.Form.Context.Update
            instance={requirement}
            fields={['amount', 'start_date', 'end_date']}
            onSuccess={hideModal}
            onError={handleError}
            onCancel={hideModal}
            initialData={initialData}
        >
            <Resource.Form.ModalForm show={modalVisible}>
                <Modal.Header>
                    <Modal.Title>Update requirement</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Resource.Form.NonFieldErrors />
                    <Row className="mb-3">
                        <Col xs={2}>Service</Col>
                        <Col>
                            <strong>{category.data.name}</strong>
                            {" / "}
                            {service.data.name}
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col xs={2}>Resource</Col>
                        <Col>
                            <strong>{resource.data.short_name || resource.data.name}</strong>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col xs={2}>Status</Col>
                        <Col>
                            <strong className={statusTextClassNames[requirement.data.status]}>
                                {statusIcon && <i className={`mr-2 ${statusIcon}`} />}
                                {requirement.data.status}
                            </strong>
                        </Col>
                    </Row>
                    <Form.Group controlId="amount">
                        <Form.Label>Amount required</Form.Label>
                        {/* Show the units on the amount field if required */}
                        {resource.data.units ? (
                            <InputGroup>
                                <Resource.Form.Control
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder={`Amount required (${resource.data.units})`}
                                    required
                                    autoComplete="off"
                                />
                                <InputGroup.Append>
                                    <InputGroup.Text>{resource.data.units}</InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                        ) : (
                            <Resource.Form.Control
                                type="number"
                                min="1"
                                step="1"
                                placeholder="Amount required"
                                required
                                autoComplete="off"
                            />
                        )}
                    </Form.Group>
                    <Form.Row>
                        <Form.Group as={Col} controlId="start_date">
                            <Form.Label>From</Form.Label>
                            <Resource.Form.Control
                                type="date"
                                min={today.format(format)}
                                required
                                autoComplete="off"
                            />
                        </Form.Group>
                        <Form.Group as={Col} controlId="end_date">
                            <Form.Label>Until</Form.Label>
                            <Resource.Form.Control
                                type="date"
                                min={today.format(format)}
                                required
                                autoComplete="off"
                            />
                        </Form.Group>
                    </Form.Row>
                </Modal.Body>
                <Modal.Footer>
                    <Resource.Form.CancelButton>Cancel</Resource.Form.CancelButton>
                    <Resource.Form.SubmitButton>Update</Resource.Form.SubmitButton>
                </Modal.Footer>
            </Resource.Form.ModalForm>
        </Resource.Form.Context.Update>
    </>);
};


const RequirementDeleteButton = ({ project, service, requirement, disabled }) => {
    const notify = useNotifications();
    const categories = useCategories();
    const resources = useResources();

    // Handle a delete error by producing a notification
    const handleError = error => notify(notificationFromError(error));

    // We can safely assume that the categories and resources have been initialised
    // higher up the component tree
    const category = categories.data[service.data.category];
    const resource = resources.data[requirement.data.resource];
    const statusIcon = statusIcons[requirement.data.status];

    return (
        <Resource.DeleteButton
            instance={requirement}
            onError={handleError}
            title="Delete requirement"
            disabled={disabled}
        >
            <Modal.Header>
                <Modal.Title>Delete requirement</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="mb-3">
                    <Col xs={2}>Service</Col>
                    <Col>
                        <strong>{category.data.name}</strong>
                        {" / "}
                        {service.data.name}
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={2}>Resource</Col>
                    <Col>
                        <strong>{resource.data.short_name || resource.data.name}</strong>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={2}>Status</Col>
                    <Col>
                        <strong className={statusTextClassNames[requirement.data.status]}>
                            {statusIcon && <i className={`mr-2 ${statusIcon}`} />}
                            {requirement.data.status}
                        </strong>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={2}>Amount</Col>
                    <Col>
                        <strong>
                            {formatAmount(requirement.data.amount, resource.data.units)}
                        </strong>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={2}>From</Col>
                    <Col>
                        <strong>{requirement.data.start_date}</strong>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col xs={2}>Until</Col>
                    <Col>
                        <strong>{requirement.data.end_date}</strong>
                    </Col>
                </Row>
            </Modal.Body>
        </Resource.DeleteButton>
    );
};


const RequirementRow = ({ project, service, requirement }) => {
    const resources = useResources();
    const resource = resources.data[requirement.data.resource];
    const statusIcon = statusIcons[requirement.data.status];

    // Once a requirement is approved, it is no longer editable
    const editable = (
        project.data.status === "EDITABLE" &&
        !project.updating &&
        statusOrdering.indexOf(requirement.data.status) < statusOrdering.indexOf('APPROVED') &&
        !requirement.updating &&
        !requirement.deleting
    );

    return (<>
        <tr className={statusRowClassNames[requirement.data.status]}>
            <td className={statusCellClassNames[requirement.data.status]}>
                {statusIcon && <i className={`fa-fw ${statusIcon}`} />}
            </td>
            <td>{resource.data.short_name || resource.data.name}</td>
            <td>
                {formatAmount(requirement.data.amount, resource.data.units)}
            </td>
            <td className={statusCellClassNames[requirement.data.status]}>
                {requirement.data.status}
            </td>
            <td>{requirement.data.start_date}</td>
            <td>{requirement.data.end_date}</td>
            <td>
                {editable && (
                    <ButtonGroup size="sm">
                        <RequirementEditButton
                            project={project}
                            service={service}
                            requirement={requirement}
                        />
                        <RequirementDeleteButton
                            project={project}
                            service={service}
                            requirement={requirement}
                        />
                    </ButtonGroup>
                )}
            </td>
        </tr>
    </>);
};


const RequirementsTable = ({ project, service, requirements }) => {
    const resources = useResources();
    const sortedRequirements = sortByKey(
        Object.values(requirements.data),
        // Sort requirements by status first, then resource short name
        // This makes sure that the requirements that require action are closest to the top
        requirement => {
            const resource = resources.data[requirement.data.resource];
            const resourceName = resource.data.short_name || resource.data.name;
            return [statusOrdering.indexOf(requirement.data.status), resourceName];
        }
    );
    return (<>
        <Table className="requirements-table mb-0 border-bottom" size="sm" responsive>
            <thead>
                <tr>
                    <th></th>
                    <th>Resource</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>From</th>
                    <th>Until</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {sortedRequirements.map(requirement => (
                    <RequirementRow
                        key={requirement.data.id}
                        project={project}
                        service={service}
                        requirement={requirement}
                    />
                ))}
                {sortedRequirements.length === 0 && (
                    <tr>
                        <td colSpan={7} className="text-muted text-center py-2">
                            No requirements.
                        </td>
                    </tr>
                )}
            </tbody>
        </Table>
        <div className="text-center p-2">
            <RequirementCreateButton
                project={project}
                service={service}
                requirements={requirements}
            />
        </div>
    </>);
};


const ProvisionedSummary = ({ project, service, requirements }) => {
    // This component provides a summary of what is currently PROVISIONED for the service
    // We want to display the total provisioned for each resource in the service's category
    const categories = useCategories();
    const resources = useResources();

    // We can assume the categories and resources have been initialised successfully
    // higher up the component tree
    const category = categories.data[service.data.category];
    // Sort the resources for the category by name
    const categoryResources = sortByKey(
        Object.values(resources.data).filter(resource =>
            category.data.resources.includes(resource.data.id)
        ),
        resource => resource.data.short_name || resource.data.name
    );

    // Get the total provisioned per resource from the requirements
    const provisionedAmounts = Object.values(requirements.data)
        .filter(req => req.data.status === "PROVISIONED")
        .reduce(
            (amounts, req) => ({
                ...amounts,
                [req.data.resource]: (amounts[req.data.resource] || 0) + req.data.amount
            }),
            {}
        );

    return (
        <Card.Body>
            <Row className="justify-content-center row-cols-xxl-4" xs={3} sm={4} md={5} lg={4} xl={5}>
                {categoryResources.map(resource => {
                    const amount = provisionedAmounts[resource.data.id] || 0;
                    return (
                        <Col key={resource.data.id}>
                            <Card className="mb-2 text-center">
                                <Card.Body
                                    className={`p-2 ${amount === 0 && "text-muted"}`}
                                    style={{ fontSize: '1.2rem' }}
                                >
                                    <strong>{formatAmount(amount, resource.data.units)}</strong>
                                </Card.Body>
                                <Card.Footer className="text-center px-2 py-1">
                                    <strong>{resource.data.short_name || resource.data.name}</strong>
                                </Card.Footer>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </Card.Body>
    );
};


const ProjectServiceCard = ({ project, service }) => {
    const categories = useCategories();
    const resources = useResources();
    const requirements = service.nested("requirements");
    return (
        <Card className="mb-3" style={{ borderWidth: '3px' }}>
            <Card.Header>
                <Resource.Text resource={categories} resourceName="categories">
                    {data => {
                        const category = data[service.data.category];
                        return (
                            <>
                                <strong>{category.data.name}</strong>
                                {" / "}
                                {service.data.name}
                            </>
                        );
                    }}
                </Resource.Text>
            </Card.Header>
            {/*
                We need the resources to order the requirements, so wait for both to load.
            */}
            <Resource.Multi resources={[requirements, resources]}>
                <Resource.Loading>
                    <ListGroup variant="flush">
                        <ListGroup.Item>
                            <SpinnerWithText size="sm">Loading requirements...</SpinnerWithText>
                        </ListGroup.Item>
                    </ListGroup>
                </Resource.Loading>
                <Resource.Unavailable>
                    <ListGroup variant="flush">
                        <ListGroup.Item>
                            <span className="text-danger">
                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                Unable to load requirements.
                            </span>
                        </ListGroup.Item>
                    </ListGroup>
                </Resource.Unavailable>
                <Resource.Available>
                    <ProvisionedSummary
                        project={project}
                        service={service}
                        requirements={requirements}
                    />
                    <RequirementsTable
                        project={project}
                        service={service}
                        requirements={requirements}
                    />
                </Resource.Available>
            </Resource.Multi>
        </Card>
    );
};


const ProjectEdit = ({ project }) => {
    const categories = useCategories();
    const projectServices = project.nested("services");
    return (<>
        <Row>
            <Col>
                <h1 className="border-bottom mt-4">{project.data.name}</h1>
            </Col>
        </Row>
        <Row>
            {/* Use custom classes for an xxl breakpoint */}
            <Col xs={12} lg={5} xl={4} className="order-lg-1 col-xxl-3">
                <ProjectMetaCard project={project} />
            </Col>
            <Col xs={12} lg={7} xl={8} className="order-lg-0 col-xxl-9 my-3">
                {/*
                    Because we want to sort the services by category name, we need to wait for
                    the categories and project services to load before rendering.
                */}
                <Resource.Multi resources={[projectServices, categories]}>
                    <Resource.Loading>
                        <div className="d-flex justify-content-center my-5">
                            <SpinnerWithText>Loading services...</SpinnerWithText>
                        </div>
                    </Resource.Loading>
                    <Resource.Unavailable>
                        <Alert variant="danger">Unable to load services.</Alert>
                    </Resource.Unavailable>
                    <Resource.Available>
                        {([serviceData, categoryData]) => {
                            const sortedServices = sortByKey(
                                Object.values(serviceData),
                                // Sort by category name then by service name
                                service => {
                                    const category = categoryData[service.data.category];
                                    return [category.data.name, service.data.name];
                                }
                            );
                            return (
                                // Use a custom class for xxl breakpoint
                                <Row xs={1} className="row-cols-xxl-2">
                                    {sortedServices.map(service => (
                                        <Col key={service.data.id}>
                                            <ProjectServiceCard
                                                project={project}
                                                service={service}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            );
                        }}
                    </Resource.Available>
                </Resource.Multi>
            </Col>
        </Row>
    </>);
};


const ProjectDoesNotExist = ({ projectId }) => {
    // When this component is mounted, raise a notification before redirecting
    const notify = useNotifications();
    useEffect(
        () => notify({
            level: 'warning',
            title: 'Invalid project',
            message: `Could not find project with id '${projectId}'.`,
            duration: 3000
        }),
        []
    );
    return <Redirect to="/projects" />;
};


const ProjectEditWrapper = () => {
    // Extract the project we are working on
    const projects = useProjects();
    const { id: projectId } = useParams();

    // Wait for the projects to load before rendering the project edit view
    return (
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
                    data.hasOwnProperty(projectId) ?
                        <ProjectEdit project={data[projectId]} /> :
                        <ProjectDoesNotExist projectId={projectId} />
                )}
            </Resource.Available>
        </Resource>
    );
};


export default ProjectEditWrapper;
