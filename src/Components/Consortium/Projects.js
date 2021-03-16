import React, { useState } from 'react';

import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';

import classNames from 'classnames';

import { Status, useNestedResource } from '../../rest-resource';

import { useResources } from '../../api';

import { SpinnerWithText, formatAmount, sortByKey } from '../utils';

import '../../css/quota-card.css';


const QuotaCard = ({ quota, resource }) => {
    // Store some state to determine which progress bar/table row should be highlighted
    // Can be null, "approved", "awaiting" or "provisioned"
    const [highlightedAmount, setHighlightedAmount] = useState(null);
    const { name: resourceName, units } = resource.data;
    const {
        amount,
        total_approved: totalApproved,
        total_awaiting_provisioning: totalAwaiting,
        total_provisioned: totalProvisioned
    } = quota.data;
    const totalCommitted = totalApproved + totalAwaiting + totalProvisioned;
    // If the total committed is more than the quota amount, we will show that
    // by placing a line across the bar where the quota amount is
    const progressBarMax = Math.max(amount, totalCommitted);
    // Calculate the allocated percentage
    const committedPercentage = Math.round((totalCommitted / amount) * 100);
    return (
        <Card className="mb-3 quota-card" style={{ borderWidth: '3px' }}>
            <Card.Header>
                <h5 className="mb-0">{resourceName}</h5>
            </Card.Header>
            <Card.Body>
                <Card.Title className="text-center">
                    {formatAmount(totalCommitted, units)}{" "}
                    of{" "}
                    {formatAmount(amount, units)}{" "}
                    ({committedPercentage}%)
                </Card.Title>
                <ProgressBar className="position-relative">
                    <ProgressBar
                        variant="info"
                        max={progressBarMax}
                        now={totalProvisioned}
                        className={classNames({
                            'inactive': highlightedAmount,
                            'active': highlightedAmount === "provisioned"
                        })}
                        onMouseEnter={() => setHighlightedAmount("provisioned")}
                        onMouseLeave={() => setHighlightedAmount(null)}
                    />
                    <ProgressBar
                        variant="warning"
                        max={progressBarMax}
                        now={totalAwaiting}
                        className={classNames({
                            'inactive': highlightedAmount,
                            'active': highlightedAmount === "awaiting"
                        })}
                        onMouseEnter={() => setHighlightedAmount("awaiting")}
                        onMouseLeave={() => setHighlightedAmount(null)}
                    />
                    <ProgressBar
                        variant="success"
                        max={progressBarMax}
                        now={totalApproved}
                        className={classNames({
                            'inactive': highlightedAmount,
                            'active': highlightedAmount === "approved"
                        })}
                        onMouseEnter={() => setHighlightedAmount("approved")}
                        onMouseLeave={() => setHighlightedAmount(null)}
                    />
                    {progressBarMax > amount && (
                        <div
                            style={{
                                position: 'absolute',
                                width: '3px',
                                height: '100%',
                                backgroundColor: 'red',
                                zIndex: 1000,
                                top: 0,
                                left: `${(amount / progressBarMax) * 100}%`
                            }}
                        />
                    )}
                </ProgressBar>
            </Card.Body>
            <Table>
                <tbody>
                    <tr>
                        <th>Quota amount</th>
                        <td>{formatAmount(amount, units)}</td>
                    </tr>
                    <tr
                        className={classNames({
                            'table-active': highlightedAmount === "provisioned"
                        })}
                        onMouseEnter={() => setHighlightedAmount("provisioned")}
                        onMouseLeave={() => setHighlightedAmount(null)}
                    >
                        <th>Total Provisioned</th>
                        <td>{formatAmount(totalProvisioned, units)}</td>
                    </tr>
                    <tr
                        className={classNames({
                            'table-active': highlightedAmount === "awaiting"
                        })}
                        onMouseEnter={() => setHighlightedAmount("awaiting")}
                        onMouseLeave={() => setHighlightedAmount(null)}
                    >
                        <th>Total Awaiting Provisioning</th>
                        <td>{formatAmount(totalAwaiting, units)}</td>
                    </tr>
                    <tr
                        className={classNames({
                            'table-active': highlightedAmount === "approved"
                        })}
                        onMouseEnter={() => setHighlightedAmount("approved")}
                        onMouseLeave={() => setHighlightedAmount(null)}
                    >
                        <th>Total Approved</th>
                        <td>{formatAmount(totalApproved, units)}</td>
                    </tr>
                </tbody>
            </Table>
        </Card>
    );
};


const OverviewPane = ({ consortium }) => {
    // To render the overview, we need the quotas and the resources
    const quotas = useNestedResource(consortium, "quotas");
    const resources = useResources();
    return (
        <Status.Many fetchables={[quotas, resources]}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText>Loading quotas...</SpinnerWithText>
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
                        <Row xs={1} lg={2}>
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
