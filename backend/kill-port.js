/**
 * Kill process running on port 3000
 * Run this if you get "EADDRINUSE" error
 * Usage: node kill-port.js [port]
 */

const { execSync } = require('child_process');

// Get port from command line argument or use default
const PORT = process.argv[2] || process.env.PORT || 3000;

console.log(`\n🔍 Checking for processes on port ${PORT}...\n`);

try {
  // Find process on Windows
  const result = execSync(`netstat -ano | findstr :${PORT}`, { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  if (result && result.trim()) {
    // Extract PID (last column)
    const lines = result.trim().split('\n');
    const pids = new Set();
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        const parts = trimmedLine.split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && parseInt(pid) > 0) {
          pids.add(pid);
        }
      }
    });
    
    if (pids.size > 0) {
      console.log(`⚠️  Found ${pids.size} process(es) using port ${PORT}:\n`);
      
      let successCount = 0;
      let failCount = 0;
      
      pids.forEach(pid => {
        try {
          console.log(`   🔪 Killing process PID ${pid}...`);
          execSync(`taskkill /F /PID ${pid}`, { 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
          });
          console.log(`   ✅ Process ${pid} terminated successfully`);
          successCount++;
        } catch (err) {
          console.error(`   ❌ Failed to kill process ${pid}`);
          failCount++;
        }
      });
      
      console.log(`\n${'='.repeat(50)}`);
      if (successCount > 0) {
        console.log(`✔️  Successfully killed ${successCount} process(es)`);
        console.log(`✔️  Port ${PORT} is now free!`);
        console.log(`\n🚀 You can now start your server:`);
        console.log(`   cd backend && npm run dev\n`);
      }
      if (failCount > 0) {
        console.log(`⚠️  Failed to kill ${failCount} process(es)`);
        console.log(`   Try running as Administrator\n`);
      }
    } else {
      console.log(`✅ No process found on port ${PORT}. Port is free!\n`);
    }
  } else {
    console.log(`✅ No process found on port ${PORT}. Port is free!\n`);
  }
} catch (err) {
  if (err.status === 1 || err.message.includes('command failed') || err.stderr) {
    console.log(`✅ No process found on port ${PORT}. Port is free!\n`);
  } else {
    console.error(`\n❌ Error: ${err.message}`);
    console.log(`\n💡 Troubleshooting:`);
    console.log(`   1. Make sure you're on Windows`);
    console.log(`   2. Try running as Administrator`);
    console.log(`   3. Manually check: netstat -ano | findstr :${PORT}\n`);
    process.exit(1);
  }
}

