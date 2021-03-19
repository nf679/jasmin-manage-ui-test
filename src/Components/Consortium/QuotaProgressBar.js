import React, { useEffect, useRef, useState } from 'react';

import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Overlay from 'react-bootstrap/Overlay';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import Tooltip from 'react-bootstrap/Tooltip';

import classNames from 'classnames';

import { Status } from '../../rest-resource';

import { useResources } from '../../api';

import { SpinnerWithText, formatAmount, sortByKey } from '../utils';

import '../../css/quota-progress-bar.css';


const QuotaItemProgressBar = ({ status, now, units, ...props }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const target = useRef(null);
    return (<>
        <ProgressBar
            {...props}
            ref={target}
            now={now}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        />
        <Overlay target={target.current} show={showTooltip} placement="bottom">
            {props => (
                <Tooltip {...props}>
                    {status}: {formatAmount(now, units)}
                </Tooltip>
            )}
        </Overlay>
    </>);
};


const QuotaAmountIndicator = ({ max, now, units }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const target = useRef(null);
    return (<>
        <div
            ref={target}
            className="indicator-line"
            style={{ left: `${(now / max) * 100}%` }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        />
        <Overlay target={target.current} show={showTooltip} placement="bottom">
            {props => (
                <Tooltip {...props}>
                    Quota amount: {formatAmount(now, units)}
                </Tooltip>
            )}
        </Overlay>
    </>);
};


export const QuotaProgressBar = ({
    quota,
    resource,
    // If given, this requirement is shown alongside the quota amounts
    requirement,
    CaptionComponent
}) => {
    const units = resource.data.units;
    const quotaAmount = quota.data.amount;

    // Start with the totals from the quota
    let {
        total_approved: totalApproved,
        total_awaiting_provisioning: totalAwaiting,
        total_provisioned: totalProvisioned
    } = quota.data;
    let requirementAmount = 0;

    // Correct the amounts if we were given a requirement
    if( requirement ) {
        requirementAmount = requirement.data.amount;
        switch( requirement.data.status ) {
            case "APPROVED":
                totalApproved -= requirementAmount;
                break;
            case "AWAITING_PROVISIONING":
                totalAwaiting -= requirementAmount;
                break;
            case "PROVISIONED":
                totalProvisioned -= requirementAmount;
                break;
        }
    }

    // Work out the total commitments
    const totalCommitted = totalApproved + totalAwaiting + totalProvisioned;
    const totalWithRequirement = totalCommitted + requirementAmount;
    const committedPercentage = Math.round((totalCommitted / quotaAmount) * 100);
    // Calculate the remaining amount after the requirement is approved
    const remainingAmount = quotaAmount - totalWithRequirement;
    // Calculate the max for the progress bar
    const progressBarMax = Math.max(quotaAmount, totalWithRequirement);

    return (
        <div className="quota-progress-bar-container">
            <CaptionComponent className="text-center">
                {formatAmount(totalCommitted, units)}{" "}
                of{" "}
                {formatAmount(quotaAmount, units)}{" "}
                committed ({committedPercentage}%)
            </CaptionComponent>
            <div className="quota-progress-bar">
                <ProgressBar>
                    <QuotaItemProgressBar
                        status="Provisioned"
                        variant="info"
                        max={progressBarMax}
                        now={totalProvisioned}
                        units={units}
                    />
                    <QuotaItemProgressBar
                        status="Awaiting Provisioning"
                        variant="warning"
                        max={progressBarMax}
                        now={totalAwaiting}
                        units={units}
                    />
                    <QuotaItemProgressBar
                        status="Approved"
                        variant="success"
                        max={progressBarMax}
                        now={totalApproved}
                        units={units}
                    />
                    {requirementAmount > 0 && (
                        <QuotaItemProgressBar
                            status="This requirement"
                            variant="secondary"
                            max={progressBarMax}
                            now={requirementAmount}
                            units={units}
                        />
                    )}
                    {/* If there is still headroom in the quota, but in a bar for it */}
                    {remainingAmount > 0 && (
                        <QuotaItemProgressBar
                            status="Remaining"
                            variant="transparent"
                            max={progressBarMax}
                            now={remainingAmount}
                            units={units}
                        />
                    )}
                </ProgressBar>
                {/* If the progress bar goes beyond the quota, show a marker at the quota */}
                {progressBarMax > quotaAmount && (
                    <QuotaAmountIndicator
                        max={progressBarMax}
                        now={quotaAmount}
                        units={units}
                    />
                )}
            </div>
        </div>
    );
};
