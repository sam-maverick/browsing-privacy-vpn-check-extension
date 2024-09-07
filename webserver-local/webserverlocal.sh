#!/bin/bash

cd "$(dirname "$0")"

echo "$(date) webserverlocal.sh: Iniltializing"

python3 ./webserverlocal.py #>> webserverlocal.log 2>> webserverlocal.log

echo "$(date) webserverlocal.sh: Terminating"
