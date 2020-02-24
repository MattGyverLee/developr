import React, { Fragment } from "react";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

function LoadEditCompetency(props) {
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [selectedCompetency, setSelectedCompetency] = React.useState("-1");

  const GET_COMPETENCY = gql`
    query EditCompetency {
      Competency(id: "${props.competencyId}") {
          id
          label
          default_weight
          default_expiration
          short_name {
            label
          }
          target_competency {
            label
          }
          assessment_criteria {
            label
          }
          lv1_activity {
            label
          }
          lv2_activity {
            label
          }
          lv3_activity {
            label
          }
          lv4_activity {
            label
          }
          lv5_activity {
            label
          }
        }
      }
    
  `;

  const { loading, data, error } = useQuery(GET_COMPETENCY, {
    variables: {
      first: rowsPerPage,
      offset: rowsPerPage * page,
      orderBy: orderBy + "_" + order
    }
  });

  return (
    <div>
      {loading && !error && <p>Loading...</p>}
      {error && !loading && <p>Error</p>}
      {data &&
        data.Competency &&
        data.Competency.length > 0 &&
        !loading &&
        !error &&
        data.Competency.map(c => (
          <Fragment>
            <div>
              Competency:
              {c.label || "Undefined"}
            </div>

            <div>ID: {c.id || "Undefined"}</div>
            <div>
              Default Weight:
              {c.default_weight || "Undefined"}
            </div>
            <div>Default Expiration: {c.default_expiration || "Undefined"}</div>
            <div>
              Target Competency:{" "}
              <textarea width="300px">
                {c.target_competency[0].label || "Undefined"}
              </textarea>
            </div>
            <div>
              Assessment Criteria:{" "}
              <textarea>
                {c.assessment_criteria[0].label || "Undefined"}
              </textarea>
            </div>
            <div>
              Level 1 Activity:{" "}
              <textarea>{c.lv1_activity[0].label || "Undefined"}</textarea>
            </div>
            <div>
              Level 2 Activity:{" "}
              <textarea>{c.lv2_activity[0].label || "Undefined"}</textarea>
            </div>
            <div>
              Level 3 Activity:{" "}
              <textarea>{c.lv3_activity[0].label || "Undefined"}</textarea>
            </div>
            <div>
              Level 4 Activity:{" "}
              <textarea>{c.lv4_activity[0].label || "Undefined"}</textarea>
            </div>
            <div>
              Level 5 Activity:{" "}
              <textarea>{c.lv5_activity[0].label || "Undefined"}</textarea>
            </div>
          </Fragment>
        ))}
    </div>
  );
}
export default LoadEditCompetency;
