import React, { Fragment, useContext } from "react";
import { useQuery, useMutation } from "@apollo/react-hooks";
import ChooserCompetency from "../compEdit/ChooserCompetency";
import ChooserPlan from "./ChooserPlan";
import { GET_DOMAINS, SET_LOCAL_DOMAIN } from "../queries";
import { SelectionContext } from "../utilities/SelectionContext";

function ChooserDomain(props) {
  const { state, setLocalState } = useContext(SelectionContext);
  const [setDomain] = useMutation(SET_LOCAL_DOMAIN);
  const domainId = state.domainId;

  const UpdateSelectedDomain = domain => {
    localStorage.setItem("SelectedDomain", domain);
    localStorage.setItem("SelectedPlan", "-1");
    localStorage.setItem("SelectedMilestone", "-1");
    localStorage.setItem("SelectedCompetency", "-1");
    setLocalState({
      ...state,
      domainId: domain,
      planId: "-1",
      milestoneId: "-1",
      selectedCompetency: "-1"
    });
    setDomain({
      variables: { domainId: domain }
    });
  };

  const { loading, data, error } = useQuery(GET_DOMAINS, {
    variables: {}
  });
  // const [loading, setLoading] = React.useState(true);
  return (
    <div>
      {loading && !error && <p>Loading...</p>}
      {error && !loading && (
        <Fragment>
          <p>
            ChooserDomain: Error connecting to the{" "}
            {process.env.REACT_APP_GRAPHQL_URI}
          </p>
          <pre>{JSON.stringify(error)}</pre>
        </Fragment>
      )}
      {data && !loading && !error && (
        <Fragment>
          <div className="gravity-right">
            <select
              id="DomDrop"
              name="DomDrop"
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
