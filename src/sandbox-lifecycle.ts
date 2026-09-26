import { Sandbox } from '@vercel/sandbox';
import { detectPackageManager } from './test-runner';
 
const INTERESTING_PATHS = [
  'repo/package.json',
  'repo/src/index.ts',
  'repo/src/app.ts',
  'repo/lib/auth.ts'
];
 
const SNAPSHOT_ID = process.env.SANDBOX_SNAPSHOT_ID;
 
async function createSandbox(): Promise<{ sandbox: Sandbox; usedSnapshot: boolean }> {
  if (!SNAPSHOT_ID) {
    console.warn('SANDBOX_SNAPSHOT_ID is not set; using a default Sandbox.');
    const sandbox = await Sandbox.create({ persistent: false, timeout: 10 * 60 * 1000 });
    return { sandbox, usedSnapshot: false };
  }
 
  const sandbox = await Sandbox.create({
    source: { type: 'snapshot', snapshotId: SNAPSHOT_ID },
    persistent: false,
    timeout: 10 * 60 * 1000
  });
  return { sandbox, usedSnapshot: true };
}
 
export type TestResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  packageManager: string;
};
 
export type LifecycleResult = {
  sandboxName: string;
  usedSnapshot: boolean;
  cloneExitCode: number;
  files: Array<{ path: string; content: string }>;
  testResult: TestResult;
};
 
export async function runSandboxLifecycle(repoUrl: string): Promise<LifecycleResult> {
  const { sandbox, usedSnapshot } = await createSandbox();
 
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
 
    const pm = await detectPackageManager(sandbox);
    const install = await sandbox.runCommand(pm.install);
    if (install.exitCode !== 0) {
      throw new Error(`Install failed: ${await install.stderr()}`);
    }
    const test = await sandbox.runCommand(pm.test);
 
    return {
      sandboxName: sandbox.name,
      usedSnapshot,
      cloneExitCode: clone.exitCode,
      files,
      testResult: {
        exitCode: test.exitCode,
        stdout: await test.stdout(),
        stderr: await test.stderr(),
        packageManager: pm.name
      }
    };
  } finally {
    await sandbox.stop();
  }
}