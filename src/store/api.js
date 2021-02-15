import Cookies from 'js-cookie';

import { withScope } from './utils';


class HttpError extends Error {
    constructor(status, statusText, responseText) {
        super(statusText);
        this.name = this.constructor.name;
        this.status = status;
        this.statusText = statusText;
        this.responseText = responseText;
    }

    json() {
        return JSON.parse(this.responseText)
    }
}


class InvalidOperationError extends Error {
    constructor(operationName) {
        super(`Invalid operation: ${operationName}`);
        this.name = this.constructor.name;
    }
}


// Utility function that asynchronously waits for the specified duration
const sleep = (ms) => (new Promise(resolve => setTimeout(resolve, ms)));


const apiFetch = async (url, options = {}) => {
    // Populate the required headers for the request
    const headers = {};
    // For POST/PUT/DELETE, declare the content type and include the CSRF token if present
    const method = options.method || 'GET';
    if( ['POST', 'PUT', 'DELETE'].includes(method.toUpperCase()) ) {
        headers['Content-Type'] = 'application/json';
        const csrfToken = Cookies.get('csrftoken');
        if( csrfToken ) headers['X-CSRFToken'] = csrfToken;
    }
    // Make the actual request, injecting the cookie credentials and headers
    const response = await fetch(url, { ...options, headers, credentials: 'include' });
    // For a 204, just return
    if( response.status === 204 ) return;
    // Any other successful response should be JSON
    if( response.ok ) return await response.json();
    // An error response may not be JSON, so read the response as text
    const responseText = await response.text();
    // If the response indicates that the request requires authentication, redirect to auth
    if( [401, 403].includes(response.status) ) {
        // These responses will be JSON and should have a code
        const code = JSON.parse(responseText).code;
        // Some auth schemes use 401 to indicate lack of credentials, and some use
        // 403 with a code of not_authenticated - we need to catch both
        if( response.status === 401 || code === "not_authenticated" ) {
            // Get the path to redirect back to from the current location
            const currentPath = new URL(window.location.href).pathname;
            window.location = `/auth/login/?next=${currentPath}`;
            // Wait for the browser to redirect
            await sleep(2000);
        }
    }
    throw new HttpError(response.status, response.statusText, responseText);
};


const apiGet = (url, options) => apiFetch(url, options);
const apiPost = (url, data, options = {}) => apiFetch(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
});
const apiPut = (url, data, options = {}) => apiFetch(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
});
const apiDelete = (url, options = {}) => apiFetch(url, {
    ...options,
    method: 'DELETE'
});


export const newEndpoint = path => (mutate, getState) => ({
    // This is true once the endpoint has been fetched once
    initialised: false,
    // Indicates whether a fetch is currently in progress
    fetching: false,
    // The error from the last fetch, if there is one
    fetchError: null,
    initialise: async () => {
        const resource = getState();
        // If the resource is not initialised, trigger a fetch
        if( !resource.initialised ) await resource.fetch();
    },
    fetch: async () => {
        // If there is a fetch in progress, wait for the fetch to finish in a non-blocking way
        if( getState().fetching ) {
            while( getState().fetching ) await sleep(1);
            return;
        }
        // Otherwise, initiate a fetch
        mutate(state => { state.fetching = true; });
        try {
            // Fetch the resources from the API
            const result = await apiGet(path);
            // Update the state
            mutate(state => {
                // We are no longer fetching
                state.fetching = false;
                // We are also initialised
                state.initialised = true;
                // We also did a fetch without errors
                state.fetchError = null;
                // Just store the data as-is
                state.data = result;
            });
        }
        catch(error) {
            // For an error response, mark the fetch as over and store the error
            mutate(state => {
                state.fetching = false;
                state.fetchError = error;
            });
            // Rethrow the error
            throw error;
        }
    }
});


