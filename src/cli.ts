import { Command } from 'commander';
 
const program = new Command();
 
program
  .name('repo-review')
  .description('Clone and review a GitHub repository in a Sandbox')
  .version('0.1.0');
 
program
  .command('review <repoUrl>')
  .description('Run a Sandbox review against a GitHub repository URL')
  .action(async (repoUrl: string) => {
    console.log(`Would review: ${repoUrl}`);
  });
 
await program.parseAsync();

