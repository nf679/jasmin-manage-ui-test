import React, { useEffect, useRef, useState } from 'react';

import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import ReactSelect from 'react-select';

import ReactMarkdown from 'react-markdown';

import '../css/form-controls.css';


/**
 * Sort the data using the values produced by the key function.
 */
export const sortByKey = (data, keyFn) => [...data].sort(
    (e1, e2) => {
        const [k1, k2] = [keyFn(e1), keyFn(e2)];
        return (k1 > k2 ? 1 : (k1 < k2 ? -1 : 0));
    }
);


export const SpinnerWithText = ({ children, justify = 'start', ...spinnerProps }) => (
    <div className={`d-flex align-items-center justify-content-${justify}`}>
        <Spinner className="mr-2" animation="border" {...spinnerProps} />
        <span>{children}</span>
    </div>
);


export const notificationFromError = error => {
    let title, message;
    if( error.name === "HttpError" ) {
        title = error.statusText;
        // Extract the most useful information from the error for the message
        // For 4xx errors, the server should always return valid JSON
        // For 5xx errors, all bets are off so just use the response text
        if( error.status >= 400 && error.status < 500 ) {
            const errorObj = error.json();
            message = errorObj.detail || JSON.stringify(errorObj);
        }
        else {
            message = error.responseText;
        }
    }
    else {
        // For any other error, just use the name and message of the error
        title = error.name;
        message = error.message;
    }
    return { level: 'danger', title, message };
};


/**
 * Wrapper for a form control that calls the onChange handler with the new value
 * instead of an event.
 */
export const Control = ({
    // The change handler, which will receive the value
    onChange,
    // The component that will be rendered
    as: Component,
    // This function extracts a value from the change event for the component
    // It receives the arguments that are passed to the onChange handler
    valueFromChangeEvent,
    ...props
}) => {
    const handleChange = (...args) => onChange(valueFromChangeEvent(...args));
    return <Component {...props} onChange={handleChange} />;
};


/**
 * Wrapper for an input that calls the onChange handler with the new value
 * instead of an event.
 */
export const Input = props => {
    const extractValue = event => event.target.value;
    return <Control {...props} as="input" valueFromChangeEvent={extractValue} />;
};


/**
 * Wrapper for a textarea that calls the onChange handler with the new value
 * instead of an event.
 */
export const TextArea = props => {
    const extractValue = event => event.target.value;
    return <Control {...props} as="textarea" valueFromChangeEvent={extractValue} />;
};


/**
 * Provides a markdown editor that can be used as a Bootstrap form control.
 */
export const MarkdownEditor = ({ value, ...props }) => {
    const [selectedTab, setSelectedTab] = useState("write");
    return (
        <div className="markdown-editor">
            <Tabs activeKey={selectedTab} onSelect={setSelectedTab}>
                <Tab eventKey="write" title="Write">
                    <TextArea value={value} rows={5} {...props} />
                    <small className="form-text text-muted">
                        This field may contain <a href="https://www.markdownguide.org/" target="_blank">Markdown</a>.
                    </small>
                </Tab>
                <Tab eventKey="preview" title="Preview">
                    <ReactMarkdown source={value} />
                </Tab>
            </Tabs>
        </div>
    );
};


const noop = () => {/* NOOP */};


/**
 * Wrapper for react-select that lets it behave a bit more like a normal select.
 */
export const Select = ({
    options,
    value,
    onChange,
    disabled,
    required,
    getOptionLabel = option => option.label,
    getOptionValue = option => option.value,
    className = '',
    ...props
}) => {
    // Store the current value as internal state
    const [state, setState] = useState(value || '');
    // When the value changes, use it to set the state
    useEffect(() => { setState(value); }, [value]);
    // Maintain a reference to the select that we will use to correctly maintain focus
    const selectRef = useRef(null);
    // When the select is changed, update the internal state and call the handler
    const handleSelectChange = option => {
        const optionValue = getOptionValue(option);
        setState(optionValue);
        onChange(optionValue);
    };
    // Sort the options by the label
    const sortedOptions = sortByKey(options, getOptionLabel);
    // Select the option that corresponds to the given value
    const selectedOption = sortedOptions.find(opt => getOptionValue(opt) === value);
    // Render the select with a hidden text input that implements required
    return (
        <div className={`${className} rich-select`}>
            <ReactSelect
                {...props}
                options={sortedOptions}
                value={selectedOption}
                onChange={handleSelectChange}
                ref={selectRef}
                isDisabled={disabled}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
            />
            <input
                tabIndex={-1}
                autoComplete="off"
                style={{
                    opacity: 0,
                    width: "100%",
                    height: 0,
                    position: "absolute"
                }}
                value={state}
                onChange={noop}
                // When the text input is focussed as part of the required validation,
                // pass the focus onto the select
                onFocus={() => selectRef.current.focus()}
                required={required}
                disabled={disabled}
            />
        </div>
    );
};
