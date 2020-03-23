import React, { Fragment, useContext } from "react";
import { GET_MILESTONE_QUERY } from "../queries";
import { Query } from "react-apollo";
import Category from "./Category";
import { SelectionContext } from "../utilities/SelectionContext";
import { findSortOrder } from "../utilities/sort";
const Milestone = props => {
  const { state } = useContext(SelectionContext);
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
              return (
                <Fragment>
                  <div className="container">
                    <h2 className="card-header mt-0 mb-3">
                      <small className="text-muted">Progress Report for </small>
                      {data.Milestone[0].short_name[0].label}
                      <small className="text-muted"> Using Plan </small>{" "}
                      {data.PlanRoot[0].label}
                    </h2>
                    <p>
                      This Milestone view shows your progress towards a specific
                      Milestone.{" "}
                      {props.details
                        ? "Milestone Details shows each individual competency."
                        : "Milestone Overview only shows the categories, and not each group or competency."}{" "}
                      If you have met the requirements of your organization for
                      a Category of your Milestone, you will achieve a "badge",
                      a cryptographically signed image that serves as a
                      certificate from your organization. Note: the badges in
                      this interface are temporary placeholders until a badge
                      server is in place.
                      <br />
                      For more information about badges, visit the following
                      link:{" "}
                      <a href="https://support.badgr.com/portal/kb/articles/what-are-open-badges">
                        What are badges?
                      </a>
                    </p>
                    {/* TODO: Get Full Name for Milestone */}
                    {findSortOrder(data.PlanRoot[0].has_category).map(
                      category => (
                        <Category
                          key={category.id}
                          category={category}
                          user={data.User}
                          milestone={data.Milestone[0]}
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
