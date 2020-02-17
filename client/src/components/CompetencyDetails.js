import React from "react";

export default function CompetencyDetails(props) {
  //console.log(props.competency);

  /*  const ShortName = () => {
    if (props.competency.has_short_name.length > 0) {
      return props.competency.has_short_name[0].label;
    } else {
      return "";
    }
  }; */
  const TargetCompetency = () => {
    if (props.competency.has_target_competency.length > 0) {
      return props.competency.has_target_competency[0].label;
    } else {
      return "";
    }
  };
  const AssessmentCriteria = () => {
    if (props.competency.has_assessment_criteria.length > 0) {
      return props.competency.has_assessment_criteria[0].label;
    } else {
      return "";
    }
  };

  const GetSuggestion = level => {
    switch (level) {
      case 0:
        if (props.competency.has_lv0_activities.length > 0) {
          return props.competency.has_lv0_activities[0].label;
        } else {
          return "Competency Not Selected";
        }
        break;
      case 1:
        if (props.competency.has_lv1_activities.length > 0) {
          return props.competency.has_lv1_activities[0].label;
        } else {
          return "Undefined";
        }
        break;
      case 2:
        if (props.competency.has_lv2_activities.length > 0) {
          return props.competency.has_lv2_activities[0].label;
        } else {
          return "Undefined";
        }
        break;
      case 3:
        if (props.competency.has_lv3_activities.length > 0) {
          return props.competency.has_lv3_activities[0].label;
        } else {
          return "Undefined";
        }
        break;
      case 4:
        if (props.competency.has_lv4_activities.length > 0) {
          return props.competency.has_lv4_activities[0].label;
        } else {
          return "Undefined";
        }
        break;
      case 5:
        if (props.competency.has_lv3_activities.length > 0) {
          return props.competency.has_lv4_activities[0].label;
        } else {
          return "Undefined";
        }
      default: {
        return "";
      }
    }
  };
  //console.log(props.competency.has_lv2activities[0].label);
  return (
    <div>
      <h4>{props.competency.label}</h4>
      <table border="0px">
        <thead>
          <tr>
            <th>Target Competencies</th>
            <th>Assessment Criteria</th>
            <th>Suggested Activities</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{TargetCompetency()}</td>
            <td>{AssessmentCriteria()}</td>
            <td>{GetSuggestion(3)}</td>
            <td>
              <select id="progress" name="progress">
                <option value="0">Not Selected</option>
                <option value="1">Learner</option>
                <option value="2">Practitioner</option>
                <option value="3">Guide</option>
                <option value="4">Expert</option>
                <option value="5">Thought LEader</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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
