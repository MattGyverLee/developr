import React, { Fragment, useContext } from "react";
import gql from "graphql-tag";
import { Query } from "react-apollo";
import BadgeCategory from "./BadgeCategory";
import { SelectionContext } from "./SelectionContext";

const Milestone = props => {
  const { state } = useContext(SelectionContext);
  const MILESTONE_QUERY = (planId, userId, milestoneId) => gql`
  query MilestoneQuery {
    PlanRoot(id: "${planId}") {
      id
      label
      plan_class
      has_category {
        id
        label
        category_has_competencies_of {
          id
          label
          default_weight
          default_expiration
          short_name {
            label
          }
        }
        has_group {
          id
          group_has_competencies_of {
            id 
            label
            default_weight
            default_expiration
            short_name {
              label
            }
          }
          has_group {
            id
            group_has_competencies_of {
              id
              label
              default_weight
              default_expiration
              short_name {
                label
              }
            }
          }
        }
      }
    }
    User(id: "${userId}") {
      id
      has_progress_root {
        child_progress {
          currentLevel
          competency_progress {
            id
            label
          }
        }
      }
    }
    Milestone(ms: "${milestoneId}"){
      ms
      short_name {label}
      competencycategories {
        id
        TARGET_VALUE_IS_rel {
          min
          planId
          Milestone {ms}
        }
      }
    }
  }
`;
  return (
    <div>
      {state.planId !== "-1" && state.milestoneId !== "-1" && (
        <Query
          query={MILESTONE_QUERY(
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
                        target={state.milestoneId}
                        details={props.details}
                        planId={state.planId}
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
