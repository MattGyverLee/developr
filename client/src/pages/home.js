import React, { Fragment } from "react";

function Home() {
  return (
    <Fragment>
      <div className="container">
        <h2>Home</h2>
        <p>
          The Smartsheet tracking system proposed to SIL by SIL Language
          Technology (see this
          <a href="https://docs.google.com/presentation/d/1txg7l2dUgdztKL5IbflcE9PPaBcLfaT9n-BRY3fMA7w/present?slide=id.p1">
            {" "}
            <u>Presentation</u>
          </a>{" "}
          and{" "}
          <a href="http://bit.ly/SILGROWTHPLAN">
            <u>Example Sheet</u>
          </a>
          ) was simple and straightforward. Each domain would create a single
          agreed-upon plan. All users in the domain would use the same plan (or
          a translated copy) and the plan would grow with them. Domain leaders
          could update the wording of the competencies from a single location,
          and all users would see the changes immediately. As customizations
          (terminology, re-weighting, reorganization, additions and deletions)
          were requested for different entities and situations, it quickly
          became clear that we might have almost as many templates as users, and
          so the "simple" Smartsheet system would no longer be efficient to
          administer for other domains.
        </p>
        <p>
          By using well-supported tools, a small group of developers could
          develop a system that is still simple for the user, hiding the
          complexity of customization while still allowing cross-comparison
          between organzations. This website is a mockup (built over the last
          two months) to showcase some of the things that might be achieved with
          a custom-built growth plan tracking system.
        </p>
        <p>
          <i>
            <b>Note:</b> While the system is already connected to a database, it
            is currently only read-only. Changes made to the worksheets will not
            be saved.
          </i>
        </p>
        <p>
          Choose a domain, plan and milestone from the dropboxes above and then
          choose a view from the menu.{" "}
        </p>
      </div>
    </Fragment>
  );
}

export default Home;
