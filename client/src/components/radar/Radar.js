import React, { Fragment, useContext } from "react";
import { GET_MILESTONE_QUERY } from "../queries";
import { Query } from "react-apollo";
import { SelectionContext } from "../utilities/SelectionContext";
import { findSortOrder } from "../utilities/sort";
import { Radar } from "react-chartjs-2";
import { getTarget } from "../utilities/maths";

const displayProgress = (category, progresses, inTarget, minValues) => {
  // this runs when the Category has a target score.
  var acc = 0;
  var catTarget = -1;
  try {
    catTarget = minValues.filter(cat => cat.id === category.id)[0].min;
  } catch (error) {}
  if (catTarget > 0) {
    // Get totals from child competencies
    category.category_has_competencies_of.forEach(competency => {
      const relevantProgress = progresses.filter(
        progress => progress.competency_progress[0].id === competency.id
      );
      if (relevantProgress.length > 0) {
        acc =
          acc +
          relevantProgress[0].currentLevel *
            parseFloat(competency.default_weight);
        // Todo: Handle non-default weight
      }
    });
    // Get totals from child groups
    category.has_group.forEach(group => {
      group.group_has_competencies_of.forEach(competency => {
        const relevantProgress = progresses.filter(
          progress => progress.competency_progress[0].id === competency.id
        );
        if (relevantProgress.length > 0) {
          /* console.log(relevantProgress); */
          acc =
            acc +
            relevantProgress[0].currentLevel *
              parseFloat(competency.default_weight);
        }
      });
      group.has_group.forEach(group => {
        group.group_has_competencies_of.forEach(competency => {
          const relevantProgress = progresses.filter(
            progress => progress.competency_progress[0].id === competency.id
          );
          if (relevantProgress.length > 0) {
            acc =
              acc +
              relevantProgress[0].currentLevel *
                parseFloat(competency.default_weight);
          }
        });
      });
    });

    return { id: category.label, progress: acc, target: catTarget };
  }

  var fullAcc = 0;
  var targetTotal = 0;
  if (catTarget <= 0) {
    // targets are unavalable or further down
    acc = 0;
    fullAcc = 0;
    targetTotal = 0;
    // Get totals from child competencies and check progress
    category.category_has_competencies_of.forEach(competency => {
      const relevantProgress = progresses.filter(
        progress => progress.competency_progress[0].id === competency.id
      );
      const target = getTarget(competency.id, minValues);
      if (relevantProgress.length > 0) {
        if (
          relevantProgress[0].currentLevel *
            parseFloat(competency.default_weight) <=
          target
        ) {
          acc =
            acc +
            relevantProgress[0].currentLevel *
              parseFloat(competency.default_weight);
          fullAcc =
            fullAcc +
            relevantProgress[0].currentLevel *
              parseFloat(competency.default_weight);
        } else {
          acc = acc + target;
          fullAcc =
            fullAcc +
            relevantProgress[0].currentLevel *
              parseFloat(competency.default_weight);
          // Only counting required progress up to a goal.
        }
      }
      targetTotal = targetTotal + target;
    });

    // Get totals from child groups
    category.has_group.forEach(group => {
      group.group_has_competencies_of.forEach(competency => {
        const relevantProgress = progresses.filter(
          progress => progress.competency_progress[0].id === competency.id
        );
        const target = getTarget(competency.id, minValues);
        if (relevantProgress.length > 0) {
          if (
            relevantProgress[0].currentLevel *
              parseFloat(competency.default_weight) <=
            target
          ) {
            acc =
              acc +
              relevantProgress[0].currentLevel *
                parseFloat(competency.default_weight);
            fullAcc =
              fullAcc +
              relevantProgress[0].currentLevel *
                parseFloat(competency.default_weight);
          } else {
            acc = acc + target;
            fullAcc =
              fullAcc +
              relevantProgress[0].currentLevel *
                parseFloat(competency.default_weight);
            // Only counting required progress up to a goal.
          }
          // Todo: Handle non-default weight
        }
        targetTotal = targetTotal + target;
      });
      group.has_group.forEach(group => {
        group.group_has_competencies_of.forEach(competency => {
          const relevantProgress = progresses.filter(
            progress => progress.competency_progress[0].id === competency.id
          );
          const target = getTarget(competency.id, minValues);
          if (relevantProgress.length > 0) {
            if (
              relevantProgress[0].currentLevel *
                parseFloat(competency.default_weight) <=
              target
            ) {
              acc =
                acc +
                relevantProgress[0].currentLevel *
                  parseFloat(competency.default_weight);
              fullAcc =
                fullAcc +
                relevantProgress[0].currentLevel *
                  parseFloat(competency.default_weight);
            } else {
              acc = acc + target;
              fullAcc =
                fullAcc +
                relevantProgress[0].currentLevel *
                  parseFloat(competency.default_weight);
              // Only counting required progress up to a goal.
            }
            // Todo: Handle non-default weight
          }
          targetTotal = targetTotal + target;
        });
      });
    });
  }
  return {
    id: category.label,
    progress: acc,
    adjustedProgress: fullAcc,
    target: targetTotal
  };
};

const RadarComponent = props => {
  const { state } = useContext(SelectionContext);
  var accy = [];
  var labelList = [];
  var progressList = [];
  var adjProgressList = [];
  var targetList = [];
  const parseCats = (catList, data) => {
    accy = [];
    if (catList.length > 0) {
      findSortOrder(catList).map(category => {
        const progress = displayProgress(
          category,
          data.User[0].has_progress_root[0].child_progress,
          state.milestoneId,
          data.Milestone[0].minValues
        );
        accy.push(progress);
        return null;
      });
      labelList = [];
      progressList = [];
      adjProgressList = [];
      targetList = [];
      accy.forEach(spur => {
        labelList.push(spur.id);
        progressList.push(spur.progress);
        targetList.push(spur.target);
        if (spur.adjustedProgress) {
          adjProgressList.push(spur.adjustedProgress);
        }
      });
      var radarData = {};
      if (adjProgressList.length > 0) {
        radarData = {
          labels: labelList,
          datasets: [
            {
              label: "Target: " + data.Milestone[0].short_name[0].label,
              data: targetList,
              borderColor: "green"
            },
            {
              label: "Qualifying Progress",
              data: progressList,
              borderColor: "blue"
            },
            {
              label: "All Points",
              data: adjProgressList,
              borderColor: "yellow"
            }
          ]
        };
      } else {
        radarData = {
          labels: labelList,
          datasets: [
            {
              label: "Target: " + data.Milestone[0].short_name[0].label,
              data: targetList,
              borderColor: "green"
            },
            { label: "Progress", data: progressList, borderColor: "blue" }
          ]
        };
      }
      return radarData;
    } else {
      return null;
    }
  };

  return (
    <div>
      {state.planId !== "-1" &&
        state.domainId !== "-1" &&
        state.milestoneId !== "-1" && (
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
                      <h2 className="my-0">
                        <small className="text-muted">Radar Report for </small>
                        {data.Milestone[0].short_name[0].label}
                        <small className="text-muted"> Using Plan </small>{" "}
                        {data.PlanRoot[0].label}
                      </h2>
                      <br />
                      {/* TODO: Get Full Name for Milestone */}
                      {parseCats(data.PlanRoot[0].has_category, data) && (
                        <Radar
                          data={parseCats(data.PlanRoot[0].has_category, data)}
                          options={{
                            scale: {
                              ticks: {
                                beginAtZero: true
                              }
                            },
                            legend: {
                              position: "right"
                            }
                          }}
                        />
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

export default RadarComponent;
