import React, { Fragment } from "react";
import CompetencyDetails from "./CompetencyDetails";

export default function Category(props) {
  // console.log(props.category);
  return (
    <Fragment>
      <h3>{props.category.label}</h3>
      <hr />
      {props.category.category_has_competencies_of.map(competency => (
        <CompetencyDetails key={competency.id} competency={competency} />
      ))}
    </Fragment>
  );
}
