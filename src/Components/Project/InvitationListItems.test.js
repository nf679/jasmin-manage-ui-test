import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { InvitationsListItems } from './InvitationsListItems';
import { useProjectPermissions } from './actions';
import moment from 'moment';


// Mock the dependencies
jest.mock('moment', () => () => ({
    fromNow: jest.fn(() => 'a few seconds ago'),
}));
jest.mock('./actions', () => ({
    useProjectPermissions: jest.fn(),
}));
jest.mock('react-bootstrap-notify', () => ({
    useNotifications: jest.fn(() => jest.fn()),
}));

describe('InvitationsListItems', () => {
    const project = { id: 1, name: 'Test Project' };
    const invitations = {
        data: {
            1: { data: { id: 1, email: 'test1@example.com', created_at: new Date().toISOString() } },
            2: { data: { id: 2, email: 'test2@example.com', created_at: new Date().toISOString() } },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders a list of invitations', () => {
        useProjectPermissions.mockReturnValue({ canEditCollaborators: true });

        render(<InvitationsListItems project={project} invitations={invitations} />);

        expect(screen.getByText('test1@example.com')).toBeInTheDocument();
        expect(screen.getByText('test2@example.com')).toBeInTheDocument();
        expect(screen.getAllByText((content, element) => {
            return element.tagName.toLowerCase() === 'small' && content.includes('a few seconds ago');
        })).toHaveLength(2);
    });

    it('shows the invite form if user can edit collaborators', () => {
        useProjectPermissions.mockReturnValue({ canEditCollaborators: true });

        render(<InvitationsListItems project={project} invitations={invitations} />);

        expect(screen.getByText('Invite a new collaborator')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });

    it('does not show the invite form if user cannot edit collaborators', () => {
        useProjectPermissions.mockReturnValue({ canEditCollaborators: false });

        render(<InvitationsListItems project={project} invitations={invitations} />);

        expect(screen.queryByText('Invite a new collaborator')).not.toBeInTheDocument();
    });

    it('handles the deletion of an invitation', async () => {
        useProjectPermissions.mockReturnValue({ canEditCollaborators: true });

        render(<InvitationsListItems project={project} invitations={invitations} />);

        const revokeButtons = screen.getAllByRole('button', {name: /Delete/i });
        expect(revokeButtons).toHaveLength(2);

        fireEvent.click(revokeButtons[0]);

        expect(screen.getByText('Revoke invitation')).toBeInTheDocument();

        const modal = await screen.findByRole('dialog');

        // Check if modal contains specific pieces of text
        const modalBody = within(modal).getByText(/Are you sure you want to revoke the invitation for/i);
        expect(modalBody).toBeInTheDocument();

        // Check if email is also present
        const email = within(modal).getByText('test1@example.com');
        expect(email).toBeInTheDocument();

    });
});