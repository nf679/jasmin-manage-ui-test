import { useEffect, useState } from 'react';

import {
    apiFetch,
    createContextForEndpoint,
    createContextForResource,
    useResource,
    useInstance,
    useFetchPoint
} from '../rest-resource';


// Create a context for the current user and export the hook
const CurrentUser = createContextForEndpoint("/api/me/");
const CurrentUserProvider = CurrentUser.Provider;
export const useCurrentUser = CurrentUser.hook;


// All other resources require authentication before they can be fetched
// This higher-order component wraps a provider so that it is only mounted once
// the user is successfully initialised
const withAuthentication = Provider => ({ children }) => {
    const currentUser = useCurrentUser();
    // Only wrap the children in the provider if the user is authenticated
    return currentUser.initialised ? <Provider>{children}</Provider> : children;
};


// Create a context each for the top-level, read-only resources that don't change
// often and we want to share across the component tree
const Categories = createContextForResource("/api/categories/");
const Consortia = createContextForResource("/api/consortia/");
const Resources = createContextForResource("/api/resources/");

// Wrap the providers with the higher-order component for authentication
const CategoriesProvider = withAuthentication(Categories.Provider);
const ConsortiaProvider = withAuthentication(Consortia.Provider);
const ResourcesProvider = withAuthentication(Resources.Provider);

// Export the hooks for each resource
export const useCategories = Categories.hook;
export const useConsortia = Consortia.hook;
export const useResources = Resources.hook;

// Export a single provider that provides all the top-level resources
export const Provider = ({ children }) => (
    <CurrentUserProvider>
        <CategoriesProvider>
            <ConsortiaProvider>
                <ResourcesProvider>
                    {children}
                </ResourcesProvider>
            </ConsortiaProvider>
        </CategoriesProvider>
    </CurrentUserProvider>
);


// Export a hook for loading a consortium by id
export const useConsortium = (id, options) => useInstance(`/api/consortia/${id}/`, options);

// Export hooks for accessing projects
// We don't treat the project list as a top-level shared resource because:
//   1. The list, or objects within it, changes relatively often
//   2. Projects can be loaded by id that are not in the list, e.g. when the user
//      is a consortium manager, which reduces the value in caching the list
export const useProjects = options => useResource("/api/projects/", options);
export const useProject = (id, options) => useInstance(`/api/projects/${id}/`, options);

// Export hook for loading requirement by id
export const useRequirement = (id, options) => useInstance(`/api/requirements/${id}/`, options);

// Export hook for loading service by id
export const useService = (id, options) => useInstance(`/api/services/${id}/`, options);

// Export a function for joining a project with an invite code
export const joinProject = async code => apiFetch('/api/join/', { method: 'POST', data: { code } });

// Export hook for loading category by id
export const useCategory = (id, options) => useInstance(`/api/categories/${id}/`, options);

// Export hook for loading resource by id
export const useResourceType = (id, options) => useInstance(`/api/resources/${id}/`, options);


// Export a hook for using a project event stream
export const useProjectEvents = (project, options) => {
    const { fetchPoint = true, autoFetch = true } = options || {};

    const [initialised, setInitialised] = useState(false);
    const [dirty, setDirty] = useState(autoFetch);
    const [fetching, setFetching] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [data, setData] = useState([]);

    // Get the events URL from the project links
    const eventsUrl = project.data._links.events;

    // Build the stream object with fetchable methods
    const stream = {
        initialised,
        dirty,
        fetching,
        fetchError,
        data,
        // This function loads more events
        fetch: () => {
            // Build the URL to use
            const url = new URL(eventsUrl);
            // If there is a most recent event, use its time for the since parameter
            const event = data.find(_ => true);
            if( event ) url.searchParams.append("since", event.created_at);
            // Mark the fetch as in progress
            setFetching(true);
            // In order to prevent state updates after a component has been unmounted,
            // we need to be able to cancel fetches
            // To do this, we can use an abort controller
            const controller = new AbortController();
            // Start the fetch using the signal from the controller
            apiFetch(url, { signal: controller.signal })
                // If the promise resolves, update the state with the new data
                .then(newData => {
                    // Prepend the data to the existing data
                    setData([...newData, ...data]);
                    setInitialised(true);
                    setFetching(false);
                    setDirty(false);
                    setFetchError(null);
                })
                // If the promise rejects, update the state with the error
                .catch(error => {
                    // If the error is an abort error, it is because the component that
                    // owns the data has been unmounted so don't update the state
                    if( error.name === "AbortError" ) return;
                    setFetching(false);
                    setDirty(false);
                    setFetchError(error);
                });
            // Return the abort function to allow the fetch to be cancelled from outside
            return () => controller.abort();
        },
        // This function marks the stream as dirty, causing more data to be fetched
        markDirty: () => setDirty(true),
        // This function resets the stream, clearing all the data and triggering a re-fetch
        reset: () => {
            setInitialised(false);
            setDirty(true);
            setFetching(false);
            setFetchError(null);
            setData([]);
        }
    };

    // Hooks cannot be conditional, so we always have to call the fetch point hook
    // However we can effectively disable it by making sure it never sees a dirty stream
    useFetchPoint({ ...stream, dirty: fetchPoint && stream.dirty });

    // We need to be a fetch point for the event stream
    return stream;
};
