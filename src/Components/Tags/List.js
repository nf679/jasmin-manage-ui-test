import React, {useState} from 'react';


import Alert from 'react-bootstrap/Alert';

import { Col, Row, Card, ListGroup, ListGroupItem } from 'react-bootstrap';

import Table from 'react-bootstrap/Table';

import { LinkContainer } from 'react-router-bootstrap';

import { PageHeader } from 'fwtheme-react-jasmin';

import { Status, useNestedResource } from '../../rest-resource';

import { useProjects, useResources, useCurrentUser, useProjectsSummary, useTags } from '../../api';

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
                            {label}  <div className={cl}></div>
                        </th>;
                    })}
                </tr>
            </thead>
        </>
    )
}

const TableBody = ({ tableData, columns }) => {
    return (
        <>
            <tbody>
                {tableData.map((data) => {
                    return (
                        <tr key={data.id}>
                            {columns.map(({ accessor }) => {
                                const tData = data[accessor] ? data[accessor] : "—";
                                return <td key={accessor}>{tData}</td>;
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </>
    )
}

// Data for the project list
const ProjectList = ({ project }) => {
    // Find the tags associated with the project
    const tags = useNestedResource(project, "tags");
    // Number corresponding to the tags
    var tagkeys = tags.data;
    return (
    	<>
            <td>{project.data.name}</td> 
            <td><TagConsortiumItem project={project} /></td>
            <td>{Object.keys(tagkeys).map((d) => (<>{tagkeys[d].data.name}&nbsp;&nbsp;</>
                    
                ))}</td>
		</>
    );
};

// Filter button, should be a dropdown selection
const Filter =() => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <button>Filter</button>
        </div>
    );
};

const TagList = ({projectsSummary, resources, tagData}) => {
    //Define columns
    var columns = [{ label: 'Project', accessor: 'project', sortable: true }, { label: 'Tags', accessor: 'tags', sortable: false }];
    const dont_sum_columns = ['project', 'tags']; // this is needed because we try to summ all the fields
    var i = 0;
    while (i < Object.values(resources.data).length) {
        columns = [...columns, { label: Object.values(resources.data)[i].data['name'], accessor: Object.values(resources.data)[i].data['name'].replaceAll(' ', '_'), sortable: true }];
        i++
    }
    // Tag dropdown
    // Add all option to tags
    const [tagSelect, setTag] = useState([]);
    const handleChange = (event) => {

        setTag(event.target.value);
    
    };
    

    var tableData1 = [];
    var i = 0;
    // Create table data
    while (i < Object.keys(projectsSummary.data).length) {
        var project = Object.values(projectsSummary.data)[i].data
        var dataline = {};
        dataline['project'] = project['name']
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
        console.log('tag selected', tagSelect);
        console.log('tags', tags)
        if (tagSelect == "All Tags") {
            tableData1 = [...tableData1, dataline]
        }
        else if (tags.includes(tagSelect) || tags.includes(tagSelect+', ')){
            tableData1 = [...tableData1, dataline]
        }
        else if (tagSelect.length == 0){
            tableData1 = [...tableData1, dataline]
        }
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

    // Handle the sorting of data
    // var [tableData, setTableData] = useState(tableData1);
    // console.log('tableData', tableData)

    // const handleSortingChange = (accessor) => {
    //     const sortOrder =
    //         accessor === sortField && order === "asc" ? "desc" : "asc";
    //     setSortField(accessor);
    //     setOrder(sortOrder);
    //     handleSorting(accessor, sortOrder);
    // };

    // const handleSorting = (sortField, sortOrder) => {
    //     if (sortField) {
    //         const sorted = [...tableData].sort((a, b) => {
    //             if (a[sortField] === null) return 1;
    //             if (b[sortField] === null) return -1;
    //             if (a[sortField] === null && b[sortField] === null) return 0;
    //             return (
    //                 a[sortField].toString().localeCompare(b[sortField].toString(), "en", {
    //                     numeric: true,
    //                 }) * (sortOrder === "asc" ? 1 : -1)
    //             );
    //         });
    //         setTableData(sorted);
    //     }
    // };

    
    return (
    <Col>
        <select value={tagSelect} onChange={handleChange}>
            <option>All Tags</option>
            {Object.values(tagData.data).map(tag => (
                <option>{tag.data.name}</option>
            ))}
        </select>
        <Table striped responsive="md" size='sm' >
            <TableHead columns={filteredColumns}  />
            <TableBody tableData={tableData1} columns={filteredColumns} />
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
    

    return (<>
        <PageHeader>Projects List</PageHeader>
        <Status.Many fetchables={[projectsSummary, resources, tags]}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">Loading projects...</SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Alert variant="danger">Unable to load projects.</Alert>
            </Status.Unavailable>
            <Status.Available>
                
                <TagList projectsSummary={projectsSummary} resources={resources} tagData={tags}/>
            </Status.Available>
        </Status.Many>
    </>);
};

export default TagPage;