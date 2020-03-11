import React, { Fragment } from "react";
import CompetencyDetailsForm from "./CompetencyDetailsForm";
import GroupDetail from "./CompetencyGroup";
import { findSortOrder } from "./sort";

export default function GroupDetails(props) {
  const showCompDetailsForm = input => {
    if (input && input.length > 0) {
      return findSortOrder(input).map(competency => (
        <CompetencyDetailsForm key={competency.id} competency={competency} />
      ));
    }
  };

  const showGroupDetails = input => {
    if (input && input.length > 0) {
      return findSortOrder(input).map(group => (
        <GroupDetail key={group.id} group={group} />
      ));
    }
  };
  /* {showCompDetails(props.group.group_has_competencies_of)} */
  return (
    <Fragment>
      <div className="card border-warning mb-1 mx-3">
        <h4 className="card-header mb-1">{props.group.label}</h4>

        {showCompDetailsForm(props.group.group_has_competencies_of)}
        {showGroupDetails(props.group.has_group)}
      </div>
    </Fragment>
  );
}
