import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import BootstrapFormContext  from 'react-bootstrap/FormContext';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';

import {
    Input,
    Select,
    SpinnerWithText
} from './utils';


const ResourceContext = createContext();


/**
 * Component that makes a resource available further down the tree using a context.
 */
const Resource = ({ resource, children }) => {
    // If the resource hasn't been initialised by the time it hits this component,
    // initiate a fetch
    // Note that because of how resources are implemented, this will not lead to a
    // double fetch if there is already a fetch in progress
    useEffect(
        () => { if( !resource.initialised ) resource.fetch(); },
        []
    )
    return (
        <ResourceContext.Provider value={resource}>
            {children}
        </ResourceContext.Provider>
    );
};


/**
 * Provides access to the resource context.
 */
Resource.useContext = () => useContext(ResourceContext);


/**
 * Renders the given children only if the resource is initialising.
 */
Resource.Loading = ({ children }) => {
    const resource = Resource.useContext();
    return (!resource.initialised && !resource.fetchError) ? children : null;
};


/**
 * Renders the children only if the resource failed to initialise.
 */
Resource.Unavailable = ({ children }) => {
    const resource = Resource.useContext();
    if( resource.initialised || !resource.fetchError ) return null;
    return typeof children === 'function' ? children(resource.fetchError) : children;
};


/**
 * Renders the children only if the resource is initialised.
 */
Resource.Available = ({ children }) => {
    const resource = Resource.useContext();
    if( !resource.initialised ) return null;
    return typeof children === 'function' ? children(resource.data) : children;
};


/**
 * Renders a resource in a way that is suitable for regular text flow.
 */
Resource.Text = ({
    resource,
    children,
    resourceName,
    spinnerProps = {},
    loadingText = `Loading ${resourceName}...`,
    errorText = `Unable to load ${resourceName}.`
}) => (
    <Resource resource={resource}>
        <Resource.Loading>
            <SpinnerWithText size="sm" {...spinnerProps}>{loadingText}</SpinnerWithText>
        </Resource.Loading>
        <Resource.Unavailable>
            <span className="text-danger">
                <i className="fas fa-exclamation-triangle mr-2"></i> {errorText}
            </span>
        </Resource.Unavailable>
        <Resource.Available>{children}</Resource.Available>
    </Resource>
);


/**
 * Renders a count of the resource instances.
 */
Resource.Count = ({ resource, resourceName, resourceNamePlural = `${resourceName}s` }) => (
    <Resource.Text
        resource={resource}
        loadingText={`Loading ${resourceNamePlural}...`}
        errorText={`Unable to load ${resourceNamePlural}.`}
    >
        {data => {
            const instanceCount = Object.keys(data).length;
            return `${instanceCount} ${instanceCount === 1 ? resourceName : resourceNamePlural}`;
        }}
    </Resource.Text>
);


/**
 * Allows for waiting for multiple resources in parallel as if they are one.
 *
 * The data for the multi-resource is an array containing the data for each resource.
 */
Resource.Multi = ({ resources, children }) => {
    // Make a fake resource whose state is a merge of the given resources
    const resource = {
        ...resources.reduce(
            (multiResource, resource) => ({
                initialised: multiResource.initialised && resource.initialised,
                fetching: multiResource.fetching || resource.fetching,
                fetchError: multiResource.fetchError || resource.fetchError,
                data: [...multiResource.data, resource.data]
            }),
            { initialised: true, fetching: false, fetchError: null, data: [] }
        ),
        // Fetch is a no-op for a multi-resource
        fetch: () => {}
    };
    // Pass the fake resource to the resource component
    return <Resource resource={resource}>{children}</Resource>;
};


Resource.DeleteButton = ({
    children,
    instance,
    onSuccess,
    onError,
    buttonText = 'Delete',
    buttonTextClassName = "sr-only",
    spinnerProps = {},
    ...props
}) => {
    // It is likely that the delete button will be unmounted when the instance is deleted
    // So on a successful delete, we only actually need to hide the modal when the component
    // is still mounted
    // But to know that, we need to track the mounted state - to do this we use a ref
    const isMounted = useRef();
    useEffect(
        () => {
            isMounted.current = true;
            return () => { isMounted.current = false; };
        },
        []
    );

    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => { if( isMounted.current ) setModalVisible(false); };

    const mergedSpinnerProps = Object.assign(
        // Default spinner props
        {
            as: "span",
            animation: "border",
            size: "sm",
            className: "mr-2"
        },
        spinnerProps
    );

    // Function to handle the deletion
    const handleClick = async () => {
        try {
            await instance.delete();
        }
        catch(error) {
            if( onError ) onError(error);
            // Handling the event is done (leave the modal open)
            return;
        }
        // Call the success handler outside the try so we don't accidentally
        // catch exceptions from the success handler
        if( onSuccess ) onSuccess();
        // We can close the modal
        hideModal();
    };

    return (<>
        <Button {...props} variant="danger" onClick={showModal}>
            <i className="fas fa-fw fa-trash" />
            <span className={buttonTextClassName}>{buttonText}</span>
        </Button>

        <Modal backdrop="static" keyboard={false} show={modalVisible}>
            {children}
            <Modal.Footer>
                <Button onClick={hideModal} disabled={instance.deleting}>Cancel</Button>
                <Button onClick={handleClick} variant="danger" disabled={instance.deleting}>
                    {instance.deleting && <Spinner {...mergedSpinnerProps} />}
                    Delete
                </Button>
            </Modal.Footer>
        </Modal>
    </>);
};


