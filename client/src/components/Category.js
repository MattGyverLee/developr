import React, { Fragment } from "react";
import CompetencyDetailsForm from "./CompetencyDetailsForm";
import GroupDetail from "./CompetencyGroup";

export default function Category(props) {
  //console.log(props.category);
  // TODO: Load Colors into form
  return (
    <Fragment>
      <div className="card border-success mb-3">
        <h4 bgcolor={props.category.color} className="ml-3">
          {props.category.label}
        </h4>
        {props.category.category_has_competencies_of.map(competency => (
          <CompetencyDetailsForm key={competency.id} competency={competency} />
        ))}
        {props.category.has_group.map(group => (
          <GroupDetail key={group.id} group={group} />
        ))}
      </div>
    </Fragment>
  );
}
