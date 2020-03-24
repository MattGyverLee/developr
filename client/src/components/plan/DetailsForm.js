import React, { Fragment } from "react";
import { Form, Row, Col, Label, FormGroup } from "reactstrap";
import { getColor, calcAlpha } from "../utilities/color";
import getScore2 from "../milestone/Competency";

export default function CompetencyDetailsForm(props) {
  //console.log(props.competency);

  const TargetCompetency = () => {
    if (props.competency.target_competency.length > 0) {
      var targText = props.competency.target_competency[0].label;
      return (
        <Col className="mx-0">
          <FormGroup className="my-0 mx-0">
            <Label for="TarComp"> Target Competency: </Label>
            <div id="TarComp">{targText}</div>
          </FormGroup>
        </Col>
      );
    } else {
      return null;
    }
  };

  const AssessmentCriteria = () => {
    var acText = "";
    if (props.competency.assessment_criteria.length > 0) {
      acText = props.competency.assessment_criteria[0].label;
      return (
        <Col className="my-0 mx-0">
          <FormGroup className="my-0 mx-0">
            <Label for="AssessCrit">Assessment Criteria: </Label>
            <div id="AssessCrit">{acText}</div>
          </FormGroup>
        </Col>
      );
    } else {
      return null;
    }
  };

  const getProgress = () => {
    var relevantProgress = "-1";
    const user = props.user;
    /* try { */
    if (
      user &&
      user.length > 0 &&
      user[0].has_progress_root &&
      user[0].has_progress_root.length > 0
    ) {
      const progressList = user[0].has_progress_root[0].child_progress;
      relevantProgress = progressList.filter(
        progress => progress.competency_progress[0].id === props.competency.id
      );
      console.log(relevantProgress);
      if (relevantProgress.length > 0) {
        return relevantProgress[0].currentLevel;
      } else {
        return -1;
      }
    }
    /* } catch (error) {
      return "-1";
    } */
  };

  const GetSuggestion = () => {
    const level = getProgress();
    var outText = "";
    switch (level) {
      case -1:
        outText = "Not Selected";
        break;
      case 0:
        if (
          props.competency.lv0_activity &&
          props.competency.lv0_activity.length > 0
        ) {
          outText = props.competency.lv0_activity[0].label;
        }
        break;
      case 1:
        if (
          props.competency.lv1_activity &&
          props.competency.lv1_activity.length > 0
        ) {
          outText = props.competency.lv1_activity[0].label;
        }
        break;
      case 2:
        if (
          props.competency.lv2_activity &&
          props.competency.lv2_activity.length > 0
        ) {
          outText = props.competency.lv2_activity[0].label;
        }
        break;
      case 3:
        if (
          props.competency.lv3_activity &&
          props.competency.lv3_activity.length > 0
        ) {
          outText = props.competency.lv3_activity[0].label;
        }
        break;
      case 4:
        if (
          props.competency.lv4_activity &&
          props.competency.lv4_activity.length > 0
        ) {
          outText = props.competency.lv4_activity[0].label;
        }
        break;
      case 5:
        if (
          props.competency.lv5_activity &&
          props.competency.lv5_activity.length > 0
        ) {
          outText = props.competency.lv5_activity[0].label;
        }
        break;
      default: {
        outText = "";
      }
    }
    if (outText !== "") {
      return (
        <Col className="my-0 mx-0">
          <FormGroup className="my-0 mx-0">
            <Label for="SuggestionBox">Suggested Activities: </Label>
            <div id="SuggestionBox">{outText}</div>
          </FormGroup>
        </Col>
      );
    } else return null;
  };

  /* <Input
                    type="textarea"
                    name="text"
                    id="TarComp"
                    disabled="true"
                    placeholder={TargetCompetency()}
                  /> */

  //console.log(props.competency.has_lv2activities[0].label);

  const color = getColor(props.color, calcAlpha(props.depth));
  return (
    <Fragment>
      <div className="card border-primary py-1 mb-1 mx-2">
        <h4
          style={{ backgroundColor: color }}
          className="card-header py-1 my-0">
          {props.competency.label} -{" "}
          {props.competency.link && props.competency.link !== "./" ? (
            <a href={props.competency.link} target="new">
              <u>External Resources</u>
            </a>
          ) : (
            <a href="./" target="new">
              <u>Resources TBA</u>
            </a>
          )}
        </h4>
        <div className="card card-body my-0 py-1 ml-3">
          <Form>
            <Row>
              {TargetCompetency()}
              {AssessmentCriteria()}
              {GetSuggestion()}
              <Col>
                <FormGroup className="my-0 mx-0">
                  <Label for="Progress">Comments:</Label>
                  <textarea
                    className="form-control"
                    id="comments"
                    rows="5"
                    defaultValue="This area is the workspace for mentees and mentorees and can display as much or as little information as desired. Extra details could be moved to collapsible sections."></textarea>
                </FormGroup>
              </Col>
              <Col>
                <FormGroup>
                  <Label for="Progress">Planned Activities:</Label>
                  <textarea
                    className="form-control"
                    id="plans"
                    rows="3"
                    defaultValue="This control would be a list of activities and target dates related to progress towards the next level."></textarea>
                  <Label>Projected Completion Date</Label>
                  <input type="date" defaultValue="2020-03-14" />{" "}
                  <Label>Completed: </Label>{" "}
                  <input id="actCheck" type="checkbox" checked={true} />
                  <br />
                  <img
                    src="https://raw.githubusercontent.com/MattGyverLee/developr/master/client/public/images/btnPlus.png"
                    height="15px"
                  />{" "}
                  <Label>Add an activity</Label>
                </FormGroup>
              </Col>

              <Col>
                <FormGroup>
                  <Label for="Progress">Artifacts/Proofs</Label>
                  <br />
                  <Label>
                    This area would allow you to link documents from Google
                    Drive that serve as proof of assessment or details.
                  </Label>
                  <br />
                  <a href="./">
                    <u>Relevant Personal Document</u>
                  </a>
                  <br />
                  <img
                    src="https://raw.githubusercontent.com/MattGyverLee/developr/master/client/public/images/btnPlus.png"
                    height="15px"
                  />{" "}
                  <Label>Add a document</Label>
                </FormGroup>
              </Col>
              <Col>
                <FormGroup>
                  <Label for="Progress">Mentor Approval</Label>
                  <div>
                    <textarea
                      className="form-control"
                      id="email"
                      rows="1"
                      defaultValue="Joe Mentor"></textarea>
                    <br />
                    <label></label>
                    <Label for="Progress">Mentor Approval: </Label>{" "}
                    <input id="appCheck" type="checkbox" checked={true} />{" "}
                    <input type="date" defaultValue="2020-03-14" />
                  </div>
                  <img
                    src="https://raw.githubusercontent.com/MattGyverLee/developr/master/client/public/images/btnPlus.png"
                    height="15px"
                  />{" "}
                  <Label>Add a mentor</Label>
                </FormGroup>
              </Col>
              <Col className="my-0 mx-0">
                <FormGroup className="my-0 mx-0">
                  <Label for="ProgDrop">Progress: </Label>
                  <br />
                  {props.progressNames.length === 0 && (
                    <select
                      id={"progDrop" + props.competency.id}
                      name="progress"
                      defaultValue={getProgress().toString()}>
                      <option value="-1">Not Selected</option>
                      <option value="0">0. Learner</option>
                      <option value="1">1. Practitioner</option>
                      <option value="2">2. Guide</option>
                      <option value="3">3. Expert</option>
                      <option value="4">4. Thought Leader</option>
                    </select>
                  )}
                  {props.progressNames.length > 0 && (
                    <select
                      id={"progDrop" + props.competency.id}
                      name="progress"
                      defaultValue={getProgress().toString()}>
                      {props.progressNames.map(name => (
                        <option value={name.order.toString()}>
                          {name.order >= 0 && name.order.toString() + ". "}
                          {name.label}
                        </option>
                      ))}
                    </select>
                  )}
                </FormGroup>
              </Col>
            </Row>
          </Form>
        </div>
      </div>
    </Fragment>
  );
}

/* 
              <Form>
                <Form.Group as="row">
                  <Form.Control as="select">
                    <option>Choose...</option>
                    <option>...</option>
                  </Form.Control>
                </Form.Group>
              </Form>
*/
/*     <td>{props.competency.has_lv0_activities[0].label}</td>
            <td>{props.competency.has_lv1_activities.label}</td>
            <td>{props.competency.has_lv2_activities.label}</td>
            <td>{props.competency.has_lv3_activities.label}</td>
            <td>{props.competency.has_lv4_activities.label}</td> */
