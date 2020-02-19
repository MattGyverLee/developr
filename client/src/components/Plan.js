import React, { Component, Fragment } from "react";
import gql from "graphql-tag";
import { Query } from "react-apollo";
import Category from "./Category";

const DOMAIN_QUERY = (rootId, userId) => gql`
  query DomainQuery {
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
          target_competency {
            label
          }
          assessment_criteria {
            label
          }
          lv1_activity {
            label
          }
          lv2_activity {
            label
          }
          lv3_activity {
            label
          }
          lv4_activity {
            label
          }
          lv5_activity {
            label
          }
          HAS_USER_PROGRESS_rel(filter: { userId: "1" }) {
            Progress {
              currentLevel
            }
          }
        }
        has_group {
          id
          label
          group_has_competencies_of {
            id
            label
            default_weight
            default_expiration
            short_name {
              label
            }
            target_competency {
              label
            }
            assessment_criteria {
              label
            }
            lv1_activity {
              label
            }
            lv2_activity {
              label
            }
            lv3_activity {
              label
            }
            lv4_activity {
              label
            }
            lv5_activity {
              label
            }
            HAS_USER_PROGRESS_rel(filter: { userId: "1" }) {
              Progress {
                currentLevel
              }
            }
          }
          has_group {
            id
            label
            group_has_competencies_of {
              id
              label
              default_weight
              default_expiration
              short_name {
                label
              }
              target_competency {
                label
              }
              assessment_criteria {
                label
              }
              lv1_activity {
                label
              }
              lv2_activity {
                label
              }
              lv3_activity {
                label
              }
              lv4_activity {
                label
              }
              lv5_activity {
                label
              }
              HAS_USER_PROGRESS_rel(filter: { userId: "1" }) {
                Progress {
                  currentLevel
                }
              }
            }
          }
        }
      }
    }
  }
`;

//todo: Sub string for userId variable
export class Plan extends Component {
  render() {
    return (
      <div>
        <Query query={DOMAIN_QUERY("1-root", "1")}>
          {({ loading, error, data }) => {
            if (loading) return <h4>Loading...</h4>;
            /* if (error) {
              console.log(error);
              return <h4>Connection Error: Is NEo4j Running?</h4>;
            } */
            // console.log(data);
            if (data.PlanRoot) {
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
            }
          }}
        </Query>
      </div>
    );
  }
}

export default Plan;
