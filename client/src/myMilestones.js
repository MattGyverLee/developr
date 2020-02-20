import React, { Component, Fragment } from "react";
import NavBar from "./components/NavBar";
import gql from "graphql-tag";
import { Query } from "react-apollo";

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
    Milestone(ms: "${target}", planId: "${planNum}") {
      ms
      competencycategories {
        id
        TARGET_VALUE_IS_rel {
          min
          planId
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
            console.log(data);
            if (data) {
              return (
                <Fragment>
                  {NavBar("myMilestones")}
                  <h2 className="display-4 my-0">
                    <small className="text-muted">
                      Milestone Report for: {data.PlanRoot[0].label}
                    </small>
                  </h2>
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
