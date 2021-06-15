import React from 'react';

import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Table from 'react-bootstrap/Table';

import { useResources } from '../../api';

import { formatAmount, sortByKey } from '../utils';

import { StatusIcon } from './StatusIcon';
import { RequirementEditButton } from './RequirementEditButton';
import { RequirementDeleteButton } from './RequirementDeleteButton';
import { RequirementApproveButton } from './RequirementApproveButton';

import { useProjectPermissions } from './actions';

import '../../css/requirements-table.css';


const statusOrdering = [
    'REQUESTED',
    'REJECTED',
    'APPROVED',
    'AWAITING_PROVISIONING',
    'PROVISIONED',
    'DECOMMISSIONED'
];


const RequirementRow = ({ project, service, requirement }) => {
    const resources = useResources();
    const resource = resources.data[requirement.data.resource];

    const { canEditRequirements, canApproveRequirements } = useProjectPermissions(project);

    const requirementStatusIndex = statusOrdering.indexOf(requirement.data.status);

    // If we know that no requirements can ever have a controls column, hide it
    const showControlsColumn = canEditRequirements || canApproveRequirements;

    // The requirement can only be edited when it is earlier than approved in its lifecycle
    const canEditRequirement = (
        canEditRequirements &&
        requirementStatusIndex < statusOrdering.indexOf('APPROVED')
    );

    // The requirement can only be approved or rejected when it is earlier than awaiting
    // provisioning in its lifecycle
    const canApproveRequirement = (
        canApproveRequirements &&
        requirementStatusIndex < statusOrdering.indexOf('AWAITING_PROVISIONING')
    );

    return (<>
        <tr className={`status-${requirement.data.status.replace("_", "-").toLowerCase()}`}>
            <td>
                <StatusIcon status={requirement.data.status} className="fa-fw" />
            </td>
            <td>{resource.data.short_name || resource.data.name}</td>
            <td>
                {formatAmount(requirement.data.amount, resource.data.units)}
            </td>
            <td>{requirement.data.status.replace("_", " ")}</td>
            <td>{requirement.data.start_date}</td>
            <td>{requirement.data.end_date}</td>
            {showControlsColumn && (
                <td>
                    {canEditRequirement && (
                        <ButtonGroup size="sm">
                            <RequirementEditButton
                                project={project}
                                service={service}
                                requirement={requirement}
                            />
                            <RequirementDeleteButton
                                project={project}
                                service={service}
                                requirement={requirement}
                            />
                        </ButtonGroup>
                    )}
                    {canApproveRequirement && (
                        <RequirementApproveButton
                            project={project}
                            service={service}
                            requirement={requirement}
                        />
                    )}
                </td>
            )}            
            <td>{requirement.data.location}</td>
        </tr>
    </>);
};


export const RequirementsTable = ({ project, service, requirements }) => {
    const resources = useResources();

    // If there are not going to be any action buttons for any requirements, then we can
    // avoid rendering the empty column completely
    const { canEditRequirements, canApproveRequirements } = useProjectPermissions(project);
    const showControlsColumn = canEditRequirements || canApproveRequirements;

    const sortedRequirements = sortByKey(
        Object.values(requirements.data),
        // Sort requirements by status first, then resource short name
        // This makes sure that the requirements that require action are closest to the top
        requirement => {
            const resource = resources.data[requirement.data.resource];
            const resourceName = resource.data.short_name || resource.data.name;
            return [statusOrdering.indexOf(requirement.data.status), resourceName];
        }
    );
    return (
        <Table className="requirements-table mb-0" size="sm" responsive>
            <thead>
                <tr>
                    <th></th>
                    <th>Resource</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>From</th>
                    <th>Until</th>
                    {showControlsColumn && <th></th>}
                    <th>Location</th>                
                </tr>
            </thead>
            <tbody>
                {sortedRequirements.map(requirement => (
                    <RequirementRow
                        key={requirement.data.id}
                        project={project}
                        service={service}
                        requirement={requirement}
                    />
                ))}
                {sortedRequirements.length === 0 && (
                    <tr>
                        <td
                            colSpan={showControlsColumn ? 7 : 6}
                            className="text-muted text-center py-2"
                        >
                            No requirements.
                        </td>
                    </tr>
                )}
            </tbody>
        </Table>
    );
};
