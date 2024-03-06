#!/bin/bash
set -e

YELLOW='\033[0;33m'
RESET='\033[0m' # No Color

for version in 1.7 1.8 1.9 1.9 1.10 1.11 2.0 2.1 2.2 3.0 3.1 3.2 4.0 4.1 4.2 5.0; do
    ./tests/start-server.sh $version
    sleep 1
    
    printf "$YELLOW%s$RESET\n" "run tests on server (Django version $version)"
    pytest

    ./tests/stop-server.sh --if-started
done
