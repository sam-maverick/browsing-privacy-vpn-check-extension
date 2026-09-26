const readline = require('readline');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const fs = require('fs');

const SERVICE = 'webserverlocal.service';
const UNIT_FILE = `/etc/systemd/system/${SERVICE}`;
const PROGRAMS = ['/usr/local/bin/webserverlocal.py', '/usr/local/bin/webserverlocal.sh'];
const SERVICE_USER = 'websrvloc';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
const ask = (question) => new Promise(resolve => rl.question(question, resolve));

const RunCommand = async (command) => {
    try {
        const result = await exec(command);
        if (result.stdout.trim() != '')  console.log(result.stdout);
        if (result.stderr.trim() != '')  console.error(result.stderr);
    } catch (err) {
        console.error(`Command failed: ${command}`);
        if (err.stdout) console.error(err.stdout);
        console.error(err.stderr || err.message);
        process.exit(1);
    }
};

const DoUninstall = async () => {
    if (process.getuid() !== 0) {
        console.error('ATTENTION: You need to re-run this script with sudo');
        process.exit(1);
    }

    const answer = (await ask('This will stop and remove the local VPN status web server (service, programs, and the websrvloc user). Type Y/y to continue.\n')).trim().toLowerCase();
    rl.close();
    if (answer !== 'y') {
        console.log('Uninstall cancelled.');
        process.exit(0);
    }

    // 1. Stop and remove the service first, so nothing is running as websrvloc
    if (fs.existsSync(UNIT_FILE)) {
        console.log('Stopping and disabling service');
        await RunCommand(`systemctl disable --now ${SERVICE}`);
        console.log('Removing service configuration');
        fs.unlinkSync(UNIT_FILE);
        await RunCommand('systemctl daemon-reload');
    } else {
        console.log('Service not installed, skipping');
    }
    // Clears any leftover "failed" state; harmless if there is none
    await RunCommand(`systemctl reset-failed ${SERVICE} 2>/dev/null || true`);

    // 2. Remove the programs
    for (const file of PROGRAMS) {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log(`Removed ${file}`);
        } else {
            console.log(`${file} not found, skipping`);
        }
    }

    // 3. Remove the user and group (some distros delete the group together with the user)
    console.log(`Removing ${SERVICE_USER} user and group`);
    await RunCommand(`if id ${SERVICE_USER} >/dev/null 2>&1; then userdel ${SERVICE_USER}; fi`);
    await RunCommand(`if getent group ${SERVICE_USER} >/dev/null; then groupdel ${SERVICE_USER}; fi`);

    console.log('\nUninstall complete.');
    console.log('Note: webserverlocal.py in this folder still contains your VPN interface name. Restore it with "git checkout webserverlocal.py" if you want the original.');
};

DoUninstall().catch(err => {
    console.error(`Uninstall failed: ${err.message}`);
    process.exit(1);
});
