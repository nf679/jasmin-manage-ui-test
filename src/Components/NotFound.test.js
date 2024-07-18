import React from 'react';
import { render } from '@testing-library/react';
import NotFound from './NotFound';

it('Renders the page correctly', () => {
    const { getByText, getByRole } = render(<NotFound />);

    const mainHeading = getByText('Page Not Found');
    const alertIcon = getByRole('ROLE', {name: "NAME"});
    const alertMessage = getByText(/The page you are looking for does not exist/i);

    expect(mainHeading).toBeInTheDocument();
    expect(alertIcon).toBeInTheDocument();
    expect(alertMessage).toBeInTheDocument();
})