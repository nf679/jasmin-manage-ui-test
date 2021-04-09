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
 * This hook allows access to the state from the previous render.
 */
const usePreviousState = state => {
    // This is accomplished by updating a ref after the render
    const ref = useRef();
    useEffect(() => { ref.current = state; });
    return ref.current;
};


/**
 * Hook that can be used to ensure that a fetchable is refreshed when a component is mounted.
 */
export const useEnsureRefreshed = fetchable => {
    const [refreshed, setIsRefreshed] = useState(false);
    const { initialised, fetching, markDirty } = fetchable;
    // When the component is mounted, mark the fetchable as dirty to trigger a refresh
    useEffect(() => { markDirty(); }, []);
    // When fetching goes from true to false, consider the fetchable refreshed
    // It is still possible that there may have been an error, which is fine
    const fetchingPrev = usePreviousState(fetching);
    useEffect(
        () => { if( fetchingPrev && !fetching ) setIsRefreshed(true); },
        [fetchingPrev, fetching]
    );
    // Return a fetchable that is not considered initialised until the refresh is complete
    return { ...fetchable, initialised: initialised && refreshed };
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
    transformData = data => data,
    // Allow additional reset state to be applied
    resetExtraState = {}
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
    // This function marks the endpoint as dirty, causing the useFetchPoint hook to re-fetch data
    markDirty: () => setState(state => ({ ...state, dirty: true })),
    // This function resets the endpoint, clearing all the data and triggering a re-fetch
    reset: () => setState(state => ({
        ...state,
        initialised: false,
        dirty: true,
        fetching: false,
        fetchError: null,
        data: undefined,
        ...resetExtraState
    }))
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
            instanceList => Object.assign(
                {},
                ...instanceList.map(instanceData => ({
                    [instanceData.id]: {
                        ...instanceInitialState({ initialData: instanceData }),
                        ...scopedInstanceMethods(instanceData)
                    }
                }))
            ),
            // On a reset, make sure data gets reset to an object
            { data: {} }
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
                return instanceData;
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
    deleting: false,
    // Stores data for nested resources
    nestedResources: {}
});


