#!/bin/bash

cd "$(dirname "$0")" || exit 1

echo "webserverlocal.sh: Initializing"

exec python3 -u ./webserverlocal.py

#journalctl -u webserverlocal         # full history
#journalctl -u webserverlocal -f      # follow live, like tail -f
