import React, { Fragment, useContext } from "react";
import { GET_MILESTONE_QUERY } from "../queries";
import { Query } from "react-apollo";
import { SelectionContext } from "../utilities/SelectionContext";
import { findSortOrder } from "../utilities/sort";
import { getTarget } from "../utilities/maths";
import { getColor, calcAlpha } from "../utilities/color";

const displayProgress = (category, progresses, inTarget, minValues, color) => {
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

    return {
      id: category.label,
      progress: acc,
      target: catTarget,
      color: color
    };
  }

  var fullAcc = 0;
  var targetTotal = 0;
  var bonus = 0;

  if (catTarget <= 0) {
    // targets are unavalable or further down
    acc = 0;
    fullAcc = 0;
    targetTotal = 0;
    bonus = 0;

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
          bonus =
            bonus +
            (relevantProgress[0].currentLevel *
              parseFloat(competency.default_weight) -
              target);
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
            bonus =
              bonus +
              (relevantProgress[0].currentLevel *
                parseFloat(competency.default_weight) -
                target);
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
              bonus =
                bonus +
                (relevantProgress[0].currentLevel *
                  parseFloat(competency.default_weight) -
                  target);
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
    target: targetTotal,
    bonus: bonus,
    color: color
  };
};

const Tabular = props => {
  const { state } = useContext(SelectionContext);
  var accy = [];
  var labelList = [];
  var progressList = [];
  var adjProgressList = [];
  var targetList = [];
  var bonusList = [];
  var colorList = [];

  const parseCats = (catList, data) => {
    accy = [];
    if (catList.length > 0) {
      findSortOrder(catList).map(category => {
        const progress = displayProgress(
          category,
          data.User[0].has_progress_root[0].child_progress,
          state.milestoneId,
          data.Milestone[0].minValues,
          category.color
        );
        accy.push(progress);
        return null;
      });

      labelList = [];
      progressList = [];
      adjProgressList = [];
      bonusList = [];
      targetList = [];
      colorList = [];
      accy.forEach(spur => {
        labelList.push(spur.id);
        progressList.push(spur.progress);
        targetList.push(spur.target);
        colorList.push(getColor(spur.color, calcAlpha(2)));
        if (spur.adjustedProgress) {
          adjProgressList.push(spur.adjustedProgress);
          bonusList.push(spur.bonus);
        }
      });

      return {
        labelList,
        progressList,
        targetList,
        adjProgressList,
        bonusList,
        colorList
      };
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
                const tableData = parseCats(
                  data.PlanRoot[0].has_category,
                  data
                );
                var colorIndex = -1;
                const getNextColor = () => {
                  colorIndex++;
                  return tableData.colorList[colorIndex];
                };
                const resetColorIndex = () => {
                  colorIndex = -1;
                };
                return (
                  <Fragment>
                    <div className="container">
                      <h2 className="mt-0 mb-3">
                        <small className="text-muted">
                          Tabular Report for{" "}
                        </small>
                        {data.Milestone[0].short_name[0].label}
                        <small className="text-muted"> Using Plan </small>{" "}
                        {data.PlanRoot[0].label}
                      </h2>
                      <p>
                        When targeting a specific Milestone, the table of
                        results may look like this:
                      </p>
                      <br />
                      {/* TODO: Get Full Name for Milestone */}
                      {accy.length > 0 && (
                        <div className="table-responsive">
                          <table className="table table-sm table-striped table-bordered table-hover text-center">
                            <tr>
                              <th colspan="2" scope="col row" />
                              {tableData.labelList.map((label, index) => (
                                <th
                                  scope="col"
                                  style={{
                                    backgroundColor: tableData.colorList[index]
                                  }}>
                                  {label}
                                </th>
                              ))}
                            </tr>
                            <tbody>
                              {resetColorIndex()}
                              <tr>
                                <th colspan="2" scope="row">
                                  Relevant Progress
                                </th>
                                {tableData.progressList.map(progress => (
                                  <td>
                                    <strong>
                                      <big>{progress}</big>
                                    </strong>
                                  </td>
                                ))}
                              </tr>
                              <tr>
                                <th colspan="2" scope="row">
                                  {data.Milestone[0].short_name[0].label}
                                </th>
                                {tableData.targetList.map((target, index) => (
                                  <td>
                                    {tableData.progressList[index] >=
                                      target && (
                                      <span style={{ color: "#009900" }}>
                                        <big>{target}</big>
                                      </span>
                                    )}
                                    {tableData.progressList[index] < target && (
                                      <span style={{ color: "#CC9900" }}>
                                        <big>{target}</big>
                                      </span>
                                    )}
                                  </td>
                                ))}
                              </tr>

                              {tableData.bonusList &&
                                tableData.bonusList.length > 0 && (
                                  <tr>
                                    <th colspan="2" scope="row">
                                      Extra Points
                                      <a href="#extra">
                                        <u>*</u>
                                      </a>
                                    </th>
                                    {tableData.labelList.map((label, index) => (
                                      <td>{tableData.bonusList[index] || 0}</td>
                                    ))}
                                  </tr>
                                )}
                              <tr>
                                <th colspan="2" scope="row">
                                  Proposed Level (Per Column)
                                </th>
                                {tableData.targetList.map((target, index) => (
                                  <td>
                                    {tableData.progressList[index] >=
                                      target && (
                                      <span style={{ color: "#009900" }}>
                                        <big>
                                          {
                                            data.Milestone[0].short_name[0]
                                              .label
                                          }
                                        </big>
                                      </span>
                                    )}
                                    {tableData.progressList[index] < target && (
                                      <span style={{ color: "#CC9900" }}>
                                        <big>Insufficient Progress</big>
                                      </span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                      {tableData.bonusList && tableData.bonusList.length > 0 && (
                        <p>
                          <a id="extra" />* If targets are defined
                          per-competency, then excess points don't count toward
                          the Milestone. It's not clear how these "overachiever
                          points" should best be displayed.
                        </p>
                      )}
                      <h2>Global View</h2>
                      <p>
                        Alternately, results could be shown globally as in this
                        example from Language Technology's Smartsheet:
                      </p>
                      <img
                        src="https://raw.githubusercontent.com/MattGyverLee/developr/master/client/public/images/SmartsheetTable.png"
                        alt="A view from smartsheet"
                        width="100%"></img>
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

export default Tabular;
