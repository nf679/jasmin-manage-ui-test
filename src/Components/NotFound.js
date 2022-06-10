import React from 'react';
import { Link } from 'react-router-dom';

class NotFoundPage extends React.Component{
    render(){
        return (
            <div>
                <div style={{class:"alert alert-with-icon alert-warning", role:"alert"}}>
                    <i style={{class:"fas fa-exclamation-circle"}}></i> <span>The page you are looking for does not exist</span>
                </div>
                <p>The page you requested does not exist on this server.</p>
        
                <p>
                    You could try <Link to="/">returning to homepage</Link> or 
                    <Link to="/projects">looking at your projects</Link>.
                </p>
            </div>
        );
    }
}

export default NotFoundPage;