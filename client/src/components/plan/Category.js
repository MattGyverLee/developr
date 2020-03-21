import React, { Fragment } from "react";
import DetailsForm from "./DetailsForm";
import GroupDetails from "./Group";
import { findSortOrder } from "../utilities/sort";
import { getColor, calcAlpha } from "../utilities/color";

export default function Category(props) {
  //console.log(props.category);
  // TODO: Load Colors into form
  const depth = 1;
  const color = getColor(props.category.color, calcAlpha(depth));
  return (
    <Fragment>
      <div className="card border-success mb-2">
        <h4 style={{ backgroundColor: color }} className="card-header">
          {props.category.label}
        </h4>
        {findSortOrder(props.category.category_has_competencies_of).map(
          competency => (
            <DetailsForm
              key={competency.id}
              competency={competency}
              color={props.category.color}
              depth={depth + 1}
            />
          )
        )}
        {findSortOrder(props.category.has_group).map(group => (
          <GroupDetails
            key={group.id}
            group={group}
            color={props.category.color}
            depth={depth + 1}
          />
        ))}
      </div>
    </Fragment>
  );
}
