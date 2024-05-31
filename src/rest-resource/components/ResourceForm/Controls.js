import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import BootstrapFormContext from 'react-bootstrap/FormContext';

import ReactSelect from 'react-select';
import CreatableSelect from 'react-select/creatable';

import * as FormContext from './Context';
import { Status } from '../Status';


/**
 * Wrapper for react-select that supports the required property.
 *
 * It also ensures that the options are sorted by label.
 */
const SelectWithRequired = ({
    options,
    value,
    onChange,
    disabled,
    required,
    className,
    getOptionLabel = option => option.label,
    getOptionValue = option => option.value,
    ...props
}) => {
    // Store the current value as internal state
    const [state, setState] = useState(value || '');
    // When the value changes, use it to set the state
    useEffect(() => { setState(value); }, [value]);
    // Maintain a reference to the select that we will use to correctly maintain focus
    const selectRef = useRef(null);
    // When the select is changed, update the internal state and call the handler
    const handleSelectChange = option => {
        const optionValue = getOptionValue(option);
        setState(optionValue);
        onChange(optionValue);
    };
    // Sort the options by the label
    const sortedOptions = [...options].sort(
        (opt1, opt2) => {
            const [label1, label2] = [getOptionLabel(opt1), getOptionLabel(opt2)];
            return (label1 > label2 ? 1 : (label1 < label2 ? -1 : 0));
        }
    );
    // Select the option that corresponds to the given value
    const selectedOption = sortedOptions.find(opt => getOptionValue(opt) === value);
    // Render the select with a hidden text input that implements required
    return (
        <div className={classNames(className, 'rich-select')}>
            <ReactSelect
                {...props}
                options={sortedOptions}
                value={selectedOption}
                onChange={handleSelectChange}
                ref={selectRef}
                isDisabled={disabled}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
            />
            <input
                tabIndex={-1}
                autoComplete="off"
                style={{
                    opacity: 0,
                    width: "100%",
                    height: 0,
                    border: 0,
                    position: "absolute"
                }}
                value={state}
                onChange={() => {/* NOOP */ }}
                // When the hidden input is focussed as part of the required validation,
                // pass the focus onto the select
                onFocus={() => selectRef.current.focus()}
                required={required}
                disabled={disabled}
            />
        </div>
    );
};

const SelectMulti = ({
    options,
    value,
    onChange,
    disabled,
    required,
    isMulti,
    className,
    getOptionLabel = option => option.label,
    getOptionValue = option => option.value,
    ...props
}) => {
    // Store the current value as internal state
    const [state, setState] = useState(value);
    // When the value changes, use it to set the state
    useEffect(() => { setState(value); }, [value]);
    // Maintain a reference to the select that we will use to correctly maintain focus
    const selectRef = useRef(null);
    // When the select is changed, update the internal state and call the handler
    const handleSelectChange = option => {
        const optionValue = [getOptionValue(option)];
        setState(optionValue);
        onChange(optionValue);
    };
    // Sort the options by the label
    // const sortedOptions = [...options].sort(
    //     (opt1, opt2) => {
    //         const [label1, label2] = [getOptionLabel(opt1), getOptionLabel(opt2)];
    //         return (label1 > label2 ? 1 : (label1 < label2 ? -1 : 0));
    //     }
    // );
    // Select the option that corresponds to the given value

    var selectedOption = options.find(opt => getOptionValue(opt) === value);
    if (!(selectedOption)) {
        selectedOption = []
    }
    // Render the select with a hidden text input that implements required
    return (
        <div className={classNames(className, 'rich-select')}>
            <ReactSelect
                {...props}
                options={options}
                value={selectedOption}
                onChange={handleSelectChange}
                ref={selectRef}
                isDisabled={disabled}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                isMulti={isMulti}
                required={required}
                //defaultValue={[]}
                isClearable
            />
        </div>
    );
};

export const Control = forwardRef(
    (
        {
            children,
            // The id of the control
            id,
            // Indicates if the control should be disabled
            disabled,
            // The underlying control component
            Component,
            // Function for extracting a value from the change event for the underlying control
            // Defaults to the identity function if not given
            valueFromChangeEvent = evt => evt,
            // Custom classes for the underlying control
            className,
            // Allow an additional onChange handler to be defined for the control
            onChange = _ => {/* NOOP */ },
            // Additional properties that are forwarded to the underlying control
            ...props
        },
        ref
    ) => {
        // Get the parts of the form context that we need
        const data = FormContext.useDataContext();
        const formErrors = FormContext.useErrorsContext();
        const formDisabled = FormContext.useDisabledContext();
        const setField = FormContext.useSetFieldContext();
        // Use the field name to extract the relevant data and determine if the field is valid
        const value = data.hasOwnProperty(id) ? data[id] : '';
        const fieldHasErrors = formErrors.hasOwnProperty(id);
        // Create a callback to set the field value when the control is changed
        const handleChange = (...args) => {
            const newValue = valueFromChangeEvent(...args);
            setField(id, newValue);
            onChange(newValue);
        };
        // Return the underlying control
        return (
            <Component
                {...props}
                ref={ref}
                id={id}
                value={value}
                onChange={handleChange}
                disabled={formDisabled || disabled}
                className={classNames(
                    className,
                    // Add the 'is-invalid' class if the field has errors
                    { 'is-invalid': fieldHasErrors }
                )}
            >
                {children}
            </Component>
        );
    }
);


