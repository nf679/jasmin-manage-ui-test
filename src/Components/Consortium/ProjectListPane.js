import React from 'react';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import { LinkContainer } from 'react-router-bootstrap';

import {
    Status,
    useNestedResource,
    useEnsureInitialised
} from '../../rest-resource';

import { useResources, useServices } from '../../api';

import { SpinnerWithText, formatAmount, sortByKey } from '../utils';


import '../../css/quota-card.css';

const getResourceAmmount = (service, resource_id) => {
    const requirements = useNestedResource(service, "requirements");
    //useEnsureInitialised(requirements)
    let i = 0;
    let quant = 0
    while (i < Object.values(requirements.data).length) {
        if (Object.values(requirements.data)[i].data.resource == resource_id) {
            quant += Object.values(requirements.data)[i].data.ammount
            console.log('update on quant:', quant)
        }
        i++
    }
    return (quant)
}

const getResourceAmount = (allServices, projServices, resources, resource_sname) => {
    var quant = 0;
    //const { isLoading } = useSelector(state => state.tableReducer);
    let j = 0;
    //console.log(j);
    var resource_id = null;
    //console.log('in get resource, services:', services);
    //console.log('in resource amount resources:', resources.data)
    // Get the current resource id
    while (j < Object.values(resources.data).length) {
        //console.log('j in loop', j)
        if (Object.values(resources.data)[j].data.short_name == resource_sname) {
            resource_id = Object.values(resources.data)[j].data.id
        }
        j++
    }
    console.log('resource_id:', resource_id)
    console.log('all services: ', allServices)
    // loop through the services to get the resource amount
    let si = 0;
    while (si < Object.values(projServices.data).length) {
        //let resource_ammount = getResourceAmmount(Object.values(services.data)[si], resource_id);
        let service_id = Object.values(projServices.data)[si].id;
        
        let i = 0;
        while (i < Object.values(allServices.data).length) {
            if (Object.values(allServices.data)[i].id == service_id) {
                console.log("single service", Object.values(allServices.data)[i])
                var reqs = Object.values(allServices.data)[i].data.requirements;
                console.log('reqs: ', reqs)
                let ri = 0;
                while (ri < reqs.length) {
                    console.log('single req: ', reqs[ri])
                    if (reqs[ri].resource.id == resource_id) {
                        quant += reqs[ri].amount
                    }
                    ri++
                }
            }
            i++
        }
        // quant += resource_ammount
        si++
    }
    // if (isLoading) {
    //     return <>Loading</>
    // }
    return (quant)
}

const ProjectList = ({ project }) => {
    const numServices = project.data.num_services || 0;
    const numRequirements = project.data.num_requirements || 0;
    const resources = useResources();
    const allServices = useServices();
    const projServices = useNestedResource(project, "services");
    console.log("Project working on: ", project.data.name)
    console.log("in projects list", projServices)
    console.log("allservices: ", allServices)
    const resourceNames = Object.values(resources.data).map((resource) => resource.data.short_name);
    var resourceAmounts = {}


    let i = 0;
    while (i < resourceNames.length) {
        resourceAmounts[resourceNames[i]] = getResourceAmount(allServices, projServices, resources, resourceNames[i])
        i++
    };
    console.log("resourceAmounts: ", resourceAmounts)
    console.log()

    const tags = useNestedResource(project, "tags")
    var tagkeys = tags.data
    return (
        <Status.Many fetchables={[allServices, projServices, resources]}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">Loading data...</SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Status.Throw />
            </Status.Unavailable>
            <Status.Available>
                <td>{project.data.name}</td>
                <td>{Object.keys(tagkeys).map((d) => (
                    <div>{tagkeys[d].data.name}</div>
                ))}</td>
                <td>{numServices}</td>
                <td>{numRequirements}</td>
                {Object.keys(resourceAmounts).map((d) => (
                    <td>{resourceAmounts[d]}</td>
                ))}
            </Status.Available>
        </Status.Many>

    );
};


const ListPane = ({ projects }) => {
    // Wait for the projects to load
    const resources = useResources();
    const testre = ['sof', 'pfs'];
    // exmaple map {testre.map(re => <th>{re}</th>)}


    return (
        <Status.Many fetchables={[projects, resources]}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">Loading projects...</SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Status.Throw />
            </Status.Unavailable>
            <Status.Available>
                {([projectData, resourceData]) => {
                    // Sort the projects  by name
                    const sortedProjects = sortByKey(
                        Object.values(projectData),
                        project => [
                            project.data.name
                        ]
                    );
                    const sortedResources = sortByKey(Object.values(resourceData),
                        resource => [resource.data.shortname]);
                    return (
                        <Col >
                            <Table hover striped size="sm">
                                <thead> <th>Project</th> <th>Tags</th><th>Services</th> <th>Requirements</th>
                                    {sortedResources.map(resource =>
                                        <th>{resource.data.short_name}</th>
                                    )}

                                </thead>
                                <tbody>
                                    {sortedProjects.map(project => (
                                        <LinkContainer to={{
                                            pathname: `/projects/${project.data.id}`,
                                            state: { initialData: project.data }
                                        }}>
                                            <tr key={project.data.name}>
                                                <ProjectList project={project} />
                                            </tr>
                                        </LinkContainer>
                                    ))}
                                </tbody>
                            </Table>
                        </Col>
                    );
                }}
            </Status.Available>
        </Status.Many>
    );
};


export default ListPane;
