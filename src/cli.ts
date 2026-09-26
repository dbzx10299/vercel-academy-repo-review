import { Command } from 'commander';
import { runSandboxLifecycle } from './sandbox-lifecycle';
import { analyzeRepository } from './analyze';
 
function isValidGitHubRepoUrl(input: string): boolean {
  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(input);
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
 
    try {
      const lifecycle = await runSandboxLifecycle(repoUrl);
      console.log(`Sandbox: ${lifecycle.sandboxName}`);
      console.log(`Collected ${lifecycle.files.length} file(s) for analysis.`);
 
      if (lifecycle.files.length === 0) {
        console.log('No files matched the interest list; skipping analysis.');
        return;
      }
 
      const review = await analyzeRepository(lifecycle.files);
      console.log(`Overall risk: ${review.overallRisk}`);
      console.log(`Findings: ${review.findings.length}`);
      for (const finding of review.findings) {
        console.log(`  [${finding.severity}] ${finding.summary} (${finding.file})`);
      }
    } catch (error) {
      console.error('Review failed:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  });
 
await program.parseAsync();