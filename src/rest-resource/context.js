import React, { createContext, useContext, useEffect } from 'react';

import { useEndpoint, useResource, useInstance } from './hooks';


// This higher order function turns a hook into a context, allowing the hook
// state to be shared between components
const createContextForHook = hookFunction => (url, options = {}) => {
    // Make a new context
    const Context = createContext();
    // Return a provider and hook that use the context to share the hook state
    return {
        // The provider is an anchor for the data and also a fetch point
        // However, we do not auto-fetch the data as soon as the provider as mounted
        Provider: ({ children }) => {
            const fetchable = hookFunction(url, { ...options, autoFetch: false });
            return <Context.Provider value={fetchable}>{children}</Context.Provider>;
        },
        // The first time a component using the hook is mounted, the data for the fetchable
        // is initialised if it has not already been initialised
        hook: (autoFetch = true) => {
            const fetchable = useContext(Context);
            useEffect(
                // If the fetchable is not initialised, trigger a fetch by marking it as dirty
                // This should not trigger multiple fetches
                () => { if( autoFetch && !fetchable.initialised ) fetchable.markDirty(); },
                []
            );
            return fetchable;
        }
    };
};


export const createContextForEndpoint = createContextForHook(useEndpoint);
export const createContextForResource = createContextForHook(useResource);
export const createContextForInstance = createContextForHook(useInstance);
