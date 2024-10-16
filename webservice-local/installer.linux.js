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
const fs = require('fs');
const path = require('path');
const util = require('util');

var vpnname = '';

const rl1a = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});


const ReplaceInFile = async (basePath, filename, regexpFind, replacement) => {
    const fullpath = path.join(__dirname, filename);
    fs.readFile(fullpath, 'utf8', function async (err, data) {
        if (err) {
            console.error(`Error when reading ${filename}: `+err);
            process.exit(1);
        } 
        data = data.replace(regexpFind, replacement);
        fs.writeFile(fullpath, data, function(err) {
            if(err) {
                console.error(`Error when writing ${filename}: `+err);
                process.exit(1);
            }
            console.log(`${filename} updated`);

        });                 
    });
}

function isRoot() {
    return !!process.env.SUDO_UID; // SUDO_UID is undefined when not root
}

const RunCommand = async (command) => {
    const result = await exec(command);
    if (result.stdout.trim() != '')  console.log(result.stdout);
    if (result.stderr.trim() != '')  console.error(result.stderr);    
}




const DoInstall = async () => {
    rl1a.question(`This software comes with a MIT license, which reads as:\n\n${license}\nDo you accept the above license? Type Y/y if so.\n`, async (confirmlicense) => {
        confirmlicense = confirmlicense.trim().toLowerCase();
        if (confirmlicense != 'y') {
            console.error('License rejected. Bye!');
            process.exit(1);
        }
        if ( ! isRoot()) {
            console.error('You need to run this script with sudo');
            process.exit(1);
        }
        console.log('\n\nThis will guide you through the installation of browsing-privacy-vpn-check-extension. It will work on Linux. If you are on Windows or Mac, you may want to instead check the source of this script and perform the steps manually.');

        // STEP 1

        rl1a.question(`I first need to know how your system identifies your anonymity VPN. Please bring the VPN up now, then press Intro when ready.\n`, async (confirm) => {
            const connectionNames = await exec('nmcli --terse --fields NAME connection show --active');

            console.error(connectionNames.stderr);
            console.log(`These are possible candidates:\n${connectionNames.stdout}`);

            rl1a.question(`Now type the name that corresponds to your VPN, inspired from the list of candidates. Spaces and hashes are ok. If you see something like MyVpnProvider #US #1, I recommend to type MyVpnProvider.\n`, async (enteredvpnname) => {
                vpnname = enteredvpnname.trim();
                console.log(`You entered ${enteredvpnname}`);
                await ReplaceInFile (__dirname, 'webserverlocal.py', /PARAMETER_VPN_IDENTIFIER = ".*"/, `PARAMETER_VPN_IDENTIFIER = "${vpnname}"`);

                console.log('Copying programs to /usr/local/bin');
                await RunCommand(`cp "${path.join(__dirname, 'webserverlocal.py')}" /usr/local/bin/`);
                await RunCommand(`cp "${path.join(__dirname, 'webserverlocal.sh')}" /usr/local/bin/`);

                console.log('Adding websrvloc user and group');
                await RunCommand(`groupadd websrvloc`);
                await RunCommand(`useradd websrvloc --gid websrvloc`);

                console.log('Setting ownership of programs');
                await RunCommand(`chown websrvloc:websrvloc /usr/local/bin/webserverlocal.sh`);
                await RunCommand(`chown websrvloc:websrvloc /usr/local/bin/webserverlocal.py`);
                await RunCommand(`chmod u+x /usr/local/bin/webserverlocal.sh`);

                console.log('Configuring service');
                await RunCommand(`cp "${path.join(__dirname, 'service_template.service')}" /etc/systemd/system/webserverlocal.service`);

                console.log('Reloading systemctl daemon to apply configuration');
                await RunCommand('systemctl daemon-reload');
                console.log('Enabling service for automatic statup with system boot');
                await RunCommand('systemctl enable webserverlocal.service');
                console.log('Starting service');
                await RunCommand('systemctl start webserverlocal.service');
                

                // Finished
                rl1a.close();
            });
        });
    });

        



}

DoInstall();
