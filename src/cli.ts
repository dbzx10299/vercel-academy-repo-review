import { Command } from 'commander';
import { runSandboxLifecycle } from './sandbox-lifecycle';
import { analyzeRepository } from './analyze';
import { parseTestFailures } from './test-runner';
 
function isValidGitHubRepoUrl(input: string): boolean {
  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(input);
}
 
async function time<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    return await fn();
  } finally {
    console.log(`  ⏱  ${label}: ${Date.now() - startedAt}ms`);
  }
}
 
async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.warn(
      `⚠  ${label} failed: ${error instanceof Error ? error.message : error}`
    );
    return fallback;
  }
}
 
const program = new Command();
 
program
  .name('repo-review')
  .description('Clone and review a GitHub repository in a Sandbox')
  .version('0.1.0');
 
program
  .command('review <repoUrl>')
  .description('Run a Sandbox review against a GitHub repository URL')
  .action(async (repoUrl: string) => {
    if (!isValidGitHubRepoUrl(repoUrl)) {
      console.error(`Invalid GitHub repository URL: ${repoUrl}`);
      console.error('Expected format: https://github.com/<owner>/<repo>');
      process.exitCode = 2;
      return;
    }
 
    console.log(`Reviewing ${repoUrl}...`);
    const totalStart = Date.now();
 
    try {
      const lifecycle = await time('sandbox lifecycle', () => runSandboxLifecycle(repoUrl));
 
      const aiReview = lifecycle.files.length === 0
        ? { overallRisk: 'low' as const, findings: [] }
        : await time('ai analysis', () =>
            safe(
              'ai analysis',
              () => analyzeRepository(lifecycle.files),
              { overallRisk: 'low' as const, findings: [] }
            )
          );
 
      const testFindings = safe(
        'test parsing',
        async () =>
          parseTestFailures(
            `${lifecycle.testResult.stdout}\n${lifecycle.testResult.stderr}`
          ),
        []
      );
 
      const resolvedTestFindings = await testFindings;
 
      const combined = {
        overallRisk: resolvedTestFindings.length > 0 ? 'high' as const : aiReview.overallRisk,
        aiFindings: aiReview.findings,
        testFindings: resolvedTestFindings
      };
 
      console.log(`\nOverall risk: ${combined.overallRisk}`);
      console.log(`AI findings: ${combined.aiFindings.length}`);
      for (const finding of combined.aiFindings) {
        console.log(`  [${finding.severity}] ${finding.summary} (${finding.file})`);
      }
      console.log(`Test findings: ${combined.testFindings.length}`);
      for (const finding of combined.testFindings) {
        console.log(`  [${finding.severity}] ${finding.details}`);
      }
 
      console.log(`\nTotal: ${Date.now() - totalStart}ms`);
    } catch (error) {
      console.error('Review failed:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  });
 
await program.parseAsync();