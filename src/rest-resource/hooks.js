import { useCallback, useEffect, useState } from 'react';

import apiFetch from './fetch';


/**
 * Hook that fetches data from an HTTP endpoint and passes it to a callback.
 */
export const useOnFetch = (url, { onFetch, autoFetch = true } = {}) => {
    // Indicates whether a fetch is currently in progress
    // Setting this to true initially will cause the data to be loaded
    const [fetching, setFetching] = useState(autoFetch);
    // The error from the last fetch if it was not successful
    const [fetchError, setFetchError] = useState(null);

    // When a fetch is triggered by changing the state, fetch the data
    // Doing it this way ensures that we never have two fetches competing, as the fetch
    // is only triggered when fetching changes from false to true
    useEffect(
        () => {
            if( !fetching ) return;
            // useEffect expects the return value to be a cleanup function
            // This means we can't pass an async function directly as that returns a promise
            // Hence we have to make and call an anonymous function
            (async () => {
                try {
                    // Fetch the data from the endpoint
                    const result = await apiFetch(url);
                    // Update the data
                    onFetch(result);
                    // Clear any stored error
                    setFetchError(null);
                }
                catch(error) {
                    // For an error response, store the response
                    setFetchError(error);
                }
                finally {
                    // In all cases, the fetch is over
                    setFetching(false);
                }
            })();
        },
        [fetching]
    );

    // This function triggers a fetch by updating the state
    const fetch = useCallback(() => setFetching(true), []);

    // Return the public state for consumers to use
    return { fetching, fetchError, fetch };
};


/**
 * Hook for fetching data from an HTTP endpoint.
 */
export const useEndpoint = (url, { initialData, autoFetch = true } = {}) => {
    // Indicates if the endpoint has been successfully fetched at least once
    const [initialised, setInitialised] = useState(initialData !== undefined);
    // Make a variable to store the data and use it to initialise the hook
    const [data, setData] = useState(initialData);
    // When there is a successful fetch, set data and initialised
    const onFetch = data => { setData(data); setInitialised(true); };
    // Return the public state for consumers to use
    return { ...useOnFetch(url, { onFetch, autoFetch }), initialised, data };
};


/**
 * Hook for running a mutation against an HTTP endpoint.
 */
export const useMutation = (url, method) => {
    const [inProgress, setInProgress] = useState(false);
    // This function runs the mutation
    const mutate = async data => {
        setInProgress(true);
        try {
            // Attempt the mutation
            return await apiFetch(url, { method, data });
        }
        finally {
            // In all cases, the mutation is over
            setInProgress(false);
        }
    };
    // Return the public state for consumers to use
    return { inProgress, mutate };
};


/**
 * Hook for using an endpoint as a REST resource.
 */
export const useResource = (resourceUrl, { initialData, autoFetch = true } = {}) => {
    // Indicates if the resource has been successfully fetched at least once
    const [initialised, setInitialised] = useState(initialData !== undefined);
    // We store the current data as an object mapping id => instance
    const [data, setData] = useState(initialData || {});

    // This function updates the data of a single instance in the mapping
    const setInstanceData = id => transform => setData(state => {
        const nextInstanceState = transform instanceof Function ?
            transform(state[id]) :
            transform;
        // Allow the instance to set state to undefined to remove itself
        if( nextInstanceState !== undefined ) {
            return { ...state, [id]: nextInstanceState };
        }
        else {
            const { [id]: _, ...nextState } = state;
            return nextState;
        }
    });

    // When there is a successful fetch, set data and initialised
    // The data will be received in list form, which we transform into the object format
    const onFetch = instanceList => {
        setData(
            Object.assign(
                {},
                ...instanceList.map(instanceData => ({
                    [instanceData.id]: newInstance(
                        instanceData,
                        setInstanceData(instanceData.id)
                    )
                }))
            )
        )
        setInitialised(true);
    };

    // Initialise the on-fetch hook that will be responsible for fetching
    // the resource list
    const fetchState = useOnFetch(resourceUrl, { onFetch, autoFetch });

    // Use a mutation to create new instances and add them to the data
    const { inProgress: creating, mutate } = useMutation(resourceUrl, 'POST');
    const create = async data => {
        const instanceData = await mutate(data);
        setData(state => ({
            ...state,
            [instanceData.id]: newInstance(
                instanceData,
                setInstanceData(instanceData.id)
            )
        }));
    };

    // Return the pieces that comprise the public interface
    return { ...fetchState, data, initialised, creating, create };
};


