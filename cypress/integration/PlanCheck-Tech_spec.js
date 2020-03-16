describe("Basic Loading and Nav: Tech", function() {
  beforeEach(() => {
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
  });
  it("Selectors Initialize and reset", function() {
    cy.get("#makeChoices").should("not.exist");
  });
});
