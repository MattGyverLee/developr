import React, { Fragment } from "react";
import BadgeCompetency from "./BadgeCompetency";

export default function BadgeGroup(props) {
  console.log(props);
  // TODO: Load Colors into form
  return (
    <Fragment>
      <div className="card border-warning mb-1 mx-3">
        <h4 className="ml-3">
          {props.group.label} -
          <small className="muted-text"> {props.group.id}</small>
        </h4>
        {props.group.group_has_competencies_of.map(competency => (
          <BadgeCompetency
            key={competency.id}
            competency={competency}
            user={props.user}
            milestone={props.milestone}
            target={props.target}
            details={props.details}
            planId={props.planId}
          />
        ))}
      </div>
    </Fragment>
  );
}
