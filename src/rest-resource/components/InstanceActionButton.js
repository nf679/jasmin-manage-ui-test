import React, { useEffect, useRef, useState } from 'react';

import Button from 'react-bootstrap/Button';


// The default button component is a Bootstrap button with an in-progress spinner
const DefaultButtonComponent = ({ children, inProgress, disabled, ...props }) => (
    <Button {...props} disabled={inProgress || disabled}>
        {inProgress && <i className="fas fa-spin fa-sync-alt mr-2" />}
        {children}
    </Button>
);


/**
 * Component that provides a button for executing an action on a resource instance.
 */
export const InstanceActionButton = ({
    children,
    instance,
    action,
    onSuccess,
    onError,
    ButtonComponent = DefaultButtonComponent,
    ...props
}) => {
    // Track whether the action is in progress
    const [inProgress, setInProgress] = useState(false);

    // It is possible that the button will be unmounted when the actions completes
    // If that happens, we don't need to update inProgress as we will be unmounted anyway
    // and doing so will cause React to emit a warning about memory leaks
    // But to know that, we need to track the mounted state - to do this we use a ref
    const isMounted = useRef();
    useEffect(
        () => {
            isMounted.current = true;
            return () => { isMounted.current = false; };
        },
        []
    );

    const handleClick = async () => {
        setInProgress(true);
        let result;
        try {
            result = await instance.executeAction(action);
        }
        catch(error) {
            if( onError ) onError(error);
            return; // Once the error is handled, we are done
        }
        finally {
            if( isMounted.current ) setInProgress(false);
        }
        // Call the success handler outside the try so we don't accidentally
        // catch exceptions from it
        if( onSuccess ) onSuccess(result);
    };

    return (
        <ButtonComponent {...props} onClick={handleClick} inProgress={inProgress}>
            {children}
        </ButtonComponent>
    );
};
