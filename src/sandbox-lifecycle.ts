import { Sandbox } from '@vercel/sandbox';

const REPO_URL = 'https://github.com/vercel/examples'

export type LifecycleResult = {
  sandboxName: string;
  cloneExitCode: number;
  files: string;
  readmePreview: string;
}

export async function runSandboxLifecycle(repoUrl: string): Promise<LifecycleResult> {
  const sandbox = await Sandbox.create({ persistent: false, timeout: 10 * 60 * 1000 })

  try {
    const clone = await sandbox.runCommand('git', ['clone', '--depth', '1', repoUrl, 'repo'])
    if (clone.exitCode !== 0) {
      throw new Error(`Clone failed: ${await clone.stderr()}`)
    }

    const ls = await sandbox.runCommand('ls', ['-la', 'repo'])

    let readmePreview = '(no README found)'
    const readme = await sandbox.readFileToBuffer({ 'path': 'repo/README.md' })
    if (readme) {
      readmePreview = readme.toString('utf8').slice(0, 300)
    }

    return {
      sandboxName: sandbox.name,
      cloneExitCode: clone.exitCode,
      files: await ls.stdout(),
      readmePreview
    }
  } finally {
    await sandbox.stop()
  }
}

async function main() {
  const result = await runSandboxLifecycle('https://github.com/vercel/examples');
  console.log(result);
}
 
main();