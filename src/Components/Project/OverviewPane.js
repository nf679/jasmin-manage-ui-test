import React from 'react';

import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';

import classNames from 'classnames';

import moment from 'moment';

import ReactMarkdown from 'react-markdown';

import { Status, useNestedResource, useFetchPoint } from '../../rest-resource';

import { useResources } from '../../api';

import { formatAmount, sortByKey } from '../utils';

import '../../css/project-detail.css';


const TimelineItem = ({ children }) => (
    <div className="timeline-item">
        <div className="timeline-item-container">
            <div className="timeline-item-content">
                {children}
            </div>
        </div>
    </div>
);


const ProjectDescription = ({ project }) => (
    <Card>
        <Card.Header><strong>Project description</strong></Card.Header>
        <Card.Body className="markdown">
            <ReactMarkdown children={project.data.description} />
        </Card.Body>
    </Card>
);


const Comment = ({ project, item }) => {
    const displayName = item.data.user.last_name ?
        `${item.data.user.first_name} ${item.data.user.last_name}` :
        item.data.user.username;
    const createdAt = moment(item.data.created_at).format('D MMMM');
    return (
        <Card className="comment">
            <Card.Header>
                <strong>{displayName}</strong> <em>commented on {createdAt}</em>
            </Card.Header>
            <Card.Body className="markdown">
                <ReactMarkdown children={item.data.content} />
            </Card.Body>
        </Card>
    );
};


const EventIcon = ({ icon, variant }) => {
    const variantClassName = !!variant ? `text-${variant}` : undefined;
    return (
        <span className={classNames("event-icon", "fa-stack", variantClassName)}>
            <i className="fas fa-circle fa-stack-2x" />
            <i className={classNames("fas", "fa-stack-1x", "fa-inverse", icon)} />
        </span>
    );
};


const EventText = props => <span className="event-text" {...props} />;


const ProjectEvent = ({ children, item, className }) => {
    const createdBy = item.user.last_name ?
        `${item.user.first_name} ${item.user.last_name}` :
        item.user.username;
    const createdAt = moment(item.created_at).format('D MMMM');
    return (
        <div className={classNames("event", className)}>
            {children(createdBy, createdAt)}
        </div>
    );
};


const ResourceEvent = ({ children, item, ...props }) => {
    const resources = useResources();
    return (
        <Status fetchable={resources}>
            <Status.Loading>
                <div className="event text-muted">
                    <EventIcon icon="fa-sync-alt fa-spin" />
                    <EventText>Loading resources...</EventText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <div className="event text-danger font-weight-bold">
                    <EventIcon icon="fa-bomb" />
                    <EventText>Unable to load resources</EventText>
                </div>
            </Status.Unavailable>
            <Status.Available>
                {resourceData => {
                    const resource = resourceData[item.target.resource];
                    const amount = formatAmount(item.target.amount, resource.data.units);
                    // Render each item with the specified renderer
                    return (
                        <ProjectEvent item={item} {...props}>
                            {(createdBy, createdAt) => children(
                                amount,
                                resource.data.name,
                                createdBy,
                                createdAt
                            )}
                        </ProjectEvent>
                    );
                }}
            </Status.Available>
        </Status>
    );
};


