/**
 * E2E: Load app, add Sample XY table, add Linear regression analysis, run, assert result.
 * @spec PRISM-WKF-001, PRISM-ANA-004, PRISM-GPH-002
 */
describe('App and linear regression flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads the app and shows sidebar', () => {
    cy.get('aside[aria-label="Project navigation"]').should('be.visible');
    cy.get('button[aria-label="Add table"]').should('be.visible');
    cy.get('button[aria-label="New from sample XY data"]').should('be.visible');
  });

  it('adds Sample XY table, adds linear regression, runs and shows result', () => {
    cy.get('button[aria-label="New from sample XY data"]').click();
    cy.get('.sidebar-item').contains('Sample XY').should('exist');
    cy.get('button[aria-label="Select table Sample XY table"]').click();

    cy.get('div[role="region"][aria-label="Table view"]').should('be.visible');
    cy.get('button[aria-label="Add analysis"]').click();
    cy.get('ul[role="listbox"]').within(() => {
      cy.get('button[role="option"]').contains('linear regression').click();
    });

    cy.get('button[aria-label="Select analysis linear_regression"]').click();
    cy.get('div[role="region"][aria-label="Analysis panel"]').should('be.visible');
    cy.get('button[aria-label="Run analysis"]').click();
    cy.get('button', { timeout: 5000 }).contains('Run').should('be.visible');
    cy.get('[role="alert"]').should('not.exist');
    cy.get('table[aria-label="Linear regression results"]', { timeout: 5000 }).should('be.visible');
  });
});
