import React, { Fragment } from "react";
import { Query } from "react-apollo";
import Category from "./Category";
import DisplayError from "./QueryError";
import { SITREP, DOMAIN_QUERY } from "../queries";
import { useQuery } from "@apollo/react-hooks";

//todo: Sub string for userId variable
export const Plan = props => {
  const { planId, userId } = useQuery(SITREP);
  return (
    <div>
      <Query query={DOMAIN_QUERY(planId, userId)}>
        {({ loading, error, data }) => {
          if (loading)
            return (
              <Fragment>
                <h2>My Growth Plan</h2> <h3>Loading...</h3>
              </Fragment>
            );
          if (error) return <DisplayError error={error} />;
          // console.log(data);
          if (data.PlanRoot[0]) {
            return (
              <Fragment>
                <h2 className="display-4 my-0">
                  <small className="text-muted">Plan for: </small>
                  {data.PlanRoot[0].label}
                </h2>
                <p>Plan Class: {data.PlanRoot[0].plan_class}</p>
                {data.PlanRoot[0].has_category.map(category => (
                  <Category key={category.id} category={category} />
                ))}
              </Fragment>
            );
          } else return <div>No Plan Selected</div>;
        }}
      </Query>
    </div>
  );
};

export default Plan;