// Map of timeline events to a component
const TimelineEvents = {
    'jasmin_manage.project.created': ({ item }) => (
        <ProjectEvent item={item}>
            {(createdBy, createdAt) => (<>
                <EventIcon icon="fa-plus" variant="info" />
                <EventText>
                    Project <strong>created</strong>{" "}
                    on {createdAt}{" "}
                    by <strong>{createdBy}</strong>
                </EventText>
            </>)}
        </ProjectEvent>
    ),
    'jasmin_manage.project.submitted_for_review': ({ item }) => (
        <ProjectEvent item={item}>
            {(createdBy, createdAt) => (<>
                <EventIcon icon="fa-question" variant="primary" />
                <EventText>
                    Project <strong>submitted for review</strong>{" "}
                    on {createdAt}{" "}
                    by <strong>{createdBy}</strong>
                </EventText>
            </>)}
        </ProjectEvent>
    ),
    'jasmin_manage.project.changes_requested': ({ item }) => (
        <ProjectEvent item={item}>
            {(createdBy, createdAt) => (<>
                <EventIcon icon="fa-exclamation" variant="danger" />
                <EventText>
                    <strong>Changes requested</strong>{" "}
                    on {createdAt}{" "}
                    by <strong>{createdBy}</strong>
                </EventText>
            </>)}
        </ProjectEvent>
    ),
    'jasmin_manage.project.submitted_for_provisioning': ({ item }) => (
        <ProjectEvent item={item}>
            {(createdBy, createdAt) => (<>
                <EventIcon icon="fa-check" variant="success" />
                <EventText>
                    Project <strong>submitted for provisioning</strong>{" "}
                    on {createdAt}{" "}
                    by <strong>{createdBy}</strong>
                </EventText>
            </>)}
        </ProjectEvent>
    ),
    'jasmin_manage.requirement.provisioned': ({ item }) => (
        <ResourceEvent item={item}>
             {(amount, resourceName, createdBy, createdAt) => (<>
                <EventIcon icon="fa-layer-group" variant="secondary" />
                <EventText>
                    <strong>{amount} {resourceName} provisioned</strong>{" "}
                    on {createdAt}
                </EventText>
            </>)}
        </ResourceEvent>
    ),
    'jasmin_manage.requirement.decommissioned': ({ item }) => (
        <ResourceEvent item={item} className="text-muted">
             {(amount, resourceName, createdBy, createdAt) => (<>
                <EventIcon icon="fa-power-off" />
                <EventText>
                    <strong>{amount} {resourceName} decommissioned</strong>{" "}
                    on {createdAt}
                </EventText>
            </>)}
        </ResourceEvent>
    ),
};


const getTimelineData = (commentData, eventData) => {
    const timelineData = [
        // Start with the comment data
        ...Object.values(commentData).map(comment => ({
            id: `comment-${comment.data.id}`,
            data: comment,
            component: Comment,
            createdAt: comment.data.created_at
        })),
        // Add the event data, but only those with a renderer
        ...eventData
            .filter(event => TimelineEvents.hasOwnProperty(event.event_type))
            .map(event => ({
                id: `event-${event.id}`,
                data: event,
                component: TimelineEvents[event.event_type],
                createdAt: event.created_at
            }))
    ];
    // Return the data sorted by createdAt
    return sortByKey(timelineData, item => item.createdAt, true);
};


const ProjectTimeline = ({ project, events }) => {
    const comments = useNestedResource(project, "comments");
    // This is the fetch point for the events
    useFetchPoint(events);
    return (<>
        {/* If either the comments or events are loading, include an item at the top */}
        {(comments.fetching || events.fetching ) && (
            <TimelineItem>
                <div className="event text-muted">
                    <EventIcon icon="fa-sync-alt fa-spin" />
                    <EventText>Loading timeline items...</EventText>
                </div>
            </TimelineItem>
        )}
        <Status.Many fetchables={[comments, events]}>
            {/* No loading section as this is covered by the item above */}
            <Status.Unavailable>
                <TimelineItem>
                    <div className="event text-danger font-weight-bold">
                        <EventIcon icon="fa-bomb" />
                        <EventText>Error loading timeline data</EventText>
                    </div>
                </TimelineItem>
            </Status.Unavailable>
            <Status.Available>
                {([commentData, eventData]) => (
                    // Render each timeline item with the specified component
                    getTimelineData(commentData, eventData).map(item => (
                        <TimelineItem key={item.id}>
                            <item.component project={project} item={item.data} />
                        </TimelineItem>
                    ))
                )}
            </Status.Available>
        </Status.Many>
    </>);
};


export const OverviewPane = ({ project, events }) => (
    <div className="timeline">
        <TimelineItem>
            <ProjectDescription project={project} />
        </TimelineItem>
        <ProjectTimeline project={project} events={events} />
    </div>
);
