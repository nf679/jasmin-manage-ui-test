import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import { useState } from "react";

import classNames from 'classnames';

import { useHistory, useLocation } from 'react-router-dom';

import { LinkContainer } from 'react-router-bootstrap';

import {
    Status,
    useNestedResource,
    useEnsureInitialised
} from '../../rest-resource';

import { useConsortiumSummary, useResources, useServices } from '../../api';

import { SpinnerWithText, formatAmount, sortByKey } from '../utils';

import '../../css/quota-card.css';

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

const SummaryPane = ({ conSummary, consortium }) => {
    // Get the consortia id
    const con_id = consortium.data.id;
    console.log(con_id);

    // Build the url for the json version link
    const path = useLocation().pathname
    console.log(location['href'])
    const apiLocation = location['href'].replace(path, '/api' + path + '?format=json')
    console.log(apiLocation)

    // Define columns
    const columnsInput = Object.keys(conSummary.data.project_summaries[0].resource_summary)
    var columns = [{ label: 'project', accessor: 'project', sortable: true }, { label: 'tags', accessor: 'tags', sortable: false }, { label: 'collaborators', accessor: 'collaborators', sortable: false }];
    var i = 0;
    while (i < Object.values(columnsInput).length) {
        columns = [...columns, { label: Object.values(columnsInput)[i], accessor: Object.values(columnsInput)[i].replaceAll(' ', '_'), sortable: true }];
        i++
    }

    var tableData1 = [];
    var i = 0;
    // Create table data
    while (i < Object.keys(conSummary.data.project_summaries).length) {
        var dataline = {};
        dataline['project'] = conSummary.data.project_summaries[i]['project_name']
        var t = 0;
        var tags = [];
        while (t < conSummary.data.project_summaries[i]['tags'].length) {
            tags = [...tags, conSummary.data.project_summaries[i]['tags'][t] + ', ']
            t++;
        }
        if (tags.length >= 1) {
            tags[t - 1] = tags[t - 1].slice(0, -2)
        }
        dataline['tags'] = tags
        var collabs = [];
        var c = 0;
        while (c < Object.values(conSummary.data.project_summaries[i]['collaborators']).length) {
            collabs = [...collabs, conSummary.data.project_summaries[i]['collaborators'][c]['username'] + ', '];
            c++
        }
        if (collabs.length >= 1) {
            collabs[c - 1] = collabs[c - 1].slice(0, -2)
        }

        dataline['collaborators'] = collabs;
        tableData1 = [...tableData1, dataline]
        var r = 0;
        while (r < Object.values(conSummary.data.project_summaries[i]['resource_summary']).length) {
            dataline[Object.keys(conSummary.data.project_summaries[i]['resource_summary'])[r].replaceAll(' ', '_')] = Object.values(conSummary.data.project_summaries[i]['resource_summary'])[r]

            r++
        }
        i++
    }

    // Handle the sorting of data
    const [tableData, setTableData] = useState(tableData1);

    const handleSortingChange = (accessor) => {
        const sortOrder =
            accessor === sortField && order === "asc" ? "desc" : "asc";
        setSortField(accessor);
        setOrder(sortOrder);
        handleSorting(accessor, sortOrder);
    };

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
        <Status fetchable={conSummary}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">Loading data...</SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Status.Throw />
            </Status.Unavailable>
            <Status.Available>
                <>
                    <Col>
                        <header>Resource summaries for all projects in Consortia. Column headers can be clicked on to order them. <a href={apiLocation}> Direct link to JSON.</a></header>
                        <Table striped responsive="md" size='sm' >


                            <TableHead columns={columns} handleSorting={handleSorting} />
                            <TableBody tableData={tableData} columns={columns} />
                        </Table>
                    </Col>
                </>
            </Status.Available>
        </Status >);
};


export default SummaryPane;
