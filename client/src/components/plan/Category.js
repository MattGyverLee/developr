import React, { Fragment } from "react";
import DetailsForm from "./DetailsForm";
import GroupDetail from "./Group";
import { findSortOrder } from "../utilities/sort";

export default function Category(props) {
  //console.log(props.category);
  // TODO: Load Colors into form
  return (
    <Fragment>
      <div className="card border-success mb-3">
        <h4 bgcolor={props.category.color} className="ml-3">
          {props.category.label}
        </h4>
        {findSortOrder(props.category.category_has_competencies_of).map(
          competency => (
            <DetailsForm key={competency.id} competency={competency} />
          )
        )}
        {findSortOrder(props.category.has_group).map(group => (
          <GroupDetail key={group.id} group={group} />
        ))}
      </div>
    </Fragment>
  );
}
