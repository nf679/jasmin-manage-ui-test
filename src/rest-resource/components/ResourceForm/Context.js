import React, { createContext, useContext, useEffect, useState } from 'react';


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
// Context to hold the form submit function
const FormSubmitContext = createContext();


/**
 * Set of hooks to expose parts of the form context.
 */
export const useDataContext = () => useContext(FormDataContext);
export const useErrorsContext = () => useContext(FormErrorsContext);
export const useDisabledContext = () => useContext(FormDisabledContext);
export const useInProgressContext = () => useContext(FormInProgressContext);
export const useSetFieldContext = () => useContext(FormSetFieldContext);
export const useCancelContext = () => useContext(FormCancelContext);
export const useSubmitContext = () => useContext(FormSubmitContext);


/**
 * Context provider for use with resource create and update forms.
 */
export const Provider = ({
    children,
    // Function that is called with the form data when the form is submitted
    onSubmit,
    // Function that is called when the form submission is successful
    onSuccess,
    // Function that is called with the error when the form submission fails
    onError,
    // Function that is called when the form is cancelled
    onCancel,
    // Initial data for the form
    initialData = {},
    // Indicates if the form should be disabled
    disabled = false
}) => {
    // State for the form data
    const [formData, setFormData] = useState(initialData);

    // State for the form errors
    const [formErrors, setFormErrors] = useState({});
    // State that indicates if the form is in progress
    const [inProgress, setInProgress] = useState(false);

    // Function that sets a field in the form data
    const setField = (name, value) => {
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
                                <FormSubmitContext.Provider value={handleSubmit}>
                                    {children}
                                </FormSubmitContext.Provider>
                            </FormCancelContext.Provider>
                        </FormSetFieldContext.Provider>
                    </FormInProgressContext.Provider>
                </FormDisabledContext.Provider>
            </FormErrorsContext.Provider>
        </FormDataContext.Provider>
    );
};
