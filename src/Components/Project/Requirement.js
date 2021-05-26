import React, { useEffect, useState } from 'react';

import {
    Redirect,
    Route,
    Switch,
    useLocation,
    useParams,
    useRouteMatch
} from 'react-router-dom';

import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';

import { useNotifications } from 'react-bootstrap-notify';

import { PageHeader } from 'fwtheme-react-jasmin';

import { Status } from '../../rest-resource';

import { useRequirement, 
} from '../../api';

import {
    useStateFromLocation,
    SpinnerWithText,
    notificationFromError
} from '../utils';

const RequirementDetail = ({ requirement }) => {
    const { pathname } = useLocation();
    const { path, url } = useRouteMatch();   
	

    return (<>
    	<PageHeader> Request id: { requirement.data.id }</PageHeader>
    	
        
    </>);
};

const RequirementDetailWrapper = () => {
    const notify = useNotifications();

    // Get the project and requirement that was specified in the params
    const { id: requirementId } = useParams();
    // Get any initial data specified in the location state
    const { initialData } = useStateFromLocation();
    // Initialise the requirement
    const requirement = useRequirement(requirementId, { initialData });

    // If the project failed to load, notify the user
    useEffect(
        () => {
            if( requirement.fetchError ) {
                notify(notificationFromError(requirement.fetchError));
            }
        },
        [requirement.fetchError]
    );

    return (
        <Status fetchable={requirement}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="lg">
                        Loading requirement...
                    </SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <PageHeader> No matching requirement for id {requirementId} </PageHeader>
            </Status.Unavailable>
            <Status.Available>
                <RequirementDetail requirement={requirement} />
            </Status.Available>
        </Status>
    );
};


export default RequirementDetailWrapper