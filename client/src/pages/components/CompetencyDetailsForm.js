import React, { Fragment } from "react";
import { Form, Row, Col, Label, FormGroup } from "reactstrap";

export default function CompetencyDetailsForm(props) {
  //console.log(props.competency);

  const TargetCompetency = () => {
    if (props.competency.target_competency.length > 0) {
      return props.competency.target_competency[0].label;
    } else {
      return null;
    }
  };

  const AssessmentCriteria = () => {
    if (props.competency.assessment_criteria.length > 0) {
      return props.competency.assessment_criteria[0].label;
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
      return 0;
    }
  };

  const GetSuggestion = () => {
    const level = getProgress();
    switch (level) {
      case 0:
        if (props.competency.lv0_activity) {
          return props.competency.lv0_activity[0].label;
        } else {
          return "Competency Not Selected";
        }
        break;
      case 1:
        if (props.competency.lv1_activity) {
          return props.competency.lv1_activity[0].label;
        } else {
          return "Undefined";
        }
        break;
      case 2:
        if (props.competency.lv2_activity.length > 0) {
          return props.competency.lv2_activity[0].label;
        } else {
          return "Undefined";
        }
        break;
      case 3:
        if (props.competency.lv3_activity.length > 0) {
          return props.competency.lv3_activity[0].label;
        } else {
          return "Undefined";
        }
        break;
      case 4:
        if (props.competency.lv4_activity.length > 0) {
          return props.competency.lv4_activity[0].label;
        } else {
          return "Undefined";
        }
        break;
      case 5:
        if (props.competency.lv5_activity.length > 0) {
          return props.competency.lv5_activity[0].label;
        } else {
          return "Undefined";
        }
      default: {
        return "";
      }
    }
  };
  /* <Input
                    type="textarea"
                    name="text"
                    id="TarComp"
                    disabled="true"
                    placeholder={TargetCompetency()}
                  /> */

  //console.log(props.competency.has_lv2activities[0].label);
  return (
    <Fragment>
      <div className="card border-primary py-1 my-0 mx-3">
        <h4 className="card-header py-1 my-0">{props.competency.label}</h4>
        <div className="card card-body my-0 py-1 ml-3">
          <Form>
            <Row>
              {TargetCompetency() && (
                <Col className="mx-0">
                  <FormGroup className="my-0 mx-0">
                    <Label for="TarComp"> Target Competency: </Label>
                    <div id="TarComp">{TargetCompetency()}</div>
                  </FormGroup>
                </Col>
              )}
              {AssessmentCriteria() && (
                <Col className="my-0 mx-0">
                  <FormGroup className="my-0 mx-0">
                    <Label for="AssessCrit">Assessment Criteria: </Label>
                    <div id="AssessCrit">{AssessmentCriteria()}</div>
                  </FormGroup>
                </Col>
              )}
              <Col className="my-0 mx-0">
                <FormGroup className="my-0 mx-0">
                  <Label for="SuggestionBox">Suggested Activity: </Label>
                  <div id="SuggestionBox">{GetSuggestion(2)}</div>
                </FormGroup>
              </Col>
              <Col className="my-0 mx-0">
                <FormGroup className="my-0 mx-0">
                  <Label for="ProgDrop">Progress: </Label>
                  <br />
                  <select id="ProgDrop" name="progress" defaultValue="3">
                    <option value="0">Not Selected</option>
                    <option value="1">Learner</option>
                    <option value="2">Practitioner</option>
                    <option value="3">Guide</option>
                    <option value="4">Expert</option>
                    <option value="5">Thought Leader</option>
                  </select>
                </FormGroup>
              </Col>
              {/*               <Col>
                <FormGroup className="my-0 mx-0">
                  <Label for="Progress">Comments:</Label>
                  <textarea
                    className="form-control"
                    id="comments"
                    rows="3"></textarea>
                </FormGroup>
              </Col> */}
              <Col>
                <FormGroup>
                  <Label for="Progress">Planned Activities:</Label>
                  <textarea class="form-control" id="plans" rows="3"></textarea>
                </FormGroup>
              </Col>
              <Col>
                <FormGroup>
                  <Label for="Progress">Mentor</Label>
                  <textarea class="form-control" id="email" rows="1"></textarea>
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
