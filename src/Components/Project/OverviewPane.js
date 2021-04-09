import React from 'react';

import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';

import moment from 'moment';

import ReactMarkdown from 'react-markdown';

import { Status, useNestedResource } from '../../rest-resource';

import { sortByKey, SpinnerWithText } from '../utils';

import '../../css/project-detail.css';


const ProjectDescription = ({ project }) => (
    <div className="timeline-item">
        <div className="timeline-item-container">
            <Card className="timeline-item-content">
                <Card.Header><strong>Project description</strong></Card.Header>
                <Card.Body className="markdown">
                    <ReactMarkdown children={project.data.description} />
                </Card.Body>
            </Card>
        </div>
    </div>
);


const CommentTimelineItem = ({ project, comment }) => {
    const displayName = comment.data.user.last_name ?
        `${comment.data.user.first_name} ${comment.data.user.last_name}` :
        comment.data.user.username;
    const createdAt = moment(comment.data.created_at).format('D MMMM');
    return (
        <div className="timeline-item">
            <div className="timeline-item-container">
                <Card className="timeline-item-content comment">
                    <Card.Header>
                        <strong>{displayName}</strong> commented on {createdAt}
                    </Card.Header>
                    <Card.Body className="markdown">
                        <ReactMarkdown children={comment.data.content} />
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};


const ProjectTimeline = ({ project }) => {
    const comments = useNestedResource(project, "comments");
    return (
        <Status fetchable={comments}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">
                        Loading comments...
                    </SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Alert variant="danger">Unable to load comments.</Alert>
            </Status.Unavailable>
            <Status.Available>
                {data => {
                    // Sort the comments by created_at with the newest first
                    const sortedComments = sortByKey(
                        Object.values(data),
                        comment => comment.data.created_at,
                        true
                    );
                    return sortedComments.map(comment => (
                        <CommentTimelineItem
                            key={comment.data.id}
                            project={project}
                            comment={comment}
                        />
                    ));
                }}
            </Status.Available>
        </Status>
    );
};


export const OverviewPane = ({ project }) => (
    <div className="timeline">
        <ProjectDescription project={project} />
        <ProjectTimeline project={project} />
    </div>
);
