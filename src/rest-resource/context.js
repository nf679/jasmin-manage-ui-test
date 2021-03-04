import React, { createContext, useContext } from 'react';


/**
 * Higher-order function that turns hooks into contexts.
 */
const createContextForHook = hookFunction => (...args) => {
    // Make a new context
    const Context = createContext();
    // Return a provider and hook that use the context to distribute the hook state
    return {
        Provider: ({ children }) => {
            const hookState = hookFunction(...args);
            return <Context.Provider value={hookState}>{children}</Context.Provider>;
        },
        hook: () => useContext(Context)
    };
};


export default createContextForHook;
