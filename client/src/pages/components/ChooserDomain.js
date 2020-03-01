import React, { Fragment, useContext } from "react";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import ChooserCompetency from "./ChooserCompetency";
import ChooserPlan from "./ChooserPlan";
import { SelectionContext } from "./SelectionContext";

function ChooserDomain(props) {
  /*   const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10); */
  const { state, setLocalState } = useContext(SelectionContext);
  const GET_DOMAINS = gql`
    query listDomains {
      Domain {
        id
        label
      }
    }
  `;

  const updateSelectedDomain = domain => {
    localStorage.setItem("SelectedPlan", "-1");
    localStorage.setItem("SelectedDomain", domain);
    setLocalState({
      ...state,
      planId: "-1"
    });
    setLocalState({
      ...state,
      domainId: domain
    });
  };

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
          <div className="gravity-right">
            <select
              id="DomDrop"
              name="progress"
              value={state.domainId}
              onChange={e => updateSelectedDomain(e.currentTarget.value)}>
              <option key="-1" value="-1">
                Not Selected
              </option>
              {data.Domain.map(dom => (
                <option key={dom.id} value={dom.id}>
                  {dom.label}
                </option>
              ))}
            </select>
            {parseInt(state.domainId) >= 0 &&
              props.subElement === "chooseComp" && (
                <ChooserCompetency domainId={state.domainId} />
              )}
            {parseInt(state.domainId) >= 0 &&
              props.subElement === "choosePlan" && (
                <ChooserPlan subElement="none" domainId={state.domainId} />
              )}
          </div>
        </Fragment>
      )}
    </div>
  );
}

export default ChooserDomain;
