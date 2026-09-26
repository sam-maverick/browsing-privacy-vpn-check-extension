const license = '\
Copyright (c) 2024 Sam Maverick, https://github.com/sam-maverick/\n\
\n\
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\
\n\
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\
\n\
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\
\n';

const readline = require('readline');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const execFile = promisify(require('child_process').execFile);
const fs = require('fs');
const path = require('path');
const util = require('util');
const fsp = require('fs').promises;

var vpnname = '';

const rl1a = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ReplaceInFile = async (basePath, filename, regexpFind, replacement) => {
    const fullpath = path.join(basePath, filename);
    try {
        const data = await fsp.readFile(fullpath, 'utf8');
        if (!regexpFind.test(data)) {
            throw new Error(`pattern ${regexpFind} not found`);
        }        
        await fsp.writeFile(fullpath, data.replace(regexpFind, replacement));
        console.log(`${filename} updated`);
    } catch (err) {
        console.error(`Error when updating ${filename}: ${err}`);
        process.exit(1);
    }
};

function isRoot() {
    return process.getuid() === 0;
}

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




const DoInstall = async () => {
    rl1a.question(`This software comes with a MIT license, which reads as:\n\n${license}\nDo you accept the above license? Type Y/y if so.\n`, async (confirmlicense) => {
        confirmlicense = confirmlicense.trim().toLowerCase();
        if (confirmlicense != 'y') {
            console.error('License rejected. Bye!');
            process.exit(1);
        }
        if ( ! isRoot()) {
            console.error('ATTENTION: You need to re-run this script with sudo');
            process.exit(1);
        }
        console.log('\n\nThis will guide you through the installation of browsing-privacy-vpn-check-extension. It will work on Linux. If you are on Windows or Mac, you may want to instead check the source of this script and perform the steps manually.');

        // STEP 1

        rl1a.question(`I first need to know how your system identifies your anonymity VPN. Please bring the VPN up now, then press Enter when ready.\n`, async (confirm) => {
            const connectionNames = await exec('ip -brief link');

            console.error(connectionNames.stderr);
            console.log(`These are possible candidates:\n${connectionNames.stdout}`);

            rl1a.question(`Now type the interface name that corresponds to your VPN from the list of candidates. Pick one that disappears when the VPN is disconnected (you can compare with "ip -brief link" while it's off).\n`, async (enteredvpnname) => {
                vpnname = enteredvpnname.trim();
                console.log(`You entered ${enteredvpnname}`);
                
                if (!vpnname) {
                    console.error('Network interface name cannot be empty');
                    process.exit(1);
                }
                const interfaces = await fsp.readdir('/sys/class/net');
                if (!interfaces.includes(vpnname)) {
                    console.error(`No network interface named "${vpnname}". Available: ${interfaces.join(', ')}`);
                    process.exit(1);
                }                
                const line = `PARAMETER_VPN_INTERFACE = ${JSON.stringify(vpnname)}`;
                await ReplaceInFile(__dirname, 'webserverlocal.py', /PARAMETER_VPN_INTERFACE = ".*"/, () => line);

                console.log('Copying programs to /usr/local/bin');
                await RunCommand(`install -o root -g root -m 755 "${path.join(__dirname, 'webserverlocal.py')}" /usr/local/bin/`);
                await RunCommand(`install -o root -g root -m 755 "${path.join(__dirname, 'webserverlocal.sh')}" /usr/local/bin/`);

                console.log('Adding websrvloc user and group');
                await RunCommand(`getent group websrvloc >/dev/null || groupadd --system websrvloc`);
                await RunCommand(`id websrvloc >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin --gid websrvloc websrvloc`);

                console.log('Configuring service');
                await RunCommand(`install -o root -g root -m 644 "${path.join(__dirname, 'service_template.service')}" /etc/systemd/system/webserverlocal.service`);                

                console.log('Reloading systemctl daemon to apply configuration');
                await RunCommand('systemctl daemon-reload');
                console.log('Enabling service for automatic startup with system boot');
                await RunCommand('systemctl enable webserverlocal.service');
                console.log('Starting service');
                await RunCommand('systemctl restart webserverlocal.service');

                console.log('Checking that the service stays up');
                await new Promise(resolve => setTimeout(resolve, 3000));
                await RunCommand('systemctl is-active webserverlocal.service');                

                console.log('\nInstallation complete. The service is running.');
                console.log('To see its logs: journalctl -u webserverlocal');
                console.log('To see its logs in real time: journalctl -u webserverlocal -f');
                console.log('To uninstall: sudo node uninstall.linux.js');
                                
                // Finished
                rl1a.close();
            });
        });
    });

        



}

DoInstall();
