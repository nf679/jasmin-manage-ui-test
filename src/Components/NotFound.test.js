import React from 'react';
//import renderer from 'react-test-renderer';
import { BrowserRouter as Router } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import NotFound from './NotFound';

it('renders the page properly', () => {

    render(
        <Router>
            <NotFound />
        </Router>
    );
    const { getByText} = render(<NotFound />);
    //const { getByRole} = render(<NotFound />);

    const mainHeading = screen.getAllByText('Page Not Found'); //getAllByText is a bit dodgy
    //const alertIcon = screen.getAllByRole('alert', {name: ""}); // Who knows what's going on here
    const alertMessage = screen.getAllByText(/'The page you requested does not exist on this server. You could try returning to the homepage, viewing your projects, or looking at consortia.'/i)

    expect(mainHeading).toBeVisible();
    expect(alertIcon).toBeVisible();
    expect(alertMessage).toBeVisible();
});