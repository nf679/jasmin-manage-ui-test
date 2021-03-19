import React from 'react';

import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';

import classNames from 'classnames';

import { Status } from '../../rest-resource';

import { useResources } from '../../api';

import { SpinnerWithText, formatAmount, sortByKey } from '../utils';

import { QuotaProgressBar } from './QuotaProgressBar';

import '../../css/quota-card.css';


const QuotaCard = ({ quota, resource }) => {
    const { name: resourceName, units } = resource.data;
    const {
        amount,
        total_approved: totalApproved,
        total_awaiting_provisioning: totalAwaiting,
        total_provisioned: totalProvisioned
    } = quota.data;
    const totalCommitted = totalApproved + totalAwaiting + totalProvisioned;
    // Calculate the allocated percentage
    const committedPercentage = Math.round((totalCommitted / amount) * 100);
    return (
        <Card
            className={classNames(
                "mb-3",
                "quota-card",
                { "border-danger": committedPercentage >= 90 },
                {
                    "border-warning": (
                        committedPercentage >= 70 &&
                        committedPercentage < 90
                    )
                }
            )}
            style={{ borderWidth: '3px' }}
        >
            <Card.Header>
                <h5 className="mb-0">{resourceName}</h5>
            </Card.Header>
            <Card.Body>
                <QuotaProgressBar
                    quota={quota}
                    resource={resource}
                    CaptionComponent={Card.Title}
                />
            </Card.Body>
            <Table>
                <tbody>
                    <tr>
                        <th>Quota amount</th>
                        <td>{formatAmount(amount, units)}</td>
                    </tr>
                    <tr>
                        <th>Total Provisioned</th>
                        <td>{formatAmount(totalProvisioned, units)}</td>
                    </tr>
                    <tr>
                        <th>Total Awaiting Provisioning</th>
                        <td>{formatAmount(totalAwaiting, units)}</td>
                    </tr>
                    <tr>
                        <th>Total Approved</th>
                        <td>{formatAmount(totalApproved, units)}</td>
                    </tr>
                </tbody>
            </Table>
        </Card>
    );
};


const OverviewPane = ({ quotas }) => {
    // To render the overview, we also need the resources
    const resources = useResources();
    return (
        <Status.Many fetchables={[quotas, resources]}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">Loading quotas...</SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Status.Throw />
            </Status.Unavailable>
            <Status.Available>
                {([quotaData, resourceData]) => {
                    // Sort the quotas by resource name
                    const sortedQuotas = sortByKey(
                        Object.values(quotaData),
                        quota => resourceData[quota.data.resource].data.name
                    );
                    return (
                        <Row xs={1} md={2} xl={3} className="row-cols-xxl-4">
                            {sortedQuotas.map(quota => (
                                <Col key={quota.data.id}>
                                    <QuotaCard
                                        quota={quota}
                                        resource={resourceData[quota.data.resource]}
                                    />
                                </Col>
                            ))}
                        </Row>
                    );
                }}
            </Status.Available>
        </Status.Many>
    );
};


export default OverviewPane;
