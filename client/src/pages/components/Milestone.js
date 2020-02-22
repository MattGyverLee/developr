import React, { Fragment } from "react";
import gql from "graphql-tag";
import { Query } from "react-apollo";
import BadgeCategory from "./BadgeCategory";

const MILESTONE_QUERY = (rootId, userId, target, planNum) => gql`
  query MilestoneQuery {
    PlanRoot(id: "${rootId}") {
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
    Milestone(ms: "${target}"){
      ms
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

const Milestone = props => {
  return (
    <div>
      <Query
        query={MILESTONE_QUERY(
          props.planRoot,
          props.userId,
          props.target,
          props.planNum
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
          if (data) {
            return (
              <Fragment>
                <div className="container">
                  <h3 className="display-4 my-0">
                    <small className="text-muted">Progress Report for</small>
                    {data.Milestone[0].ms}
                    <small className="text-muted"> using plan </small>{" "}
                    {data.PlanRoot[0].label}
                  </h3>
                  {/* TODO: Get Full Name for Milestone */}
                  {data.PlanRoot[0].has_category.map(category => (
                    <BadgeCategory
                      key={category.id}
                      category={category}
                      user={data.User}
                      milestone={data.Milestone[0]}
                      target={props.target}
                      details={props.details}
                      planId={props.planId}
                    />
                  ))}
                  {/* TODO: Make LTCons1 a variable passed in. */}
                </div>
              </Fragment>
            );
          }
        }}
      </Query>
    </div>
  );
};

export default Milestone;
