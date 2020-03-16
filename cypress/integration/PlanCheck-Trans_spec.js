describe("Basic Loading and Nav: Trans", function() {
  beforeEach(() => {
    cy.visit("localhost:3000/myPlan");
    // myPlan: Need Domain and Plan
    // Language Technology
    cy.wait(1000);
    cy.get("#DomDrop").select("2");
    cy.wait(1000);
    cy.get("#PlanDrop").select("2");
    cy.wait(1000);
    cy.get("#MilestoneDrop").select("TransCons1");
    cy.wait(1000);
    cy.get("#loading").should("not.exist");
    cy.get("#planTitle").should("contain", "Translation");
  });
  it("Selectors Initialize and reset", function() {
    cy.get("#makeChoices").should("not.exist");
  });
});
