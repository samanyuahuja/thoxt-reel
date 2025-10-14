import { spawn } from 'child_process';

console.log('Starting Flask application via Node.js shim...');

// Spawn the Flask app
const flaskProcess = spawn('python3', ['app.py'], {
  env: {
    ...process.env,
    PORT: process.env.PORT || '5000',
    FLASK_ENV: process.env.NODE_ENV === 'development' ? 'development' : 'production'
  },
  stdio: 'inherit', // Forward all output to parent process
  cwd: process.cwd()
});

// Handle Flask process exit
flaskProcess.on('exit', (code, signal) => {
  console.log(`Flask process exited with code ${code} and signal ${signal}`);
  process.exit(code || 0);
});

// Handle errors
flaskProcess.on('error', (error) => {
  console.error('Failed to start Flask process:', error);
  process.exit(1);
});

// Forward signals to Flask process
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, forwarding to Flask...');
  flaskProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, forwarding to Flask...');
  flaskProcess.kill('SIGINT');
});

// Keep the Node process alive
console.log('Node.js shim running, Flask server starting...');