/**
 * Hook for using a single resource instance independently of the resource.
 */
export const useResourceInstance = (instanceUrl, { initialData, autoFetch = true } = {}) => {
    // Indicates if the instance has been successfully fetched at least once
    const [initialised, setInitialised] = useState(initialData !== undefined);
    // We store the current data as an object mapping id => instance
    const [data, setData] = useState(initialData);
    // When there is a successful fetch, set data and initialised
    const onFetch = data => { setData(data); setInitialised(true); };
    // Initialise the fetch state
    const fetchState = useOnFetch(instanceUrl, { onFetch, autoFetch });

    // Use mutations to update and delete the resource, updating the data as required
    const { inProgress: updating, mutateUpdate } = useMutation(instanceUrl, 'PUT');
    const update = async data => setData(await mutateUpdate(data));

    const { inProgress: deleting, mutateDelete } = useMutation(instanceUrl, 'DELETE');
    const delete_ = async () => setData(await mutateDelete());

    // Executing an action is slightly more difficult as the URL depends on the action
    const [actionInProgress, setActionInProgress] = useState(false);
    const executeAction = async (name, actionData) => {
        setActionInProgress(true);
        try {
            // Attempt to apply the action
            const instanceData = await apiFetch(
                data._links[name],
                { method: 'POST', data: actionData }
            );
            setData(instanceData);
        }
        finally {
            setActionInProgress(false);
        }
    };

    // Return the pieces that comprise the public interface
    return {
        ...fetchState,
        data,
        initialised,
        updating: updating || actionInProgress,
        update,
        deleting,
        delete: delete_,
        executeAction
    };
};


// The setState function received by newInstance is scoped to update the data for the resource
const newInstance = (initialData, setState) => ({
    // Indicates if the instance is currently being fetched
    fetching: false,
    // Indicates if the instance is currently being updated
    updating: false,
    // Indicates if the instance is currently being deleted
    deleting: false,
    // The error from the last fetch if it was not successful
    fetchError: null,
    // The current data for the instance
    data: initialData,
    // Re-fetch the data for the instance
    fetch: async () => {
        // Mark the fetch as in progress
        setState(state => ({ ...state, fetching: true }));
        try {
            // Attempt to fetch the instance
            const instanceData = await apiFetch(initialData._links.self);
            // Update the state if successful
            setState(state => ({ ...state, fetching: false, data: instanceData }));
        }
        catch(error) {
            // If the fetch is not successful, store the error
            setState(state => ({ ...state, fetching: false, fetchError: error }));
        }
    },
    // Update the instance with new data
    update: async data => {
        // Make the update as in progress
        setState(state => ({ ...state, updating: true }));
        try {
            // Attempt to update the instance
            const instanceData = await apiFetch(initialData._links.self, { method: 'PUT', data });
            // Update the state if the update was successful
            setState(state => ({ ...state, updating: false, data: instanceData }));
        }
        catch(error) {
            // On failure, mark the update as over before re-throwing the error
            setState(state => ({ ...state, updating: false }));
            throw error;
        }
    },
    // Delete the instance
    delete: async () => {
        // Mark the delete as in progress
        setState(state => ({ ...state, deleting: true }));
        try {
            // Attempt to delete the instance
            await apiFetch(initialData._links.self, { method: 'DELETE' });
            // Remove the entry if the delete is successful
            setState(undefined);
        }
        catch(error) {
            // On failure, mark the delete as over before re-throwing the error
            setState(state => ({ ...state, deleting: false }));
            throw error;
        }
    },
    // Executes a named action on the instance
    executeAction: async (name, data) => {
        // Mark the instance as updating
        setState(state => ({ ...state, updating: true }));
        try {
            // Attempt to apply the action
            const instanceData = await apiFetch(initialData._links[name], { method: 'POST', data });
            // Update the state if the action was successful
            setState(state => ({ ...state, updating: false, data: instanceData }));
        }
        catch(error) {
            // On failure, mark the update as over before re-throwing the error
            setState(state => ({ ...state, updating: false }));
            throw error;
        }
    }
});
