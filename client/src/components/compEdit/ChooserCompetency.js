import React, { Fragment } from "react";
import { useQuery } from "@apollo/react-hooks";
import { GET_COMPETENCIES } from "../queries";
import LoadEditCompetency from "./LoadEditCompetency";

function ChooserCompetency(props) {
  /*   const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10); */
  const [selectedCompetency, setSelectedCompetency] = React.useState("-1");
  // fixme: query this.
  const domainId = props.domainId || -1;
  // fixme: query this.

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
        {error && !loading && (
          <p>
            Error ChooserCompetency
            <br />
            <pre>{JSON.stringify(error)}</pre>
          </p>
        )}
        {data && !loading && !error && (
          <Fragment>
            <div>Choose a competency below:</div>
            <select
              id="CompDrop"
              name="CompDrop"
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
            {parseInt(domainId) >= 0 && selectedCompetency !== "-1" && (
              <LoadEditCompetency competencyId={selectedCompetency} />
            )}
          </Fragment>
        )}
      </div>
    );
  else return null;
}

export default ChooserCompetency;
