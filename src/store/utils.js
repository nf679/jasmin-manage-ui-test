import produce from 'immer';


// Maps the values of an object, maintaining the keys
// The map function receives the value as the first argument and the key as the second
// and should return a new value
export const mapValues = (mapFn, obj) => Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, mapFn(v, k)])
);


// Behaves like Python's dict.setdefault
export const setDefault = (obj, key, defaultValue) => {
    // First, make sure that the key exists in the object
    if( !obj.hasOwnProperty(key) ) obj[key] = defaultValue;
    // Then return the value of the key
    return obj[key];
}


// Decorator that replaces zustand's "set" with a "mutate" function
// that allows state to be mutated using immer
export const immer = config => (set, get, api) => config(fn => set(produce(fn)), get, api);


// Take existing mutate and getState functions and a key and returns new mutate and
// getState functions that operate on only that subset of the state
// The state modification function passed to the scoped mutate can optionally receive the
// parent state as a second argument if required, e.g. to remove itself
// We also return a third function that allows access to the parent state
export const withScope = (mutate, getState, scope) => {
    // The scope is a single key or a list of keys
    const keys = Array.isArray(scope) ? scope : [scope];
    // To get the scoped state, descend into the object with the given keys
    const scopedState = state => keys.reduce((s, k) => setDefault(s, k, {}), state);
    return [
        stateFn => mutate(state => { stateFn(scopedState(state), state); }),
        () => scopedState(getState()),
        getState
    ];
};