/**
 * Higher-order component providing a shorthand for turning regular form components
 * into resource form controls without creating an additional component.
 */
export const asControl = (Component, valueFromChangeEvent = evt => evt) => forwardRef(
    (props, ref) => (
        <Control
            {...props}
            ref={ref}
            Component={Component}
            valueFromChangeEvent={valueFromChangeEvent}
        />
    )
);


/**
 * Renders a regular input as part of a resource form.
 */
export const Input = asControl("input", evt => evt.target.value);


/**
 * Renders a textarea as part of a resource form.
 */
export const TextArea = asControl("textarea", evt => evt.target.value);


/**
 * Renders a react-select selector as part of a resource form.
 */
export const Select = asControl(SelectWithRequired);

export const SelectMultiControl = asControl(SelectMulti);


// The default placeholder component
// This shouldn't actually be responsible
const DefaultPlaceholderComponent = ({
    resource,
    resourceName,
    resourceNamePlural
}) => (
    <Status fetchable={resource}>
        <Status.Loading>Loading {resourceNamePlural}...</Status.Loading>
        <Status.Unavailable>Unable to load {resourceNamePlural}.</Status.Unavailable>
        <Status.Available>Select a {resourceName}...</Status.Available>
    </Status>
);


/**
 * Renders a select control to select an instance of another resource as part of a resource form.
 */
export const ResourceSelect = ({
    resource,
    resourceName,
    resourceNamePlural = `${resourceName}s`,
    filterResources = _ => true,
    PlaceholderComponent = DefaultPlaceholderComponent,
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
            <DefaultPlaceholderComponent
                resource={resource}
                resourceName={resourceName}
                resourceNamePlural={resourceNamePlural}
            />
        ),
        ...props
    };
    // Render the select with the available options
    return <Select {...selectProps} options={options} />;
};

export const ResourceMultiSelect = ({
    resource,
    resourceName,
    resourceNamePlural = `${resourceName}s`,
    filterResources = _ => true,
    PlaceholderComponent = DefaultPlaceholderComponent,
    ...props
}) => {
    // Pass the available resources as the options
    const options = Object.values(resource.data).filter(filterResources);
    //console.log(options)
    const selectProps = {
        // By default, use the name as the label and the id as the value
        getOptionLabel: option => option.data.name,
        getOptionValue: option => option.data.id,
        // Use a placeholder that shows the loading status
        placeholder: (
            <DefaultPlaceholderComponent
                resource={resource}
                resourceName={resourceName}
                resourceNamePlural={resourceNamePlural}
            />
        ),
        ...props
    };
    // Render the select with the available options
    return <SelectMultiControl {...selectProps} options={options} />;
};

// The default error component is an invalid Bootstrap form feedback component
const DefaultErrorItemComponent = ({ children }) => (
    <Form.Control.Feedback type="invalid">{children}</Form.Control.Feedback>
);


/**
 * Renders the error list for a field in a resource form.
 */
export const ErrorList = ({
    // The field to render errors for
    id,
    // The component to use for the error list
    ErrorListComponent = React.Fragment,
    // The component to use for each error
    ErrorItemComponent = DefaultErrorItemComponent,
    // The context to extract the field id from
    // Defaults to the Bootstrap form context
    context = BootstrapFormContext,
    // The key to use in the context for the field id
    contextKey = 'controlId'
}) => {
    // Try to pull the field id from the specified context
    const { [contextKey]: idFromContext } = useContext(context) || {};
    const formErrors = FormContext.useErrorsContext();
    // Extract the list of errors for the field
    const errorList = formErrors[id || idFromContext] || [];
    // If there are no errors, we are done
    if (errorList.length < 1) return null;
    // Render the errors using the specified components
    return (
        <ErrorListComponent>
            {errorList.map((error, idx) =>
                <ErrorItemComponent key={idx}>{error.detail}</ErrorItemComponent>
            )}
        </ErrorListComponent>
    );
};


// The default submit button component is a Bootstrap button with a spinner
// shown when the form action is in-progress
const DefaultSubmitButtonComponent = ({ children, inProgress, ...props }) => (
    <Button {...props} variant="success">
        {inProgress && <i className="fas fa-spin fa-sync-alt mr-2" />}
        {children}
    </Button>
);


/**
 * Renders a submit button for a resource form.
 */
export const SubmitButton = ({
    children,
    disabled,
    ButtonComponent = DefaultSubmitButtonComponent,
    ...props
}) => {
    const formDisabled = FormContext.useDisabledContext();
    const inProgress = FormContext.useInProgressContext();
    return (
        <ButtonComponent
            {...props}
            type="submit"
            disabled={formDisabled || inProgress || disabled}
            inProgress={inProgress}
        >
            {children}
        </ButtonComponent>
    );
};


/**
 * Renders a cancel button for a resource form.
 */
export const CancelButton = ({
    children,
    disabled,
    // The default button component is a Bootstrap button
    ButtonComponent = Button,
    ...props
}) => {
    const inProgress = FormContext.useInProgressContext();
    const handleCancel = FormContext.useCancelContext();
    return (
        <ButtonComponent
            {...props}
            onClick={handleCancel}
            disabled={inProgress || disabled}
        >
            {children}
        </ButtonComponent>
    );
};
