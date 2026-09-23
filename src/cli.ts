import { Command } from 'commander';
import { runSandboxLifecycle } from './sandbox-lifecycle';
 
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
      const result = await runSandboxLifecycle(repoUrl);
      console.log(`Sandbox: ${result.sandboxName}`);
      console.log(`Clone exit code: ${result.cloneExitCode}`);
      console.log(`Files:\n${result.files}`);
      console.log(`README preview:\n${result.readmePreview}`);
    } catch (error) {
      console.error('Review failed:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  });
 
await program.parseAsync();