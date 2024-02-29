import React, { useState, useEffect } from 'react';

import { useHistory } from 'react-router-dom';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import { useNotifications } from 'react-bootstrap-notify';

import { apiFetch, Form as ResourceForm } from '../../rest-resource';
//import {  } from '../../rest-resource';

import { useCurrentUser, useConsortia, useTags } from '../../api';

import { notificationFromError, MarkdownEditor, sortByKey } from '../utils';


export const ProjectCreateButton = ({ projects }) => {
    const notify = useNotifications();
    const currentUser = useCurrentUser();
    const consortia = useConsortia();
    const tags = useTags();
    //const [tags, setTags] = useState([]);
    // Set the tag data and refresh when new tag is created
    // I don't know why this fixed the refresh of the tag data in the select
    const [tagData, setTagData] = useState([]);
    async function fetchData() {
        apiFetch(
            'api/tags/'
        ).then((res) => setTagData(res.data)
        );
    }
    useEffect(() => {
        fetchData();
    }, []);

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
    // This function limits the tags to public ones only
    const tagIsAllowed = tag => tag.data.is_public; //currentUser.data.is_staff || tag.data.is_public;
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

    // Form input for new tags
    function TagsInputNew() {
        const notify = useNotifications();

        //const tags = useTags();
        const [modalVisible, setModalVisible] = useState(false);
        const showModal = () => setModalVisible(true);
        const hideModal = () => setModalVisible(false);
        //const history = useHistory();
        // When a tag is created, hide the modal
        const handleSuccess = tagData => {
            //history.push(`/projects`, { initialData: tagData });
            hideModal();
        };
        const handleError = error => {
            notify(notificationFromError(error));
            hideModal();
        };


        return (<>
            <Button onClick={showModal} size="sm" variant="success">Create new tag</Button>
            <Modal show={modalVisible} backdrop="static" keyboard={false}>
                <ResourceForm.CreateInstanceForm
                    resource={tags}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    onCancel={hideModal}
                >
                    <Modal.Header>
                        <Modal.Title>Create a new tag</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group controlId="name">
                            <Form.Label>Tag name</Form.Label>
                            <Form.Control
                                as={ResourceForm.Controls.Input}
                                placeholder="tag-name"
                                required
                                autoComplete="off"
                            />
                            <p className="form-text text-muted" style={{ fontSize: "12px" }}>
                                Please enter a valid tag consisting of lowercase letters, numbers and hyphens only.
                            </p>
                            <ResourceForm.Controls.ErrorList />

                        </Form.Group>

                    </Modal.Body>
                    <Modal.Footer>
                        <ResourceForm.Controls.CancelButton>Cancel</ResourceForm.Controls.CancelButton>
                        <ResourceForm.Controls.SubmitButton>Submit</ResourceForm.Controls.SubmitButton>
                    </Modal.Footer>
                </ResourceForm.CreateInstanceForm>
            </Modal>
        </>)
    }

    // Make the tags input into a resource form control
    const TagsInputControl = ResourceForm.Controls.asControl(
        tags,
        evt => evt.target.value
    );


    return (<>
        <Button onClick={showModal} size="lg" variant="success">Start new project</Button>

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
                    <Modal.Title>Start a new project</Modal.Title>
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
                    <Form.Group controlId="tags">
                        <Form.Label>Tags</Form.Label>
                        <Form.Control
                            as={ResourceForm.Controls.ResourceMultiSelect} // multi selection isn't actually working... but we need to pass a list to the backend
                            resource={tags}
                            placeholder="Add tags"
                            autoComplete="on"
                            resourceName="tag"
                            resourceNamePlural="tags"
                            //isMulti
                            // Only show allowed consortia
                            filterResources={tagIsAllowed}
                        />
                        {/*<Form.Control as={TagsInputNew} / disabled because we don't want users to create new tags yet>*/}
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
