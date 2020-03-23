import React, { Fragment } from "react";
import { Form, Row, Col, Label, FormGroup } from "reactstrap";
import { getColor, calcAlpha } from "../utilities/color";

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
    try {
      const level =
        props.competency.HAS_USER_PROGRESS_rel[0].Progress.currentLevel;
      return parseInt(level);
    } catch (error) {
      return 1;
    }
  };

  const GetSuggestion = () => {
    const myprogress = getProgress();
    const level = 2;
    var outText = "";
    switch (level) {
      case 0:
        if (props.competency.lv0_activity) {
          outText = props.competency.lv0_activity[0].label;
        }
        break;
      case 1:
        if (props.competency.lv1_activity) {
          outText = props.competency.lv1_activity[0].label;
        }
        break;
      case 2:
        if (props.competency.lv2_activity.length > 0) {
          outText = props.competency.lv2_activity[0].label;
        }
        break;
      case 3:
        if (props.competency.lv3_activity.length > 0) {
          outText = props.competency.lv3_activity[0].label;
        }
        break;
      case 4:
        if (props.competency.lv4_activity.length > 0) {
          outText = props.competency.lv4_activity[0].label;
        }
        break;
      case 5:
        if (props.competency.lv5_activity.length > 0) {
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
                    rows="3"></textarea>
                </FormGroup>
              </Col>
              <Col>
                <FormGroup>
                  <Label for="Progress">Planned Activities:</Label>
                  <textarea
                    className="form-control"
                    id="plans"
                    rows="3"
                    defaultValue="This control would be a list of activities and target dates."></textarea>
                </FormGroup>
              </Col>
              <Col>
                <FormGroup>
                  <Label for="Progress">Mentor(s)</Label>
                  <textarea
                    className="form-control"
                    id="email"
                    rows="3"
                    defaultValue="This field would contain a list of mentors for this competency and allow them to approve an assessment."></textarea>
                </FormGroup>
              </Col>
              <Col>
                <FormGroup>
                  <Label for="Progress">Artifacts/Proofs</Label>
                  <textarea
                    className="form-control"
                    id="email"
                    rows="3"
                    defaultValue="This control would allow you to link documents from Google Drive that serve as proof of assessment or details."></textarea>
                </FormGroup>
              </Col>
              <Col className="my-0 mx-0">
                <FormGroup className="my-0 mx-0">
                  <Label for="ProgDrop">Progress: </Label>
                  <br />
                  <select
                    id={"progDrop" + props.competency.id}
                    name="progress"
                    defaultValue={getProgress()}>
                    <option value="-1">Not Selected</option>
                    <option value="0">Learner</option>
                    <option value="1">Practitioner</option>
                    <option value="2">Guide</option>
                    <option value="3">Expert</option>
                    <option value="4">Thought Leader</option>
                  </select>
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
