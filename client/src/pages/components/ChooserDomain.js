import React, { Fragment, useContext } from "react";
import ChooserCompetency from "./ChooserCompetency";
import ChooserPlan from "./ChooserPlan";
import { SITREP, GET_DOMAINS, SET_DOMAIN, SET_LOCAL_DOMAIN } from "../queries";
import { useQuery, useMutation } from "@apollo/react-hooks";

const ChooserDomain = props => {
  const { domainId } = useQuery(SITREP);

  const { loading, data, error } = useQuery(GET_DOMAINS, {
    variables: {}
  });

  const [setDomain] = useMutation(SET_LOCAL_DOMAIN);

  const UpdateSelectedDomain = domain => {
    localStorage.setItem("SelectedPlan", "-1");
    localStorage.setItem("SelectedDomain", domain);
    localStorage.setItem("SelectedMilestone", "-1");

    // FIXME: Write this as a mutation.
    setDomain({
      variables: { domainId: domain }
    });
    /*     setDomain({
      variables: {
        user: "1",
        Name: "Matthew",
        chosenDomain: domain
      }
    }); */
  };

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
              <ChooserCompetency
                domainId={localStorage.getItem("SelectedDomain")}
              />
            )}
            {parseInt(domainId) >= 0 && props.subElement === "choosePlan" && (
              <ChooserPlan
                subElement="none"
                domainId={localStorage.getItem("SelectedDomain")}
              />
            )}
          </div>
        </Fragment>
      )}
    </div>
  );
};

export default ChooserDomain;
