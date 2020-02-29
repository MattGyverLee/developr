import React, { Fragment } from "react";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import ChooserCompetency from "./ChooserCompetency";
import ChooserPlan from "./ChooserPlan";

const GET_DOMAINS = gql`
  query listCompetencies {
    Domain {
      id
      label
    }
  }
`;

function ChooserDomain(props) {
  /*   const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10); */
  const [selectedDomain, setSelectedDomain] = React.useState("-1");

  const { loading, data, error } = useQuery(GET_DOMAINS, {
    variables: {
      /*       first: rowsPerPage,
      offset: rowsPerPage * page,
      orderBy: orderBy + "_" + order */
    }
  });
  // const [loading, setLoading] = React.useState(true);
  return (
    <div>
      {loading && !error && <p>Loading...</p>}
      {error && !loading && <p>Error</p>}
      {data && !loading && !error && (
        <Fragment>
          <div>Choose a Domain:</div>
          <select
            id="DomDrop"
            name="progress"
            value={selectedDomain}
            onChange={e => setSelectedDomain(e.currentTarget.value)}>
            <option key="-1" value="-1">
              Not Selected
            </option>
            {data.Domain.map(dom => (
              <option key={dom.id} value={dom.id}>
                {dom.label}
              </option>
            ))}
          </select>
          {selectedDomain >= 0 && props.subElement == "chooseComp" && (
            <ChooserCompetency domainId={selectedDomain} />
          )}
          {selectedDomain >= 0 && props.subElement == "choosePlan" && (
            <ChooserPlan subElement="none" domainId={selectedDomain} />
          )}
        </Fragment>
      )}
    </div>
  );
}

export default ChooserDomain;
