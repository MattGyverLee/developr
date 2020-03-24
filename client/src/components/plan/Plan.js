import React, { Fragment } from "react";
import { Query } from "react-apollo";
import Category from "./Category";
import DisplayError from "../QueryError";
import { DOMAIN_QUERY } from "../queries";
import { findSortOrder } from "../utilities/sort";

//todo: Sub string for userId variable
export const Plan = props => {
  return (
    <div>
      <Query query={DOMAIN_QUERY(props.planRoot, props.userId)}>
        {({ loading, error, data }) => {
          if (loading)
            return (
              <Fragment>
                <h2>My Growth Plan</h2> <h3 id="loading">Loading...</h3>
              </Fragment>
            );
          if (error) return <DisplayError id="displayError" error={error} />;
          // console.log(data);
          if (data.PlanRoot) {
            return (
              <Fragment>
                <h2 id="planTitle" className="display-4 mt-0 mb-0">
                  <small className="text-muted">Plan for: </small>
                  {data.PlanRoot[0].label}
                </h2>
                <p>Plan Class: {data.PlanRoot[0].plan_class}</p>
                <p>
                  The <b>My Growth Plan</b> view is the main worksheet for
                  assessment and tracking of progress. Once the community of
                  practice has determined the minimum requirements for each
                  level, each organization could add new requirements, and
                  re-weight or hide optional requirements.
                </p>
                {findSortOrder(data.PlanRoot[0].has_category).map(category => (
                  <Category
                    key={category.id}
                    category={category}
                    progressNames={data.PlanRoot[0].progressnames}
                    user={data.User}
                  />
                ))}
              </Fragment>
            );
          }
        }}
      </Query>
    </div>
  );
};

export default Plan;
