import React, {useState} from 'react';


import Alert from 'react-bootstrap/Alert';

import { Col, Row, Card, ListGroup, ListGroupItem } from 'react-bootstrap';

import Table from 'react-bootstrap/Table';

import { LinkContainer } from 'react-router-bootstrap';

import { PageHeader } from 'fwtheme-react-jasmin';

import { Status, useNestedResource } from '../../rest-resource';

import { useProjects, useResources, useCurrentUser, useProjectsSummary, useTags, useConsortia } from '../../api';

import { sortByKey, SpinnerWithText, notificationFromError } from '../utils';

import { ProjectTagItem, TagConsortiumItem } from '../Project/CardItems';

const TableHead = ({ columns, handleSorting }) => {
    const [sortField, setSortField] = useState("");
    const [order, setOrder] = useState("asc");
    const handleSortingChange = (accessor) => {
        const sortOrder =
            accessor === sortField && order === "asc" ? "desc" : "asc";
        setSortField(accessor);
        setOrder(sortOrder);
        handleSorting(accessor, sortOrder);
    };
    return (
        <>
            <thead>
                <tr>
                    {columns.map(({ label, accessor, sortable }) => {
                        const cl = sortable
                            ? sortField === accessor && order === "asc"
                                ? "fas fa-fw fa-sort-down"
                                : sortField === accessor && order === "desc"
                                    ? "fas fa-fw fa-sort-up"
                                    : "fas fa-fw fa-sort"
                            : "";
                        return <th
                            key={accessor}
                            onClick={sortable ? () => handleSortingChange(accessor) : null}
                        >
                            {label}  
                            <div className={cl}></div>
                        </th>;
                    })}
                </tr>
            </thead>
        </>
    )
}

const TableBody = ({ tableData, columns, rowVisible }) => {
    return (
        <>
            <tbody>
                {tableData.map((data) => { if (rowVisible[data.id]){
                    return (
                        <tr key={data.id}>
                            {columns.map(({ accessor }) => {
                                const tData = data[accessor] ? data[accessor] : "—";
                                return <td key={accessor}>{tData}</td>;
                            })}
                        </tr>
                    );}
                })}
            </tbody>
        </>
    )
}