// Function to produce the methods for a resource instance
const instanceMethods = (url, setState) => ({
    // Start with the endpoint methods for data fetching
    ...endpointMethods(
        url,
        setState,
        // Use the default transform
        undefined,
        // Make sure nested resources are reset
        { nestedResources: {} }
    ),
    // Produces a set of resource methods for the specified nested resource
    nestedResourceMethods: (name, nestedUrl, options) => {
        // Make a setState function that is scoped to the nested data
        const setNestedState = transform => setState(state => {
            // First, we need to get the previous nested state
            // If there is no state yet, we need to initialise it
            const prevState = state.nestedResources[name] || resourceInitialState(options);
            // Apply the transform to get the next state
            const nextState = transform instanceof Function ?
                transform(prevState) :
                transform;
            // Update the stored nested state with the new state
            return {
                ...state,
                nestedResources: {
                    ...state.nestedResources,
                    [name]: nextState
                }
            };
        });
        // Return a set of resource methods that are correctly scoped
        return resourceMethods(nestedUrl, setNestedState);
    },
    // Update the instance with new data
    update: async data => {
        // Make the update as in progress
        setState(state => ({ ...state, updating: true }));
        try {
            // Attempt to update the instance
            const instanceData = await apiFetch(url, { method: 'PUT', data });
            // Update the state if the update was successful
            setState(state => ({ ...state, updating: false, data: instanceData }));
            return instanceData;
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
        const actionUrl = `${url}${name}/`;
        // Mark the instance as updating
        setState(state => ({ ...state, updating: true }));
        try {
            // Attempt to apply the action
            const instanceData = await apiFetch(actionUrl, { method: 'POST', data });
            // Update the state if the action was successful
            setState(state => ({ ...state, updating: false, data: instanceData }));
            return instanceData;
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
    // We allow the caller to decide whether this should be a fetch point for the
    // nested resource or just a point where the data and methods can be accessed
    // Note that unless at least one usage in the component tree is a fetch point,
    // the data will NEVER be loaded!
    // Note also that this is distinct from autoFetch, which only prevents the hook
    // from automatically fetching data on first mount, not from re-fetching when dirty
    const { fetchPoint = true, ...resourceOptions } = options || {};
    // Get the current nested state
    const state = instance.nestedResources[name] || resourceInitialState(resourceOptions);
    // Get the correctly scoped methods
    const methods = instance.nestedResourceMethods(
        name,
        instance.data._links[name],
        resourceOptions
    );
    // Assemble the resource by combining the state and methods
    const resource = { ...state, ...methods };
    // Hooks cannot be conditional, so we always have to call the fetch point hook
    // However we can effectively disable it by making sure it never sees a dirty resource
    useFetchPoint({ ...resource, dirty: fetchPoint && resource.dirty });
    // Return the original state of the resource
    return resource;
};


/**
 * Hook for producing a read-only resource which is an aggregation over a nested resource
 * for all instances of a resource.
 */
export const useAggregateResource = (resource, name, options) => {
    // We allow the caller to decide whether this should be a fetch point for the
    // nested resources we are aggregating over, or just a point where the data and
    // methods can be accessed
    // Note that unless the resources are fetched at at least one point in the component
    // tree, the data will NEVER be loaded!
    // Note also that this is distinct from autoFetch, which only prevents the hook
    // from automatically fetching data on first mount, not from re-fetching when dirty
    const { fetchPoint = true, autoFetch = true } = options || {};
    // Aggregate the state over the resource instances
    const aggregateResource = Object.values(resource.data).reduce(
        (aggregate, instance) => {
            // Get the nested resource state from the instance
            const state = (
                instance.nestedResources[name] ||
                resourceInitialState({ autoFetch })
            );
            // Get the correctly scoped methods
            const methods = instance.nestedResourceMethods(
                name,
                instance.data._links[name],
                { autoFetch }
            );
            return {
                // The aggregate resource is initialised when all the nested resources are
                initialised: aggregate.initialised && state.initialised,
                // The aggregate resource is dirty when one of the nested resources is
                dirty: aggregate.dirty || state.dirty,
                // The aggregate resource is fetching when one of the nested resources is
                fetching: aggregate.fetching || state.fetching,
                // Use the first error
                fetchError: aggregate.fetchError || state.fetchError,
                // Merge the data together
                data: { ...aggregate.data, ...state.data },
                fetch: () => {
                    // Run the fetch for the aggregate and get the cancel function
                    const aggregateCancel = aggregate.fetch();
                    // If the nested resource is dirty and not currently fetching, fetch it
                    const nestedCancel = state.dirty && !state.fetching ?
                        methods.fetch() :
                        // In this case there is nothing to cancel
                        () => {};
                    // The aggregate cancel function just runs both functions
                    return () => { aggregateCancel(); nestedCancel(); };
                },
                markDirty: () => { aggregate.markDirty(); methods.markDirty(); },
                reset: () => { aggregate.reset(); methods.reset(); }
            };
        },
        {
            // When there is no data, the aggregate resource is initialised if the resource is
            initialised: resource.initialised,
            dirty: false,
            fetching: false,
            fetchError: null,
            data: {},
            // When there is no data, fetching returns a cancel function that does nothing
            fetch: () => () => {},
            // Marking dirty and resetting are no-ops
            markDirty: () => {},
            reset: () => {}
        }
    );
    // Hooks cannot be conditional, so we always have to call the fetch point hook
    // However we can effectively disable it by making sure it never sees a dirty resource
    useFetchPoint({
        ...aggregateResource,
        dirty: fetchPoint && aggregateResource.dirty
    });
    // Return the original state of the resource
    return aggregateResource;
};
