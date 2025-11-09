#!/usr/bin/env node

const { spawn } = require('child_process');
const waitOn = require('wait-on');

console.log('Starting Vite dev server...');

// Start Vite
const vite = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

// Wait for Vite to be ready, then start Electron
waitOn({
  resources: ['http://localhost:5000'],
  timeout: 30000,
}).then(() => {
  console.log('\nVite is ready! Starting Electron...\n');
  
  const electron = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  electron.on('close', (code) => {
    console.log(`Electron exited with code ${code}`);
    vite.kill();
    process.exit(code);
  });
}).catch((err) => {
  console.error('Error waiting for Vite:', err);
  vite.kill();
  process.exit(1);
});

process.on('SIGINT', () => {
  vite.kill();
  process.exit(0);
});
