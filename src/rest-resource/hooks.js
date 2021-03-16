import { useEffect, useMemo, useRef, useState } from 'react';

import apiFetch from './fetch';


/**
 * Hook that defines a point in the tree at which a fetch will be triggered
 * for a fetchable if required.
 *
 * The hook does this in a way that attempts to minimise duplicate fetches. However if there
 * are multiple fetch points in the tree for a given fetchable, it cannot do much about that.
 */
export const useFetchPoint = fetchable => {
    // Extract the pieces we are interested in from the fetchable
    const { fetching, dirty, fetch } = fetchable;
    // Trigger a refetch whenever dirty changes to true and there is not an active fetch
    useEffect(
        () => {
            // Check if there is anything to do, and return if not
            if( fetching || !dirty ) return;
            // Otherwise, execute the fetch and return the cancel handle
            return fetch();
        },
        [dirty]
    );
    // Just return the fetchable as-is
    return fetchable;
};


/**
 * Hook that can be used to ensure that a fetchable is initialised when a component is mounted.
 */
export const useEnsureInitialised = fetchable => {
    // Extract the pieces we are interested in from the fetchable
    const { initialised, markDirty } = fetchable;
    // Note that this won't trigger a second fetch if one is already in progress
    // We only want to execute this once when the component is first mounted
    useEffect(() => { if( !initialised ) markDirty(); }, []);
    // Just return the fetchable as-is
    return fetchable;
};


/**
 * Hook that can be used to ensure that a fetchable is refreshed when a component is mounted.
 */
export const useEnsureRefreshed = fetchable => {
    // This hook tracks the refreshing state in a way that is initially true
    // This is because the fetchable is not marked dirty until *after* the initial render,
    // which means relying on "fetchable.fetching" will result in a flicker where it is not
    // fetching on first render
    const [isInitialRender, setIsInitialRender] = useState(true);
    const { fetching, dirty, markDirty } = fetchable;
    // When the component is first mounted, mark the fetchable as dirty to trigger a refresh
    useEffect(() => { markDirty(); setIsInitialRender(false); }, []);
    // Return true until the fetchable is done fetching
    return isInitialRender || dirty || fetching;
};


// Function to produce the initial state for an endpoint
const endpointInitialState = ({ initialData, autoFetch = true }) => ({
    // Indicates if data has been fetched successfully at least once
    initialised: initialData !== undefined,
    // Indicates if the data is out-of-date and needs to be fetched
    // Initially, an endpoint is considered dirty (i.e. a fetch will be triggered) if
    // no initial data is given and autoFetch is enabled
    dirty: autoFetch && initialData === undefined,
    // Indicates if a fetch is currently in progress
    fetching: false,
    // The error from the last fetch, if it was not successful
    fetchError: null,
    // The data from the last successful fetch
    data: initialData
});


// Function to return the "methods" for an endpoint
const endpointMethods = (
    url,
    setState,
    // Allow a transformation to be applied to the data before it is stored
    // By default, we do nothing
    transformData = data => data
) => ({
    // This function fetches new data from the endpoint
    fetch: () => {
        // Mark the fetch as in progress
        // Once the fetch has been adopted, consider the fetchable no-longer dirty
        setState(state => ({ ...state, fetching: true }));
        // In order to prevent state updates after a component has been unmounted,
        // we need to be able to cancel fetches
        // To do this, we can use an abort controller
        const controller = new AbortController();
        // Start the fetch using the signal from the controller
        apiFetch(url, { signal: controller.signal })
            // If the promise resolves, update the state with the new data
            .then(data => setState(state => ({
                ...state,
                // We are no longer dirty
                dirty: false,
                // We are now definitely initialised
                initialised: true,
                // We are no longer fetching
                fetching: false,
                // Clear any existing error
                fetchError: null,
                // Transform the data and store it
                data: transformData(data)
            })))
            // If the promise rejects, update the state with the error
            .catch(error => {
                // If the error is an abort error, it is because the component that
                // owns the data has been unmounted so don't update the state
                if( error.name === "AbortError" ) return;
                setState(state => ({
                    ...state,
                    // In order to avoid infinite fetch loops, mark as not dirty
                    dirty: false,
                    // We are no longer fetching
                    fetching: false,
                    // Store the error
                    fetchError: error
                }))
            });
        // Return the abort function to allow the fetch to be cancelled from outside
        return () => controller.abort();
    },
    // This data marks the endpoint as dirty, causing the useFetchPoint hook to re-fetch data
    markDirty: () => { setState(state => ({ ...state, dirty: true })); }
});


/**
 * Hook for fetching data from an HTTP endpoint.
 */
export const useEndpoint = (url, options) => {
    // Make a state container to hold the current endpoint state
    const [state, setState] = useState(endpointInitialState(options || {}));
    // Get the endpoint methods - we memoize them to avoid objects changing
    // If the URL happens to change (it shouldn't!), then make new methods
    const methods = useMemo(() => endpointMethods(url, setState), [url]);
    // The returned object combines the state with the methods
    // Make this hook also be a fetch point for the endpoint
    return useFetchPoint({ ...state, ...methods });
};


