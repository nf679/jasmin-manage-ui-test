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
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';

import classNames from 'classnames';

import { useNotifications } from 'react-bootstrap-notify';

import { PageHeader } from 'fwtheme-react-jasmin';

import { Status, useNestedResource} from '../../rest-resource';

import { useRequirement, 
  		 useService,
  		 useProject, 
  		 useCategory,
  		 useResources
} from '../../api';

import {
    useStateFromLocation,
    SpinnerWithText,
    notificationFromError,
    sortByKey
} from '../utils';


const RequirementTable = ({ requirement }) => {
 	// initialise the service
    // Get any initial data specified in the location state
    resources = useResources();
    const { initialData } = useStateFromLocation();
    const resourceID = requirement.data.resource;
	const resource = useResources.data[requirement.data.resource];
	return (
		<Table>
		<tbody>
		<td>{ requirement.data.status }</td>
		<td>{ resource.data.name } ({ resource.data.short_name })</td>
		<td>{ requirement.data.amount } { resource.data.units }</td>
		
		<td>See email</td>
		</tbody>
		</Table>
    )
};

const RequirementDetail = ({service, project, category}) => {
    const collaborators = useNestedResource(project, "collaborators");
    const requirements = useNestedResource(service, "requirements");

    return (
    	<Status.Many fetchables={[ requirements, collaborators ]}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="lg">
                        Loading requirements, collaborators...
                    </SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Row> <Col> No matching project for service id {service.data.id}</Col> </Row>
                
            </Status.Unavailable>
            <Status.Available>
			    <PageHeader><h3>{ category.data.name } request for  { service.data.name }</h3>
			    </PageHeader>
			    <Row> <Col> Service Type: <strong>{category.data.name}</strong> </Col> </Row>
			    <Row> <Col> Service Name: <strong>{service.data.name}</strong> </Col> </Row>
			    
				    {data =>  {         
		                    const sortedRequirements = sortByKey(
		                        Object.values(data),
		                        requirement => [
		                            requirement.data.id
		                        ]
		                    );  
		                    
		                	return (
				                <RequirementTable requirement={requirement}/>
		                    );
		            }} 
            </Status.Available>
        </Status.Many>
    );
};



const RequirementProjectWrapper = ({ service }) => {
 	// initialise the service
    // Get any initial data specified in the location state
    const { initialData } = useStateFromLocation();
    // Get project for service
    const projectID = service.data.project;
	const project = useProject(projectID, { initialData });
	// Get category for service
	const categoryID = service.data.category;
	const category = useCategory(categoryID, { initialData });
	return (
        <Status.Many fetchables={[project, category]}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="lg">
                        Loading project, category...
                    </SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Row> <Col> No matching project, or category for service id {service.data.id}</Col> </Row>
                
            </Status.Unavailable>
            <Status.Available>
                <RequirementDetail service={service} project={project} category={category} />
            </Status.Available>
        </Status.Many>
    );
};


const RequirementDetailWrapper = () => {
    // at top level use service to produce the requirements for the given service

    // Get the project and requirement that was specified in the params
    const { id: serviceId } = useParams();
    // Get any initial data specified in the location state
    const { initialData } = useStateFromLocation();
    // Initialise the requirement
    const service = useService(serviceId, { initialData }); 
   
    return (
        <Status fetchable={service}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="lg">
                        Loading service...
                    </SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Row> <Col> No matching service for id {serviceId}</Col> </Row>
                
            </Status.Unavailable>
            <Status.Available>
                <RequirementProjectWrapper service={service} />
            </Status.Available>
        </Status>
    );
};


export default RequirementDetailWrapper