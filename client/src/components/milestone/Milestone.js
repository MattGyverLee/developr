import React, { Fragment, useContext } from "react";
import { SITREP, GET_MILESTONE_QUERY } from "../queries";
import { Query } from "react-apollo";
import BadgeCategory from "./Category";
import { SelectionContext } from "../utilities/SelectionContext";
import { findSortOrder } from "../utilities/sort";

const Milestone = props => {
  const { state, setLocalState } = useContext(SelectionContext);
  return (
    <div>
      {state.planId !== "-1" && state.milestoneId !== "-1" && (
        <Query
          query={GET_MILESTONE_QUERY(
            state.planId,
            state.userId,
            state.milestoneId
          )}>
          {({ loading, error, data }) => {
            if (loading) return <h4>Loading...</h4>;
            if (error) {
              console.log(error);
              return (
                <Fragment>
                  <h4>Error: Is NEo4j Running?</h4>{" "}
                  <card>
                    <pre>
                      {error.graphQLErrors.map(({ message }, i) => (
                        <span key={i}>{message}</span>
                      ))}
                    </pre>
                  </card>
                </Fragment>
              );
            }
            if (data.PlanRoot && data.PlanRoot.length > 0) {
              if (state.msPlanRoot !== data.PlanRoot[0]) {
                setLocalState({
                  ...state,
                  msPlanRoot: data.PlanRoot[0]
                });
              }

              if (data.Milestone && data.Milestone.length > 0) {
                if (state.msMilestone !== data.Milestone[0]) {
                  setLocalState({
                    ...state,
                    msMilestone: data.Milestone[0]
                  });
                }
              }
              if (data.User) {
                if (state.msUser !== data.User) {
                  setLocalState({
                    ...state,
                    msUser: data.User
                  });
                }
              }

              return (
                <Fragment>
                  <div className="container">
                    <h2 className="my-0">
                      <small className="text-muted">Progress Report for </small>
                      {state.msMilestone.short_name[0].label}
                      <small className="text-muted"> Using Plan </small>{" "}
                      {state.msPlanRoot.label}
                    </h2>
                    <br />
                    {/* TODO: Get Full Name for Milestone */}
                    {findSortOrder(state.msPlanRoot.has_category).map(
                      category => (
                        <BadgeCategory
                          key={category.id}
                          category={category}
                          user={state.msUser}
                          milestone={state.msMilestone}
                          target={state.milestoneId}
                          details={props.details}
                          planId={state.planId}
                        />
                      )
                    )}
                    {/* TODO: Make LTCons1 a variable passed in. */}
                  </div>
                </Fragment>
              );
            } else return null;
          }}
        </Query>
      )}
    </div>
  );
};

export default Milestone;
