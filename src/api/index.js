import {
    useEndpoint,
    useResource,
    createContextForHook,
    useResourceInstance
} from '../rest-resource';


const createContextForEndpoint = createContextForHook(useEndpoint);
const createContextForResource = createContextForHook(useResource);


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


// Create contexts for the persistent shared resources
const Categories = createContextForResource("/api/categories/");
const Consortia = createContextForResource("/api/consortia/");
const Resources = createContextForResource("/api/resources/");

// Export the hooks for those
export const useCategories = Categories.hook;
export const useConsortia = Consortia.hook;
export const useResources = Resources.hook;

// Wrap the providers with the higher-order component
const CategoriesProvider = withAuthentication(Categories.Provider);
const ConsortiaProvider = withAuthentication(Consortia.Provider);
const ResourcesProvider = withAuthentication(Resources.Provider);


// Export a single provider that initialises all the shared resources
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


// Export a hook for accessing the projects when required
export const useProjects = () => useResource("/api/projects/");

// Export a hook for accessing an individual project instance by id
export const useProject = (id, options) => useResourceInstance(`/api/projects/${id}/`, options);
