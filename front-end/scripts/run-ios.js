/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const iosDir = path.join(projectRoot, 'ios');
const workspaceDataFile = path.join(
  iosDir,
  'Underboss.xcworkspace',
  'contents.xcworkspacedata'
);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: options.cwd ?? projectRoot,
    env: { ...process.env, ...(options.env ?? {}) },
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

function pickSimulatorName() {
  const result = spawnSync('xcrun', ['simctl', 'list', 'devices', 'available', '-j'], {
    encoding: 'utf8',
  });
  if (result.status !== 0 || !result.stdout) return null;

  let data;
  try {
    data = JSON.parse(result.stdout);
  } catch {
    return null;
  }

  const allDevices = Object.values(data.devices ?? {}).flat();
  const iphones = allDevices.filter(
    (d) => d && d.isAvailable && typeof d.name === 'string' && d.name.includes('iPhone')
  );

  const booted = iphones.find((d) => d.state === 'Booted');
  if (booted?.name) return booted.name;

  const first = iphones[0];
  return first?.name ?? null;
}

const wantDevice = process.argv.includes('--device') || process.env.IOS_DEVICE === '1';

// Self-heal: if the xcworkspace metadata is missing (common after accidental deletions), regenerate it.
if (!fs.existsSync(workspaceDataFile)) {
  console.log('[ios] Missing xcworkspace metadata; running pod install…');
  run('pod', ['install'], { cwd: iosDir });
}

if (wantDevice) {
  // Device installs require code signing + ios-deploy.
  run('npx', ['react-native', 'run-ios']);
} else {
  // Simulator builds do not require code signing and are the most reliable one-command flow.
  const simulator = pickSimulatorName();
  if (simulator) {
    run('npx', ['react-native', 'run-ios', '--simulator', simulator]);
  } else {
    // Fallback: let RN CLI choose.
    run('npx', ['react-native', 'run-ios']);
  }
}
