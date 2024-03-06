#!/bin/bash
set -e

YELLOW='\033[0;33m'
RESET='\033[0m' # No Color

if [ "$1" = "--if-started" ]; then
    if [ ! "$(sudo docker ps -a | grep genericadmin-tests)" ]; then
        exit 0
    fi
fi

printf "$YELLOW%s$RESET\n" "stop server"
sudo docker kill genericadmin-tests