// Function to produce the initial state for a resource
const resourceInitialState = ({ initialData, autoFetch = true }) => ({
    // Start with the endpoint state (a resource is just an endpoint for fetching)
    ...endpointInitialState({ initialData, autoFetch }),
    // The resource state is stored as a map of id => instance
    // Use an object for the state by default
    data: initialData || {},
    // Add an additional flag to indicate if a create is in progress
    creating: false
});


// Function to produce the methods for a resource
const resourceMethods = (url, setState) => {
    // Function to make instance methods scoped to the resource data
    const scopedInstanceMethods = instanceData => {
        const instanceId = instanceData.id;
        // Use the self link if present, otherwise build a link
        const instanceUrl = instanceData._links ?
            instanceData._links.self :
            `${url}${instanceId}/`;
        // Make a setState function that is scoped to the instance
        const setInstanceState = transform => setState(state => {
            // Apply the transform to get the next state of the instance
            const nextState = transform instanceof Function ?
                transform(state.data[instanceId]) :
                transform;
            // Allow the instance to set state to undefined to remove itself
            if( nextState !== undefined ) {
                const nextData = { ...state.data, [instanceId]: nextState };
                return { ...state, data: nextData };
            }
            else {
                const { [instanceId]: _, ...nextData } = state.data;
                return { ...state, data: nextData };
            }
        });
        // Return the methods for the instance
        return instanceMethods(instanceUrl, setInstanceState);
    };
    // Combine the endpoint methods with an additional method for creating resource instances
    return {
        ...endpointMethods(
            url,
            setState,
            // The state as returned by the endpoint will be a raw array of instance data
            // We need to convert that into a map of id => resource instance
            instanceList => {
                return Object.assign(
                    {},
                    ...instanceList.map(instanceData => ({
                        [instanceData.id]: {
                            ...instanceInitialState({ initialData: instanceData }),
                            ...scopedInstanceMethods(instanceData)
                        }
                    }))
                );
            }
        ),
        create: async data => {
            // Make the create as in progress
            setState(state => ({ ...state, creating: true }));
            try {
                // Attempt to create an instance
                const instanceData = await apiFetch(url, { method: 'POST', data });
                // If the create was successful, add a new instance to the data
                setState(state => ({
                    ...state,
                    creating: false,
                    data: {
                        ...state.data,
                        [instanceData.id]: {
                            ...instanceInitialState({ initialData: instanceData }),
                            ...scopedInstanceMethods(instanceData)
                        }
                    }
                }));
            }
            catch(error) {
                // On failure, mark the create as over before re-throwing the error
                setState(state => ({ ...state, creating: false }));
                throw error;
            }
        }
    };
};


/**
 * Hook for using an HTTP endpoint as a REST resource.
 */
export const useResource = (url, options) => {
    // Make a state container to hold the current resource state
    const [state, setState] = useState(resourceInitialState(options || {}));
    // Get the resource methods - we memoize them to avoid objects changing
    // If the URL happens to change (it shouldn't!), then make new methods
    const methods = useMemo(() => resourceMethods(url, setState), [url]);
    // The returned object combines the state with the methods
    // Make this hook also be a fetch point for the resource
    return useFetchPoint({ ...state, ...methods });
};


// Function to produce the initial state for a resource instance
const instanceInitialState = options => ({
    // Start with the endpoint state (a resource instance is just an endpoint for fetching)
    ...endpointInitialState(options),
    // Add additional flags to indicate when update and delete are in progress
    updating: false,
    deleting: false
});


// Function to produce the methods for a resource instance
const instanceMethods = (url, setState) => ({
    // Start with the endpoint methods for data fetching
    ...endpointMethods(url, setState),
    // Update the instance with new data
    update: async data => {
        // Make the update as in progress
        setState(state => ({ ...state, updating: true }));
        try {
            // Attempt to update the instance
            const instanceData = await apiFetch(url, { method: 'PUT', data });
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
            await apiFetch(url, { method: 'DELETE' });
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


/**
 * Hook for using an HTTP endpoint as a detached instance of a REST resource.
 */
export const useInstance = (url, options) => {
    // Make a state container to hold the current resource state
    const [state, setState] = useState(instanceInitialState(options || {}));
    // Get the methods - we memoize them to avoid objects changing
    // If the URL happens to change (it shouldn't!), then make new methods
    const methods = useMemo(() => instanceMethods(url, setState), [url]);
    // The returned object combines the state with the methods
    // Make this hook also be a fetch point for the instance
    return useFetchPoint({ ...state, ...methods });
};


/**
 * Hook for using a nested resource from an instance.
 */
export const useNestedResource = (instance, name, options) => {
    const nestedUrl = instance.data._links[name];
    return useResource(nestedUrl, options);
};