/**
 * Object to hold form pieces.
 */
Resource.Form = {};
Resource.Form.Context = {};


// Context to hold form data
const FormDataContext = createContext();
// Context to hold form errors
const FormErrorsContext = createContext();
// Context to hold form disabled state
const FormDisabledContext = createContext();
// Context to hold form in-progress state
const FormInProgressContext = createContext();
// Context to hold the form set field function
const FormSetFieldContext = createContext();
// Context to hold the form cancel function
const FormCancelContext = createContext();


/**
 * Set of hooks to expose parts of the form context.
 */
Resource.Form.Context.useDataContext = () => useContext(FormDataContext);
Resource.Form.Context.useErrorsContext = () => useContext(FormErrorsContext);
Resource.Form.Context.useDisabledContext = () => useContext(FormDisabledContext);
Resource.Form.Context.useInProgressContext = () => useContext(FormInProgressContext);
Resource.Form.Context.useSetFieldContext = () => useContext(FormSetFieldContext);
Resource.Form.Context.useCancelContext = () => useContext(FormCancelContext);


/**
 * Base component for forms that manipulate resources and instances.
 */
const BaseResourceForm = ({
    children,
    onChange,
    onSubmit,
    onSuccess,
    onError,
    onCancel,
    initialData = {},
    // Indicates if the form should be disabled
    disabled = false,
    ...formProps
}) => {
    // State for the form data
    const [formData, setFormData] = useState(initialData);
    // When the form data changes, call the onChange handler if defined
    useEffect(() => { if( onChange ) onChange(formData); }, [formData]);

    // State for the form errors
    const [formErrors, setFormErrors] = useState({});
    // State that indicates if the form is in progress
    const [inProgress, setInProgress] = useState(false);

    // Function that sets a field in the form data
    const setField = name => value => {
        setFormData(prevData => ({ ...prevData, [name]: value }));
        // When a field is set, clear the errors for it
        setFormErrors(prevErrors => {
            const { [name]: _, ...nextErrors } = prevErrors;
            return nextErrors;
        });
    };

    // Function that resets the form
    const resetForm = () => {
        setFormData(initialData);
        setFormErrors({});
    }

    // Function to handle the form submission by executing the requested action
    const handleSubmit = async event => {
        event.preventDefault();
        setInProgress(true);
        try {
            await onSubmit(formData);
        }
        catch(error) {
            // For a bad request, the content should be JSON-formatted errors
            if( error.status === 400 ) setFormErrors(error.json());
            // For any other errors, reset the form and call the handler
            else {
                resetForm();
                if( onError ) onError(error);
            }
            // In both cases we are no longer in progress
            setInProgress(false);
            // Handling the event is done
            return;
        }
        // On success, we want to reset the form
        resetForm();
        // Call the success handler outside the try so we don't accidentally
        // catch exceptions from the success handler
        if( onSuccess ) onSuccess();
        // We are no longer in progress
        setInProgress(false);
    };

    // Function to handle the cancellation of the form
    const handleCancel = () => {
        resetForm();
        if( onCancel ) onCancel();
    };

    // Nest a bootstrap form inside providers for the context
    return (
        <FormDataContext.Provider value={formData}>
            <FormErrorsContext.Provider value={formErrors}>
                {/* Disable the form if in-progress or if requested */}
                <FormDisabledContext.Provider value={inProgress || disabled}>
                    <FormInProgressContext.Provider value={inProgress}>
                        <FormSetFieldContext.Provider value={setField}>
                            <FormCancelContext.Provider value={handleCancel}>
                                <Form {...formProps} onSubmit={handleSubmit}>
                                    {children}
                                </Form>
                            </FormCancelContext.Provider>
                        </FormSetFieldContext.Provider>
                    </FormInProgressContext.Provider>
                </FormDisabledContext.Provider>
            </FormErrorsContext.Provider>
        </FormDataContext.Provider>
    );
};


/**
 * Form for creating a new instance of a resource.
 */
Resource.Form.CreateForm = ({ children, resource, ...props }) => {
    // On submit, create a resource instance with the data
    const handleSubmit = async formData => await resource.create(formData);
    return (
        <BaseResourceForm {...props} onSubmit={handleSubmit}>
            {children}
        </BaseResourceForm>
    );
};


/**
 * Form for updating a resource instance.
 */