const defaultResource = {
    // This is true once there has been at least one successful fetch
    initialised: false,
    // Indicates whether a fetch is currently in progress
    fetching: false,
    // The error from the last fetch, if there is one
    fetchError: null,
    // Indicates whether a create is currently in progress
    creating: false,
    // The current data as a map of id => instance
    data: {},
    // By default, initialise is a no-op
    initialise: async () => {/* NOOP */},
    // By default, all other operations are not valid
    fetch: async () => { throw new InvalidOperationError('fetch'); },
    create: async () => { throw new InvalidOperationError('create'); },
    aggregate: () => { throw new InvalidOperationError('aggregate'); }
};


export const newResource = resourcePath => (mutate, getState, getParent) => ({
    ...defaultResource,
    // If this is a nested resource, this will return the parent resource
    parent: () => (getParent ? getParent() : undefined),
    // Initialises the resource
    initialise: async () => {
        const resource = getState();
        // If the resource is not initialised, trigger a fetch
        if( !resource.initialised ) await resource.fetch();
    },
    // Fetches all the instances for the resource
    fetch: async () => {
        // If there is a fetch in progress, wait for the fetch to finish in a non-blocking way
        if( getState().fetching ) {
            while( getState().fetching ) await sleep(1);
            return;
        }
        // Otherwise, initiate a fetch
        mutate(state => { state.fetching = true; });
        try {
            // Fetch the resources from the API
            const resourceList = await apiGet(resourcePath);
            // Update the state
            mutate(state => {
                // We are no longer fetching
                state.fetching = false;
                // We are also initialised
                state.initialised = true;
                // We also did a fetch without errors
                state.fetchError = null;
                // The data is stored as a dictionary of instances
                // Create or update the instance for each item in the returned list
                resourceList.forEach(resource => {
                    state.data[resource.id] = state.data.hasOwnProperty(resource.id) ?
                        // If there is an existing instance, update it with the new data
                        Object.assign(state.data[resource.id].data, resource) :
                        // If there is no existing instance, make a new one
                        newInstance(resource)(...withScope(mutate, getState, ["data", resource.id]));
                });
                // Remove items that are no longer in the list
                //   (remember that Javascript objects implicitly convert keys to strings)
                const nextIds = resourceList.map(resource => resource.id.toString());
                Object.keys(state.data).filter(id => !nextIds.includes(id)).forEach(id => { delete state.data[id]; });
            });
        }
        catch(error) {
            // For an error response, mark the fetch as over and store the error
            mutate(state => {
                state.fetching = false;
                state.fetchError = error;
            });
            // Rethrow the error
            throw error;
        }
    },
    // Creates a new instance of the resource
    create: async data => {
        // Mark the create as in progress
        mutate(state => { state.creating = true; });
        try {
            // Attempt to create the resource
            const resource = await apiPost(resourcePath, data);
            // Update the state if the create was successful
            mutate(state => {
                // We are no longer creating
                state.creating = false;
                // Add the new resource to the data
                state.data[resource.id] = newInstance(resource)(...withScope(mutate, getState, ["data", resource.id]));
            });
        }
        catch(error) {
            // Mark the create as over before re-throwing the error
            mutate(state => { state.creating = false; });
            throw error;
        }
    },
    // Initialise nested resources to an arbitrary depth using the URLs from links
    initNested: async (...keys) => {
        // Before the nested resources can be initialised, we need to be initialised
        await getState().initialise();
        // If no keys are given, there is nothing more to do
        if( keys.length === 0 ) return;
        // Otherwise, initialise the nested resources for each instance that was loaded
        const [firstKey, ...otherKeys] = keys;
        await Promise.all(
            Object.values(getState().data).map(instance =>
                instance.nested(firstKey).initNested(...otherKeys)
            )
        );
    },
    // Returns an aggregated resource across several levels of nesting
    aggregate: (...keys) => {
        const resource = getState();
        // If there are no keys, the aggregate resource is this resource
        if( keys.length === 0 ) return resource;
        // If this resource is not initialised, then there is nothing to aggregate
        // But the aggregate resource should also be considered not initialised
        if( !resource.initialised ) {
            return {
                ...defaultResource,
                // Initialising the aggregate means initialising the nested resources
                initialise: () => getState().initNested(...keys)
            };
        }
        // For each item in our data, use the first key to get a nested resource then
        // aggregate the remaining keys over the nested resource
        // Then collapse those resources to get the aggregate state
        const [firstKey, ...otherKeys] = keys;
        const aggregateState = Object.values(resource.data)
            .map(instance => instance.nested(firstKey).aggregate(...otherKeys))
            .reduce(
                (state1, state2) => ({
                    ...state1,
                    initialised: state1.initialised && state2.initialised,
                    fetching: state1.fetching || state2.fetching,
                    fetchError: state1.fetchError || state2.fetchError,
                    data: { ...state1.data, ...state2.data }
                }),
                // If there are no aggregates, we are initialised
                { ...defaultResource, initialised: true }
            );
        // Return a resource - aggregate resources only support initialise
        return {
            ...aggregateState,
            // Initialising the aggregate means initialising the nested resources
            initialise: () => getState().initNested(...keys)
        };
    }
});


