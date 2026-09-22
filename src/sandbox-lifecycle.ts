import { Sandbox } from '@vercel/sandbox';

const REPO_URL = 'https://github.com/vercel/examples'
 
async function main() {
  const sandbox = await Sandbox.create({
    persistent: false,
    timeout: 10 * 60 * 1000
  });
  console.log(`Sandbox created: ${sandbox.name}`);
 
  const clone = await sandbox.runCommand(
    'git',
    [
      'clone',
      '--depth',
      '1',
      REPO_URL,
      'repo'
    ]
  )

  console.log(`clone exit code: ${clone.exitCode}`)

  if (clone.exitCode !== 0) {
    console.error(`clone failed ${await clone.stderr()}`)
  } else {
    console.log(`Cloned ${REPO_URL} into repo`)
  }

  await sandbox.stop()
}
 
main();