const TagList = ({projectsSummary, resources, tagData, consortium}) => {
    //Define columns
    var columns = [ { label: 'Project', accessor: 'project', sortable: true }, { label: 'Tags', accessor: 'tags', sortable: false }, { label: 'Consortium', accessor: 'consortium', sortable: true}];
    const dont_sum_columns = ['project', 'tags', 'consortium']; // this is needed because we try to summ all the fields
    var i = 0;
    while (i < Object.values(resources.data).length) {
        
        columns = [...columns, { label: Object.values(resources.data)[i].data['name'], accessor: Object.values(resources.data)[i].data['name'].replaceAll(' ', '_'), sortable: true }];
        i++
    }
    // Tag dropdown
    const [tagSelect, setTag] = useState("All Tags");
    const handleChangeTag = (event) => {

        setTag(event.target.value);
    
    };    
    // Consortium dropdown
    const [conSelect, setCon] = useState("All Consortia");
    const handleChangeCon = (event) => {

        setCon(event.target.value);
    
    };    


    var tableData1 = [];
    // Create an object to track whether we want to row visible depending on the filters
    var rowVisible = {};
    var i = 0;
    // Create table data
    while (i < Object.keys(projectsSummary.data).length) {
        // Add a row id to map between the visible row list, with the the data row in the table so we can hide rows with the drop downs

        // build the data for the table
        var project = Object.values(projectsSummary.data)[i].data
        var dataline = {};
        dataline['id'] = i;
        dataline['project'] = project['name']
        dataline['consortium'] = project['consortium']
        var t = 0;
        var tags = [];
        while (t < project['tags'].length) {
            tags = [...tags, project['tags'][t] + ', ']
            t++;
        }
        if (tags.length >= 1) {
            tags[t - 1] = tags[t - 1].slice(0, -2)
        }
        dataline['tags'] = tags
        
        var r = 0;
        while (r < Object.values(project['resource_summary']).length) {
            dataline[Object.keys(project['resource_summary'])[r].replaceAll(' ', '_')] = Object.values(project['resource_summary'])[r]

            r++
        }
        // Only include the data row if the tag and con is selected in the drop down
        if (tagSelect == "All Tags" && conSelect == "All Consortia") {
            rowVisible[i] = true;
        }       
        else if (tagSelect == "All Tags" && conSelect == project['consortium']){
            rowVisible[i] = true;       
        } 
        else if ((tags.includes(tagSelect) || tags.includes(tagSelect+', ')) && conSelect == project['consortium']){
            rowVisible[i] = true;        
        }
        else if ((tags.includes(tagSelect) || tags.includes(tagSelect+', ')) && conSelect == "All Consortia"){            
            rowVisible[i] = true;            
        }        
        else{
            rowVisible[i] = false;
        }
        // Update the list of data for the table
        tableData1 = [...tableData1, dataline];
        i++
    }

    var filteredColumns = [];
    // Remove columns with no data
    var c = 0;
    while (c < Object.values(columns).length) {
        // Check whether there's any data in the column
        const column_name = Object.values(columns)[c]['accessor'];
        // If its in the defined list
        if (dont_sum_columns.includes(column_name)) {
            filteredColumns = [...filteredColumns, Object.values(columns)[c]]

        }
        else {
            // Loop through the respective data column and 
            // sum the column - if its zero then there's no data
            var d = 0;
            var column_sum = 0;
            while (d < Object.values(tableData1).length) {
                column_sum += Object.values(tableData1)[d][column_name]
                d++
            }
            // If the sum is not zero, then add the column
            if (column_sum > 0) {
                filteredColumns = [...filteredColumns, Object.values(columns)[c]]
            }
        }
        c++
    }
    // Sort by project name


    // Sorting isn't working with the filter
    // Handle the sorting of data
    const [tableData, setTableData] = useState(tableData1);

    const handleSorting = (sortField, sortOrder) => {
        if (sortField) {
            const sorted = [...tableData].sort((a, b) => {
                if (a[sortField] === null) return 1;
                if (b[sortField] === null) return -1;
                if (a[sortField] === null && b[sortField] === null) return 0;
                return (
                    a[sortField].toString().localeCompare(b[sortField].toString(), "en", {
                        numeric: true,
                    }) * (sortOrder === "asc" ? 1 : -1)
                );
            });
            setTableData(sorted);
        }
    };
    
    return (
    <Col>
        <Row>
            <Col></Col>
            <Col>
                <select value={tagSelect} onChange={handleChangeTag}>
                <option>All Tags</option>
                {Object.values(tagData.data).map(tag => (
                    <option>{tag.data.name}</option>
                ))}
            </select>
            </Col>
            <Col>
                <select value={conSelect} onChange={handleChangeCon}>
                <option>All Consortia</option>
                <option>None</option>
                {Object.values(consortium.data).map(con => (
                    <option>{con.data.name}</option>
                ))}
            </select>
            </Col>
            <Col></Col>
        </Row>
        
        <Table striped responsive="md" size='sm' >
            <TableHead columns={filteredColumns}   handleSorting={handleSorting} />
            {/* <TableHead columns={filteredColumns}  /> */}
            <TableBody tableData={tableData} columns={filteredColumns} rowVisible={rowVisible}/>
        </Table>
    </Col>
    )
}

// // List projects and their tags
// const TagListOLD = () => {
//     const projects = useProjects();
//     const resources = useResources();
//     // The list should only be visible to staff and maybe consortium managers
//     const currentUser = useCurrentUser();
//     console.log('all projects', projects);
    

//     // Define columns
//     //const columnsInput = Object.keys(resources.data.project_summaries[0].resource_summary)
//     var columns = [{ label: 'Project', accessor: 'project', sortable: true }, { label: 'Tags', accessor: 'tags', sortable: false }, { label: 'Collaborators', accessor: 'collaborators', sortable: false }];
//     const dont_sum_columns = ['project', 'tags', 'collaborators']; // this is needed because we try to summ all the fields
//     var i = 0;
//     while (i < Object.values(resources.data).length) {
//         columns = [...columns, { label: Object.values(resources.data)[i].data['name'], accessor: Object.values(resources.data)[i].data['name'].replaceAll(' ', '_'), sortable: true }];
//         i++
//     }
//     var tableData1 = [];
//     var i = 0;

//     // PLAN: extend the projects portal API to create a summary for each project like 
//     // wiht the con sumamry, but on the all prjects page (so it can be callable above this leevel), 
//     // then use this object to create table data...

