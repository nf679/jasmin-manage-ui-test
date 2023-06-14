import React, { useState } from 'react';

import classNames from 'classnames';


const statusIcons = {
    'REQUESTED': 'fas fa-paper-plane',
    'REJECTED': 'fas fa-ban',
    'APPROVED': 'fas fa-check',
    'AWAITING_PROVISIONING': 'fas fa-hourglass-half',
    'PROVISIONED': 'fas fa-layer-group',
    'DECOMMISSIONED': 'fas fa-power-off'
};


export const StatusIcon = ({ status, className, ...props }) => {
    const statusIcon = statusIcons[status];
    const [hover, setHover] = useState(false);
    const onHover = () => {
        setHover(true);
    };
    const onLeave = () => {
        setHover(false);
    };
    return statusIcon ?
        <div onMouseEnter={onHover} onMouseLeave={onLeave}>
            {hover ? status: <i {...props} className={classNames(statusIcon, className)} /> }
        </div>:
        null;
};


const statusTextClassNames = {
    REJECTED: 'text-danger',
    APPROVED: 'text-success',
    AWAITING_PROVISIONING: 'text-warning',
    PROVISIONED: 'text-info',
    DECOMMISSIONED: 'text-muted'
};


export const StatusIconWithText = ({ status, className, ...props }) => (
    <strong {...props} className={classNames(statusTextClassNames[status], className)}>
        <StatusIcon status={status} className="mr-2" />
        {status}
    </strong>
);