export const newInstance = (initialData) => (mutate, getState, getParent) => ({
    // Indicates if the instance is currently being fetched
    fetching: false,
    // Indicates if the instance is currently being updated
    updating: false,
    // Indicates if the instance is currently being deleted
    deleting: false,
    // The current data for the instance
    data: initialData,
    // Initialise a nested resource for each key in the _links (that isn't self)
    // even if they aren't actually nested resources
    // Lazily loading these on demand is a major pain
    nestedResources: Object.assign(
        {},
        ...Object.entries(initialData._links)
            .filter(([name, _]) => !["self", "_links"].includes(name))
            .map(([name, url]) => ({
                [name]: newResource(url)(
                    // The resource requires scoped mutate and getState
                    ...withScope(mutate, getState, ["nestedResources", name])
                )
            }))
    ),
    // Returns the resource that the instance belongs to
    resource: getParent,
    // Returns a named nested resource
    nested: name => getState().nestedResources[name],
    // Update the instance with new data
    update: async data => {
        // Mark the update as in progress
        mutate(state => { state.updating = true; });
        try {
            const selfUrl = getState().data._links.self;
            // Attempt to update the resource
            const resource = await apiPut(selfUrl, data);
            // Update the state if the update was successful
            mutate(state => {
                state.updating = false;
                Object.assign(state.data, resource);
            });
        }
        catch(error) {
            // Mark the update as over before re-throwing the error
            mutate(state => { state.updating = false; });
            throw error;
        }
    },
    // Delete the instance
    delete: async () => {
        // Mark the delete as in progress
        mutate(state => { state.deleting = true; });
        try {
            const { id, _links: { self: selfUrl } } = getState().data;
            // Attempt to delete the resource
            await apiDelete(selfUrl);
            // Update the state if the delete was successful
            // We have to remove the instance from the parent resource
            mutate((state, parent) => {
                state.deleting = false;
                delete parent.data[id];
            });
        }
        catch(error) {
            // Mark the delete as over before re-throwing the error
            mutate(state => { state.deleting = false; });
            throw error;
        }
    },
    // Executes a named action on the resource
    executeAction: async (name, data) => {
        // Mark the resource as updating
        mutate(state => { state.updating = true; });
        try {
            // Get the URL for the action
            const actionUrl = getState().data._links[name];
            // Attempt to create the resource
            const resource = await apiPost(actionUrl, data);
            // Update the state if the action was successful
            mutate(state => {
                // We are no longer updating
                state.updating = false;
                // Update the resource data
                Object.assign(state.data, resource);
            });
        }
        catch(error) {
            // Mark the update as over before re-throwing the error
            mutate(state => { state.updating = false; });
            throw error;
        }
    }
});