//     // Create table data
//     while (i < Object.values(projects.data).length) {
//         var project = Object.values(projects.data)[i]
//         var dataline = {};
//         dataline['project'] = project.data['name']
//         var t = 0;
//         var tags = [];
//         while (t <  project.data['tags'].length) {
//             tags = [...tags,  project.data['tags'][t] + ', ']
//             t++;
//         }
//         if (tags.length >= 1) {
//             tags[t - 1] = tags[t - 1].slice(0, -2)
//         }
//         dataline['tags'] = tags
//         var collabs = [];
//         var c = 0;
        
//         console.log('project', project);
//         //var collaborators = useNestedResource(project, "collaborators", { fetchPoint: false });
//         // while (c < Object.values(conSummary.data.project_summaries[i]['collaborators']).length) {
//         //     collabs = [...collabs, conSummary.data.project_summaries[i]['collaborators'][c]['username'] + ', '];
//         //     c++
//         // }
//         // if (collabs.length >= 1) {
//         //     collabs[c - 1] = collabs[c - 1].slice(0, -2)
//         // }

//         // dataline['collaborators'] = collabs;
//         // var r = 0;
//         // while (r < Object.values(conSummary.data.project_summaries[i]['resource_summary']).length) {
//         //     dataline[Object.keys(conSummary.data.project_summaries[i]['resource_summary'])[r].replaceAll(' ', '_')] = Object.values(conSummary.data.project_summaries[i]['resource_summary'])[r]

//         //     r++
//         // }
//         console.log('dataline', dataline)
//         tableData1 = [...tableData1, dataline]
//         i++
//     }
    
//     // Handle the sorting of data
//     const [tableData, setTableData] = useState(tableData1);
//     console.log(tableData)

//     return(<>
//                 {/* {data => {
//                     // Sort the projects  by name
//                     const sortedProjects = sortByKey(
//                         Object.values(data),
//                         project => [
//                             project.data.name
//                         ]
//                     );
//                     return (
                        
//                         <Row>
//                             <Col md={10}>
//                             <Table hover striped size="sm">
//                         	    <thead> <th>Project</th> <th>Consortium</th> <th>Tags</th>
//     						    </thead>
//     						    <tbody>
//                             	    {sortedProjects.map(project => (
//                             	        <LinkContainer to={{
// 					                        pathname: `/projects/${project.data.id}`,
// 					                        state: { initialData: project.data }
// 					                    }}>
// 	                                	    <tr key={project.data.name}>
// 	                                    	    <ProjectList project={project} />
// 	                                	    </tr>
//                                 	    </LinkContainer>
//                         		    ))}
//     						    </tbody>
//                             </Table>
//                             </Col>
//                             <Col>
//                                 <Card className="mb-3" style={{ borderWidth: '3px' }}>
//                                     <Card.Header>
//                                          <h5 className="mb-0">Filter Projects</h5>
//                                     </Card.Header>
//                                     <ListGroup variant="flush" className="border-0">
//                                         <ListGroupItem>
//                                             <h6>Filter by consortium</h6>
//                                             <Filter />
//                                         </ListGroupItem>
//                                         <ListGroupItem><h6>Filter by tag</h6></ListGroupItem>
//                                     </ListGroup>
//                                 </Card>
//                             </Col>
//                         </Row>
//                     );
//                 }} */}
//                  <>
//                     <Col>
//                         {/* <header>Resource summaries for all projects in Consortia. Column headers can be clicked on to order them. <a href={apiLocation}> Direct link to JSON.</a></header> */}
//                         <Table striped responsive="md" size='sm' >


//                             <TableHead columns={columns} />
//                             <TableBody tableData={tableData} columns={columns} />
//                         </Table>
//                     </Col>
//                 </>
//             </>);
// };

const TagPage = () => {
    const projectsSummary = useProjectsSummary();
    const resources = useResources();
    const tags = useTags();
    const consortium = useConsortia();
    

    return (<>
        <PageHeader>Projects List</PageHeader>
        <Status.Many fetchables={[projectsSummary, resources, tags, consortium]}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">Loading projects...</SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Alert variant="danger">Unable to load projects.</Alert>
            </Status.Unavailable>
            <Status.Available>
                
                <TagList projectsSummary={projectsSummary} resources={resources} tagData={tags} consortium={consortium}/>
            </Status.Available>
        </Status.Many>
    </>);
};

export default TagPage;