import React, { Fragment } from "react";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import LoadEditCompetency from "./LoadEditCompetency";

const GET_COMPETENCIES = domainId => gql`
  query listDomainCompetencies {
    Domain(id: "${domainId}") {
      primary_domain_of {
        id
        label
      }
    }
  }
`;

function ChooserCompetency(props) {
  /*   const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10); */
  const [selectedCompetency, setSelectedCompetency] = React.useState("-1");
  const domainId = props.domainId || -1;

  const { loading, data, error } = useQuery(GET_COMPETENCIES(domainId), {
    variables: {
      /*       first: rowsPerPage,
      offset: rowsPerPage * page,
      orderBy: orderBy + "_" + order */
    }
  });
  // const [loading, setLoading] = React.useState(true);
  if (parseInt(domainId) >= 0)
    return (
      <div>
        {loading && !error && <p>Loading...</p>}
        {error && !loading && <p>Error</p>}
        {data && !loading && !error && (
          <Fragment>
            <div>Choose a competency below:</div>
            <select
              id="CompDrop"
              name="progress"
              value={selectedCompetency}
              onChange={e => setSelectedCompetency(e.currentTarget.value)}>
              <option key="-1" value="-1">
                Not Selected
              </option>
              {data.Domain[0].primary_domain_of.map(comp => {
                if (comp.label && comp.label !== "") {
                  return (
                    <option key={comp.id} value={comp.id}>
                      {comp.label}
                    </option>
                  );
                } else return;
              })}
            </select>
            {parseInt(domainId) >= 0 && (
              <LoadEditCompetency competencyId={selectedCompetency} />
            )}
          </Fragment>
        )}
      </div>
    );
  else return null;
}

export default ChooserCompetency;
