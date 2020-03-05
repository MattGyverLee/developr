import React, { Fragment, useContext } from "react";
import ChooserCompetency from "./ChooserCompetency";
import ChooserPlan from "./ChooserPlan";
import { SITREP, GET_DOMAINS, SET_DOMAIN } from "../queries";
import { useQuery, useMutation } from "@apollo/react-hooks";

function UpdateSelectedDomain(domain) {
  const [result] = useMutation(SET_DOMAIN(domain));
  localStorage.setItem("SelectedPlan", "-1");
  localStorage.setItem("SelectedDomain", domain);
  localStorage.setItem("SelectedMilestone", "-1");
  // FIXME: Write this as a mutation.

  /* cache.writeData({
    data: {
      planId: "-1",
      domainId: domain,
      milestoneId: "-1"
    }
  }); */
}

function ChooserDomain(props) {
  /*   const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10); */

  const { domainId } = useQuery(SITREP);

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
              value={domainId}
              onChange={e => UpdateSelectedDomain(e.currentTarget.value)}>
              <option key="-1" value="-1">
                Not Selected
              </option>
              {data.Domain.map(dom => (
                <option key={dom.id} value={dom.id}>
                  {dom.label}
                </option>
              ))}
            </select>
            {parseInt(domainId) >= 0 && props.subElement === "chooseComp" && (
              <ChooserCompetency domainId={domainId} />
            )}
            {parseInt(domainId) >= 0 && props.subElement === "choosePlan" && (
              <ChooserPlan subElement="none" domainId={domainId} />
            )}
          </div>
        </Fragment>
      )}
    </div>
  );
}

export default ChooserDomain;
