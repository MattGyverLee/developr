describe("Basic Loading", function() {
  beforeEach(() => {});
  it("Opens the homepage.", function() {
    cy.visit("localhost:3000");
    cy.wait(2000);
    cy.get("#displayError").should("not.exist");
  });
  it("Opens the playground.", function() {
    cy.visit("localhost:4001/graphql");
    cy.wait(2000);
  });
  it("Selectors Initialize and reset", function() {
    cy.visit("localhost:3000/myPlan");
    // myPlan: Need Domain and Plan
    // Language Technology
    cy.wait(1000);
    cy.get("#DomDrop").select("1");
    cy.wait(1000);
    cy.get("#PlanDrop").select("1");
    cy.wait(1000);
    cy.get("#MilestoneDrop").select("LTCons1");
    cy.wait(1000);
    cy.get("#loading").should("not.exist");
    cy.get("#planTitle").should("contain", "Technologist");
    // cy.screenshot();
    // Translation
    cy.get("#DomDrop").select("2");
    cy.get("#PlanDrop").should("have.value", "-1");
    cy.get("#MilestoneDrop").should("not.exist");
    cy.get("#makeChoices").should("exist");
    cy.get("#PlanDrop").select("2");
    cy.get("#MilestoneDrop").should("exist");
    cy.get("#makeChoices").should("not.exist");
    cy.wait(1000);
    cy.get("#planTitle").should("contain", "Translation");
    //cy.screenshot();
    // VisPlan: Same as above
    cy.visit("localhost:3000/graph");
    cy.wait(2000);
    cy.get("#makeChoices").should("not.exist");
    cy.get("canvas").should("exist");
    //cy.screenshot();

    //Milestones: Need all 3
    cy.visit("localhost:3000/myMilestones");
    cy.get("#makeChoices").should("exist");
    cy.get("#PlanDrop").select("-1");
    cy.get("#makeChoices").should("exist");
  });
  /* it("Opens myPlan.", function() {
    cy.visit("localhost:3000/myPlan");
    cy.wait(2000);
    cy.ex;
  });
  it("Opens myMilestones.", function() {
    cy.visit("localhost:3000/myMilestones");
    cy.wait(2000);
  });
  it("Opens graph.", function() {
    cy.visit("localhost:3000/graph");
    cy.wait(2000);
  }); */
});
