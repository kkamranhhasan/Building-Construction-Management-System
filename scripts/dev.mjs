import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Clean up ports before starting to prevent duplicate zombie processes
const portsToFree = [3000, 5000, 5001, 5002, 5173];
try {
  const pids = execSync(`lsof -ti:${portsToFree.join(',')} 2>/dev/null`, { encoding: 'utf-8' }).trim();
  if (pids) {
    console.log(`[DevRunner] Freeing occupied ports (${portsToFree.join(', ')})...`);
    execSync(`kill -9 ${pids.split('\n').join(' ')} 2>/dev/null || true`);
  }
} catch {
  // No ports to clean
}

const env = {
  ...process.env,
  NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096'
};

const services = [
  { name: 'backend', cwd: path.join(rootDir, 'backend'), cmd: 'npm', args: ['run', 'dev'], color: '\x1b[34m' },
  { name: 'admin  ', cwd: path.join(rootDir, 'admin-dashboard'), cmd: 'npm', args: ['run', 'dev'], color: '\x1b[32m' },
  { name: 'web    ', cwd: path.join(rootDir, 'web'), cmd: 'npm', args: ['run', 'dev'], color: '\x1b[36m' },
];

const children = [];

services.forEach(({ name, cwd, cmd, args, color }) => {
  const child = spawn(cmd, args, {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${color}[${name}]\x1b[0m ${line}`);
      }
    }
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.error(`${color}[${name}]\x1b[31m[err]\x1b[0m ${line}`);
      }
    }
  });

  child.on('exit', (code, signal) => {
    if (signal !== 'SIGTERM' && signal !== 'SIGINT') {
      console.log(`${color}[${name}]\x1b[0m process exited with code ${code}`);
    }
  });

  children.push(child);
});

function cleanup() {
  console.log('\n\x1b[33m[DevRunner] Stopping all services...\x1b[0m');
  for (const child of children) {
    try {
      child.kill('SIGINT');
      setTimeout(() => {
        try { child.kill('SIGKILL'); } catch {}
      }, 1000);
    } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