Resource.Form.UpdateForm = ({
    children,
    instance,
    fields,
    initialData: givenInitialData = {},
    ...props
}) => {
    // By default, use all the fields except id and _links
    const fieldsToUse = fields || (
        Object.keys(instance.data).filter(f => !['id', '_links'].includes(f))
    );
    // For the initial data, use the specified fields from the instance data
    const initialData = Object.assign(
        {},
        ...fieldsToUse.map(name => ({ [name]: instance.data[name] })),
        // Overwrite with any specified initial data
        givenInitialData
    );
    // On submit, update the instance with the form data
    const handleSubmit = async formData => await instance.update(formData);
    return (
        <BaseResourceForm {...props} onSubmit={handleSubmit} initialData={initialData}>
            {children}
        </BaseResourceForm>
    );
};


/**
 * Renders an alert containing the non-field errors for the form
 */
Resource.Form.NonFieldErrors = ({ children, ...props }) => {
    const formErrors = Resource.Form.Context.useErrorsContext();
    // If there are no non-field errors, we are done
    if( !formErrors.hasOwnProperty("non_field_errors") ) return null;
    // We want to apply different styling to the last errors
    const [lastError, ...errors] = [...formErrors.non_field_errors].reverse();
    return (
        <Alert variant="danger">
            {errors.reverse().map((e, i) => <p key={i} className="mb-1">{e.detail}</p>)}
            <p className="mb-0">{lastError.detail}</p>
        </Alert>
    );
};


/**
 * Renders a Bootstrap form control that forms part of a resource form.
 */
Resource.Form.Control = ({
    children,
    id,
    disabled,
    // Use the Input from utils as the default control
    as = Input,
    ...props
}) => {
    // Get the field name either from the given id or the controlId of the parent form group
    const { controlId } = useContext(BootstrapFormContext);
    const fieldName = id || controlId;
    // Get the parts of the form context that we need
    const data = Resource.Form.Context.useDataContext();
    const errors = Resource.Form.Context.useErrorsContext();
    const formDisabled = Resource.Form.Context.useDisabledContext();
    const setNamedField = Resource.Form.Context.useSetFieldContext();
    // Use the field name to extract the relevant data and errors
    const fieldValue = data.hasOwnProperty(fieldName) ? data[fieldName] : '';
    const fieldHasErrors = errors.hasOwnProperty(fieldName);
    const fieldErrors = fieldHasErrors ? errors[fieldName] : [];
    // Create a callback to set the field value when the control is changed
    const handleChange = setNamedField(fieldName);
    return (<>
        <Form.Control
            {...props}
            as={as}
            id={id}
            value={fieldValue}
            onChange={handleChange}
            disabled={formDisabled || disabled}
            isInvalid={fieldHasErrors}
        >
            {children}
        </Form.Control>
        {fieldErrors.map((e, i) =>
            <Form.Control.Feedback key={i} type="invalid">{e.detail}</Form.Control.Feedback>
        )}
    </>);
};


/**
 * Renders a submit button for a resource form.
 */
Resource.Form.SubmitButton = ({
    children,
    disabled,
    variant = "success",
    spinner = true,
    spinnerProps = {},
    ...props
}) => {
    const formDisabled = Resource.Form.Context.useDisabledContext();
    const inProgress = Resource.Form.Context.useInProgressContext();
    const showSpinner = spinner && inProgress;
    const mergedSpinnerProps = Object.assign(
        // Default spinner props
        {
            as: "span",
            animation: "border",
            size: "sm",
            className: "mr-2"
        },
        spinnerProps
    );
    return (
        <Button {...props} type="submit" disabled={formDisabled || disabled} variant={variant}>
            {showSpinner && <Spinner {...mergedSpinnerProps} />}
            {children}
        </Button>
    );
};


/**
 * Renders a cancel button for a resource form.
 */
Resource.Form.CancelButton = ({ children, disabled, ...props }) => {
    const inProgress = Resource.Form.Context.useInProgressContext();
    const handleCancel = Resource.Form.Context.useCancelContext();
    return (
        <Button
            {...props}
            onClick={handleCancel}
            disabled={inProgress || disabled}
        >
            {children}
        </Button>
    );
};


/**
 * Renders a select control to select a resource instance.
 */
Resource.Form.ResourceSelect = ({
    resource,
    resourceName,
    resourceNamePlural = `${resourceName}s`,
    filterResources = _ => true,
    ...props
}) => {
    // Pass the available resources as the options
    const options = Object.values(resource.data).filter(filterResources);
    const selectProps = {
        // By default, use the name as the label and the id as the value
        getOptionLabel: option => option.data.name,
        getOptionValue: option => option.data.id,
        // Use a placeholder that shows the loading status
        placeholder: (
            <Resource.Text resource={resource} resourceName={resourceNamePlural}>
                Select a {resourceName}...
            </Resource.Text>
        ),
        ...props
    };
    // Render the select with the available options
    return <Select {...selectProps} options={options} />;
};


export default Resource;
