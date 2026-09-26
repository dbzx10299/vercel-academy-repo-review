import { Sandbox } from '@vercel/sandbox';
 
const INTERESTING_PATHS = [
  'repo/package.json',
  'repo/src/index.ts',
  'repo/src/app.ts',
  'repo/lib/auth.ts'
];
 
export type LifecycleResult = {
  sandboxName: string;
  cloneExitCode: number;
  files: Array<{ path: string; content: string }>;
};
 
export async function runSandboxLifecycle(repoUrl: string): Promise<LifecycleResult> {
  const sandbox = await Sandbox.create({ persistent: false, timeout: 10 * 60 * 1000 });
 
  try {
    const clone = await sandbox.runCommand('git', ['clone', '--depth', '1', repoUrl, 'repo']);
    if (clone.exitCode !== 0) {
      throw new Error(`Clone failed: ${await clone.stderr()}`);
    }
 
    const files: Array<{ path: string; content: string }> = [];
 
    for (const fullPath of INTERESTING_PATHS) {
      const content = await sandbox.readFileToBuffer({ path: fullPath });
      if (content) {
        files.push({
          path: fullPath.replace(/^repo\//, ''),
          content: content.toString('utf8')
        });
      }
    }
 
    return {
      sandboxName: sandbox.name,
      cloneExitCode: clone.exitCode,
      files
    };
  } finally {
    await sandbox.stop();
  }
}