import React, { Component, Fragment } from "react";
import NavBar from "./NavBar";
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

export class MyMilestones extends Component {
  render() {
    return (
      <div>
        <Query query={MILESTONE_QUERY("1-root", "1", "LTCons2", "1")}>
          {({ loading, error, data }) => {
            if (loading) return <h4>Loading...</h4>;
            if (error) {
              console.log(error);
              return <h4>Connection Error: Is NEo4j Running?</h4>;
            }
            if (data) {
              return (
                <Fragment>
                  {NavBar("myMilestones")}
                  <h3 className="display-4 my-0">
                    <small className="text-muted">Milestone Report for: </small>
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
                      targetMilestone="LTCons1"
                    />
                  ))}
                  {/* TODO: Make LTCons1 a variable passed in. */}
                </Fragment>
              );
            }
          }}
        </Query>
      </div>
    );
  }
}

export default MyMilestones;
