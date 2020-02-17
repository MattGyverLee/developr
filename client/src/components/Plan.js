import React, { Component, Fragment } from "react";
import gql from "graphql-tag";
import { Query } from "react-apollo";
import Category from "./Category";

const DOMAIN_QUERY = rootId => gql`
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
          has_short_name {
            label
          }
          has_target_competency {
            label
          }
          has_assessment_criteria {
            label
          }
          has_lv0_activities {
            label
          }
          has_lv1_activities {
            label
          }
          has_lv2_activities {
            label
          }
          has_lv3_activities {
            label
          }
          has_lv4_activities {
            label
          }
          has_lv5_activities {
            label
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
            has_short_name {
              label
            }
            has_target_competency {
              label
            }
            has_assessment_criteria {
              label
            }
            has_lv0_activities {
              label
            }
            has_lv1_activities {
              label
            }
            has_lv2_activities {
              label
            }
            has_lv3_activities {
              label
            }
            has_lv4_activities {
              label
            }
            has_lv5_activities {
              label
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
              has_short_name {
                label
              }
              has_target_competency {
                label
              }
              has_assessment_criteria {
                label
              }
              has_lv0_activities {
                label
              }
              has_lv1_activities {
                label
              }
              has_lv2_activities {
                label
              }
              has_lv3_activities {
                label
              }
              has_lv4_activities {
                label
              }
              has_lv5_activities {
                label
              }
            }
          }
        }
      }
    }
  }
`;

export class Plan extends Component {
  render() {
    return (
      <div>
        <Query query={DOMAIN_QUERY("1-root")}>
          {({ loading, error, data }) => {
            if (loading) return <h4>Loading...</h4>;
            if (error) console.log(error);
            // console.log(data);
            return (
              <Fragment>
                <h1 className="display-4 my-3">
                  Plan For: {data.PlanRoot[0].label}
                </h1>
                <p>Plan Class: {data.PlanRoot[0].plan_class}</p>
                {data.PlanRoot[0].has_category.map(category => (
                  <Category key={category.id} category={category} />
                ))}
              </Fragment>
            );
          }}
        </Query>
      </div>
    );
  }
}

export default Plan;
