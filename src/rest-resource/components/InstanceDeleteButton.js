import React, { useEffect, useRef, useState } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';


// Default delete button component is a Bootstrap button
const DefaultButtonComponent = props => (
    <Button variant="danger" {...props}>
        <i className="fas fa-trash" />
        <span className="sr-only">Delete</span>
    </Button>
);


// Default modal component is a Bootstrap modal
const DefaultModalComponent = ({ children, ...props }) => (
    <Modal backdrop="static" keyboard={false} {...props}>
        {children}
    </Modal>
);


// Default actions component is a Bootstrap modal footer
const DefaultActionsComponent = ({
    inProgress,
    onCancel,
    onConfirm,
    deleteButtonText = "Delete"
}) => (
    <Modal.Footer>
        <Button onClick={onCancel} disabled={inProgress}>Cancel</Button>
        <Button onClick={onConfirm} variant="danger" disabled={inProgress}>
            {inProgress && <i className="fas fa-spin fa-sync-alt mr-2" />}
            {deleteButtonText}
        </Button>
    </Modal.Footer>
);


/**
 * Component that provides a button for deleting a resource instance with a confirmation modal.
 */
export const InstanceDeleteButton = ({
    children,
    instance,
    onSuccess,
    onError,
    hideModalOnError = true,
    deleteButtonText,
    ButtonComponent = DefaultButtonComponent,
    ModalComponent = DefaultModalComponent,
    ActionsComponent = DefaultActionsComponent,
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

    // Function that is executed when deletion is confirmed
    const handleConfirm = async () => {
        try {
            await instance.delete();
        }
        catch(error) {
            if( onError ) onError(error);
            if( hideModalOnError ) hideModal();
            // Handling the event is done
            return;
        }
        // Call the success handler outside the try so we don't accidentally
        // catch exceptions from the success handler
        if( onSuccess ) onSuccess();
        // We can close the modal
        hideModal();
    };

    return (<>
        <ButtonComponent {...props} onClick={showModal} />
        <ModalComponent show={modalVisible}>
            {children}
            <ActionsComponent
                inProgress={instance.deleting}
                onCancel={hideModal}
                onConfirm={handleConfirm}
                deleteButtonText={deleteButtonText}
            />
        </ModalComponent>
    </>);
};
