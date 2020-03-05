import React, { Fragment } from "react";
import { useQuery } from "@apollo/react-hooks";
import { GET_COMPETENCY } from "../queries";

function LoadEditCompetency(props) {
  /*   const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10); */
  // const [selectedCompetency, setSelectedCompetency] = React.useState("-1");

  const { loading, data, error } = useQuery(
    GET_COMPETENCY(props.competencyId),
    {
      variables: {
        /*       first: rowsPerPage,
      offset: rowsPerPage * page,
      orderBy: orderBy + "_" + order */
      }
    }
  );

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
              <span className="text-muted">Competency: </span>
              {c.label || "Undefined"}
            </div>
            <div>
              {" "}
              <span className="text-muted">ID: </span>
              {c.id || "Undefined"}
            </div>
            <div>
              <span className="text-muted">Default Weight: </span>
              {c.default_weight || "Undefined"}
            </div>
            <div>
              <span className="text-muted">Default Expiration: </span>
              {c.default_expiration || "Undefined"}
            </div>
            <div>
              <span className="text-muted">Target Competency: </span>
              <textarea
                cols="100"
                defaultValue={c.target_competency[0].label || "Undefined"}
              />
            </div>
            <div>
              <span className="text-muted">Assessment Criteria: </span>
              <textarea
                cols="100"
                defaultValue={c.assessment_criteria[0].label || "Undefined"}
              />
            </div>
            <div>
              <span className="text-muted">Level 1 Activity: </span>
              <textarea
                cols="100"
                defaultValue={
                  (c.lv1_activity[0] && c.lv1_activity[0].label) || "Undefined"
                }
              />
            </div>
            <div>
              <span className="text-muted">Level 2 Activity: </span>
              <textarea
                cols="100"
                defaultValue={
                  (c.lv2_activity[0] && c.lv2_activity[0].label) || "Undefined"
                }
              />
            </div>
            <div>
              <span className="text-muted">Level 3 Activity: </span>
              <textarea
                cols="100"
                defaultValue={
                  (c.lv3_activity[0] && c.lv3_activity[0].label) || "Undefined"
                }
              />
            </div>
            <div>
              <span className="text-muted">Level 4 Activity: </span>
              <textarea
                cols="100"
                defaultValue={
                  (c.lv4_activity[0] && c.lv4_activity[0].label) || "Undefined"
                }
              />
            </div>
            <div>
              <span className="text-muted">Level 5 Activity: </span>
              <textarea
                cols="100"
                defaultValue={
                  (c.lv5_activity[0] && c.lv5_activity[0].label) || "Undefined"
                }
              />
            </div>
          </Fragment>
        ))}
    </div>
  );
}
export default LoadEditCompetency;
