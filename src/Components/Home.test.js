import React from 'react';
// import { render, screen } from '@testing-library/react';
// import { BrowserRouter as Router } from 'react-router-dom';
import renderer from 'react-test-renderer';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';


it('renders the JASMIN Projects Portal Homepage correctly', () => {
    const component = renderer.create(
        <MemoryRouter>
            <Home />
        </MemoryRouter>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});



// test('renders the JASMIN Projects Portal Homepage correctly', () => {
//     // Render the Home component within a Router
//     render(
//         <Router>
//             <Home />
//         </Router>
//     );

//     // Check for the presence of specific elements and text
//     expect(screen.getByText('JASMIN Projects Portal')).toBeInTheDocument();
//     expect(screen.getByText('Welcome to the JASMIN Projects Portal.')).toBeInTheDocument();
//     expect(screen.getByText('Using this portal, you can request JASMIN resources for your project and track their status.')).toBeInTheDocument();
//     expect(screen.getByText('Manage my projects')).toBeInTheDocument();
//     expect(screen.getByRole('button', { name: 'Manage my projects' })).toBeInTheDocument();
// });