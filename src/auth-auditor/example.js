import Orchestrator from './core/orchestrator.js';

/**
 * Example usage of the Authenticated WCAG Auditing System
 */
async function runExample() {
  const orchestrator = new Orchestrator();

  // Example 1: Scan a public page (no authentication required)
  console.log('=== Example 1: Public Page Scan ===');
  const publicResults = await orchestrator.runAuthenticatedAudit('https://example.com');
  console.log('Public page results:', orchestrator.getAuditSummary(publicResults));

  // Example 2: Scan an authenticated page
  console.log('\n=== Example 2: Authenticated Page Scan ===');
  const credentials = {
    username: 'test@example.com',
    password: 'password123'
  };

  const authResults = await orchestrator.runAuthenticatedAudit(
    'https://lettersmith.ai.umich.edu/dashboard',
    credentials
  );
  
  console.log('Authenticated page results:', orchestrator.getAuditSummary(authResults));

  // Example 3: Export results in different formats
  console.log('\n=== Example 3: Export Results ===');
  
  // JSON format
  const jsonExport = orchestrator.exportResults(authResults, 'json');
  console.log('JSON export length:', jsonExport.length);
  
  // Summary format
  const summaryExport = orchestrator.exportResults(authResults, 'summary');
  console.log('Summary:', summaryExport);
  
  // HTML report
  const htmlReport = orchestrator.exportResults(authResults, 'html');
  console.log('HTML report generated');

  // Example 4: Handle errors gracefully
  console.log('\n=== Example 4: Error Handling ===');
  const errorResults = await orchestrator.runAuthenticatedAudit('https://nonexistent-site.com');
  if (errorResults.error) {
    console.log('Handled error:', errorResults.error);
  }

  return authResults;
}

// Run the example
runExample().catch(console.error);

export { runExample };
