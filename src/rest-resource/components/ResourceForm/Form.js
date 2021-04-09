import React from 'react';

import Form from 'react-bootstrap/Form';

import * as FormContext from './Context';


// This higher-order component wraps a form component that expects an onSubmit
// property and supplies the value for that from the form context
const withOnSubmit = FormComponent => ({ children, ...props }) => {
    const handleSubmit = FormContext.useSubmitContext();
    return <FormComponent {...props} onSubmit={handleSubmit}>{children}</FormComponent>;
};


// Base form that handles the wrapping in a context provider
const BaseForm = ({
    children,
    // The form component to use (defaults to a Bootstrap form)
    FormComponent = Form,
    // Function that receives the form data each time it is changed
    onChange,
    // Function that is called with the form data when the form is submitted
    onSubmit,
    // Function that is called when an instance is created successfully
    onSuccess,
    // Function that is called with the error when the creation fails
    onError,
    // Function that is called when the form is cancelled
    onCancel,
    // Initial data for the form
    initialData,
    // Indicates if the form should be disabled
    disabled,
    // Additional properties that are passed to the form component
    ...formProps
}) => {
    // Wrap the form component so that it receives onSubmit from the form context
    const WrappedFormComponent = withOnSubmit(FormComponent);
    // Wrap the form component in a context provider
    return (
        <FormContext.Provider
            onChange={onChange}
            onSubmit={onSubmit}
            onSuccess={onSuccess}
            onError={onError}
            onCancel={onCancel}
            initialData={initialData}
            disabled={disabled}
        >
            <WrappedFormComponent {...formProps}>
                {children}
            </WrappedFormComponent>
        </FormContext.Provider>
    );
};


/**
 * Form for creating a new instance of a resource.
 */
export const CreateInstanceForm = ({
    children,
    // The resource whose create function will receive the form data
    resource,
    // Additional properties that are passed to the base form
    ...props
}) => {
    // On form submission, create a new instance of the specified resource using the data
    const handleSubmit = async formData => await resource.create(formData);
    return <BaseForm {...props} onSubmit={handleSubmit}>{children}</BaseForm>;
};


/**
 * Form for updating a resource instance.
 */
export const UpdateInstanceForm = ({
    children,
    // The instance that will be updated
    instance,
    // The fields that should be included in the initial form data
    fields,
    // Any overrides for the initial data
    initialData: givenInitialData = {},
    ...props
}) => {
    // By default, use all the fields except id and _links
    const fieldsToUse = fields || (
        Object.keys(instance.data).filter(f => !['id', '_links'].includes(f))
    );
    // Extract the specified fields from the instance for the initial data
    const initialData = Object.assign(
        {},
        ...fieldsToUse.map(name => ({ [name]: instance.data[name] })),
        // Overwrite with any specified initial data
        givenInitialData
    );
    // On submit, update the instance with the form data
    const handleSubmit = async formData => await instance.update(formData);
    return (
        <BaseForm {...props} onSubmit={handleSubmit} initialData={initialData}>
            {children}
        </BaseForm>
    );
};


/**
 * For for executing an action on a resource instance.
 */
export const InstanceActionForm = ({
    children,
    // The instance that the action will be executed against
    instance,
    // The action to execute
    action,
    // Additional properties that are passed to the base form
    ...props
}) => {
    // On form submission, create a new instance of the specified resource using the data
    const handleSubmit = async formData => await instance.executeAction(action, formData);
    return <BaseForm {...props} onSubmit={handleSubmit}>{children}</BaseForm>;
};
