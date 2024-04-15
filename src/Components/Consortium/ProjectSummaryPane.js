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

import { useConsortiumSummary, useResources, useServices } from '../../api';

import { SpinnerWithText, formatAmount, sortByKey } from '../utils';


import '../../css/quota-card.css';



// const getResourceAmount = (allServices, projServices, resources, resource_sname) => {
//     var quant = 0;
//     //const { isLoading } = useSelector(state => state.tableReducer);
//     let j = 0;
//     //console.log(j);
//     var resource_id = null;
//     //console.log('in get resource, services:', services);
//     //console.log('in resource amount resources:', resources.data)
//     // Get the current resource id
//     while (j < Object.values(resources.data).length) {
//         //console.log('j in loop', j)
//         if (Object.values(resources.data)[j].data.short_name == resource_sname) {
//             resource_id = Object.values(resources.data)[j].data.id
//         }
//         j++
//     }
//     console.log('resource_id:', resource_id)
//     console.log('all services: ', allServices)
//     // loop through the services to get the resource amount
//     let si = 0;
//     while (si < Object.values(projServices.data).length) {
//         //let resource_ammount = getResourceAmmount(Object.values(services.data)[si], resource_id);
//         let service_id = Object.values(projServices.data)[si].id;

//         let i = 0;
//         while (i < Object.values(allServices.data).length) {
//             if (Object.values(allServices.data)[i].id == service_id) {
//                 console.log("single service", Object.values(allServices.data)[i])
//                 var reqs = Object.values(allServices.data)[i].data.requirements;
//                 console.log('reqs: ', reqs)
//                 let ri = 0;
//                 while (ri < reqs.length) {
//                     console.log('single req: ', reqs[ri])
//                     if (reqs[ri].resource.id == resource_id) {
//                         quant += reqs[ri].amount
//                     }
//                     ri++
//                 }
//             }
//             i++
//         }
//         // quant += resource_ammount
//         si++
//     }
//     // if (isLoading) {
//     //     return <>Loading</>
//     // }
//     return (quant)
// }

// const getAmount = (resourceName, conSummary) => {
//     // Get the resource dict out
//     console.log(conSummary)
//     const resources = Object.values(conSummary.data.resources)
//     // Loop through the resources and return the matching ammount
//     var amount = 0;
//     while (i < Object.values(resources).length) {
//         if (resources[i].resource == resourceName) {
//             amount = resources[i].amount
//         }
//         i++;
//     }
//     return (amount)
// }


// const ProjectList = ({ consortium }) => {
//     console.log(consortium)
//     const conSummary = useNestedResource(consortium, "summary");
//     const resourceNames = Object.values(resources.data).map((resource) => resource.data.name);

//     console.log(conSummary)

//     var tagkeys = tags.data
//     return (
//         <Status fetchable={conSummary}>
//             <Status.Loading>
//                 <div className="d-flex justify-content-center my-5">
//                     <SpinnerWithText iconSize="lg" textSize="120%">Loading data...</SpinnerWithText>
//                 </div>
//             </Status.Loading>
//             <Status.Unavailable>
//                 <Status.Throw />
//             </Status.Unavailable>
//             <Status.Available>

//             </Status.Available>
//         </Status>

//     );
// };
{/* <td>{project.data.name}</td>
                <td>{Object.keys(tagkeys).map((d) => (
                    <div>{tagkeys[d].data.name}</div>
                ))}</td>
                <td>{numServices}</td>
                <td>{numRequirements}</td>
                {Object.keys(resourceAmounts).map((d) => (
                    <td>{resourceAmounts[d]}</td>
                ))} */}

const SummaryPane = ({ conSummary }) => {
    console.log('con', conSummary);
    useEnsureInitialised(conSummary);
    const data = conSummary.data;
    console.log('condata', data.project_summaries);
    const resources = useResources();


    return (
        <Status.Many fetchables={[conSummary, resources]}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">Loading data...</SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Status.Throw />
            </Status.Unavailable>
            <Status.Available>
                <></>
                {/* {data => {
                    // Sort the projects by status, with UNDER_REVIEW projects first, then by name
                    const sortedProjects = sortByKey(
                        Object.values(data),
                        project => [
                            project.data.name
                        ]
                    );
                    return (
                        <Row xs={1} sm={2} lg={3} className="row-cols-xxl-4">
                            {sortedProjects.map(project => (
                                <Col key={project.data.id}>
                                    <ProjectCard project={project} />
                                </Col>
                            ))}
                        </Row>
                    );
                }} */}
                <>
                    <Col>
                        <Table striped size='sm'>
                            <thead>
                                <th>Project</th>
                                <th>Tags</th>
                                <th>Collaborators</th>
                                {Object.values(resources.data).map}
                                <th>Resource</th>
                                <th>Usage</th>
                            </thead>
                            <tbody>
                                {Object.values(conSummary.data.project_summaries).map(project => (
                                    <tr>
                                        <td>{project.project_name}</td>
                                        <td>{Object.values(project.tags).map(tag => (<Row>{tag}</Row>))}</td>
                                        <td>{Object.values(project.collaborators).map(collab => (<Row>{collab.username}</Row>))}</td>
                                        <td><Col>{Object.keys(project.resource_summary).map(res => (<Row>{res}</Row>))}</Col></td>
                                        <td><Col>{Object.values(project.resource_summary).map(val => (<Row>{val}</Row>))}</Col></td>
                                    </tr>
                                ))}

                            </tbody>
                        </Table>
                    </Col>


                </>


            </Status.Available>
        </Status.Many>);
};


// const ListPane = ({ projects }) => {
//     // Wait for the projects to load
//     const resources = useResources();
//     const testre = ['sof', 'pfs'];
//     // exmaple map {testre.map(re => <th>{re}</th>)}


//     return (
//         <Status.Many fetchables={[projects, resources]}>
//             <Status.Loading>
//                 <div className="d-flex justify-content-center my-5">
//                     <SpinnerWithText iconSize="lg" textSize="120%">Loading projects...</SpinnerWithText>
//                 </div>
//             </Status.Loading>
//             <Status.Unavailable>
//                 <Status.Throw />
//             </Status.Unavailable>
//             <Status.Available>
//                 {([projectData, resourceData]) => {
//                     // Sort the projects  by name
//                     const sortedProjects = sortByKey(
//                         Object.values(projectData),
//                         project => [
//                             project.data.name
//                         ]
//                     );
//                     const sortedResources = sortByKey(Object.values(resourceData),
//                         resource => [resource.data.shortname]);
//                     return (
//                         <Col >
//                             <Table hover striped size="sm">
//                                 <thead> <th>Project</th> <th>Tags</th><th>Services</th> <th>Requirements</th>
//                                     {sortedResources.map(resource =>
//                                         <th>{resource.data.short_name}</th>
//                                     )}

//                                 </thead>
//                                 <tbody>
//                                     {sortedProjects.map(project => (
//                                         <LinkContainer to={{
//                                             pathname: `/projects/${project.data.id}`,
//                                             state: { initialData: project.data }
//                                         }}>
//                                             <tr key={project.data.name}>
//                                                 <ProjectList project={project} />
//                                             </tr>
//                                         </LinkContainer>
//                                     ))}
//                                 </tbody>
//                             </Table>
//                         </Col>
//                     );
//                 }}
//             </Status.Available>
//         </Status.Many>
//     );
// };


export default SummaryPane;
