import React, { Fragment, useContext } from "react";
import { SITREP, GET_MILESTONE_QUERY } from "../queries";
import { Query } from "react-apollo";
import BadgeCategory from "./BadgeCategory";
import { useQuery } from "@apollo/react-hooks";

const Milestone = props => {
  const { planId, milestoneId, userId, domainId } = useQuery(SITREP);

  return (
    <div>
      {planId !== "-1" && milestoneId !== "-1" && (
        <Query query={GET_MILESTONE_QUERY(planId, userId, milestoneId)}>
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
                    <h2 className="my-0">
                      <small className="text-muted">Progress Report for </small>
                      {data.Milestone[0].short_name[0].label}
                      <small className="text-muted"> Using Plan </small>{" "}
                      {data.PlanRoot[0].label}
                    </h2>
                    <br />
                    {/* TODO: Get Full Name for Milestone */}
                    {data.PlanRoot[0].has_category.map(category => (
                      <BadgeCategory
                        key={category.id}
                        category={category}
                        user={data.User}
                        milestone={data.Milestone[0]}
                        target={milestoneId}
                        details={props.details}
                        planId={planId}
                      />
                    ))}
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
