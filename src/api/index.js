import {
    createContextForEndpoint,
    createContextForResource,
    useResource,
    useInstance
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
