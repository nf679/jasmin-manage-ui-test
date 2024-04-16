import React from 'react';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import { useHistory, useLocation } from 'react-router-dom';

import { LinkContainer } from 'react-router-bootstrap';

import {
    Status,
    useNestedResource,
    useEnsureInitialised
} from '../../rest-resource';

import { useConsortiumSummary, useResources, useServices } from '../../api';

import { SpinnerWithText, formatAmount, sortByKey } from '../utils';

import '../../css/quota-card.css';


const SummaryPane = ({ conSummary }) => {
    // If there's an error, push to the main consortia page
    const history = useHistory();
    const location = useLocation();
    const handleError = error => history.push(location.pathname.replace('/summary', ''));
    // Try and catch when the context isn't loaded and redirect
    // try {
    //     const data = conSummary.data;
    // }
    // catch (error) {
    //     handleError();
    // }
    const resources = useResources();
    useEnsureInitialised(resources);
    // Create a sorted list for the headers in the table
    var resheaders = [];
    var i = 0;
    while (i < Object.values(resources.data).length) {
        resheaders = [...resheaders, Object.values(resources.data)[i].data.name];
        i++
    }
    const sortedHeaders = resheaders.sort();

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
                <>
                    <Col>
                        <Table striped size='sm'>
                            <thead>
                                <tr>
                                    <th>Project</th>
                                    <th>Tags</th>
                                    <th>Collaborators</th>
                                    {sortedHeaders.map(res => (<th>{res}</th>))
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(conSummary.data.project_summaries).map(project => (
                                    <tr>
                                        <td>{project.project_name}</td>
                                        <td>{Object.values(project.tags).map(tag => (<Row>{tag}</Row>))}</td>
                                        <td>{Object.values(project.collaborators).map(collab => (<Row>{collab.username}</Row>))}</td>
                                        {Object.values(project.resource_summary).map(res => (<td>{res}</td>))}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Col>
                </>
            </Status.Available>
        </Status.Many>);
};


export default SummaryPane;
