import React, { Component, Fragment } from "react";

const GQErrors = error => {
  try {
    if (error && error.graphQLErrors.length > 0) {
      return (
        <div>
          <pre>
            {error.graphQLErrors.map(({ message }, i) => (
              <span key={i}>{message}</span>
            ))}
          </pre>
        </div>
      );
    }
  } catch (error) {
    return <div>No further Details available.</div>;
  }
};

function DisplayError(error) {
  return (
    <Fragment>
      <h4>Error: Is NEo4j Running?</h4> {GQErrors(error)}
    </Fragment>
  );
}

export default DisplayError;
