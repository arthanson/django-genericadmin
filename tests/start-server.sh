#!/bin/bash
set -e

YELLOW='\033[0;33m'
RESET='\033[0m' # No Color

DJANGO_VERSION=${1:-1.7} # first Django version with migrations

if [[ $DJANGO_VERSION = 1.* ]]; then
    default_python_version=3.4
elif [[ $DJANGO_VERSION = 2.* ]] || [[ $DJANGO_VERSION = 3.* ]]; then
    default_python_version=3.7
elif [[ $DJANGO_VERSION = 4.* ]]; then
    default_python_version=3.9
else
    default_python_version=3.12
fi

PYTHON_VERSION=${2:-$default_python_version}

tag=genericadmin-tests:$DJANGO_VERSION

printf "$YELLOW%s$RESET\n" "build server (Django version $DJANGO_VERSION)"
sudo docker build --tag $tag --build-arg DJANGO_VERSION=$DJANGO_VERSION --build-arg PYTHON_VERSION=$PYTHON_VERSION -f tests/Dockerfile .

./tests/stop-server.sh --if-started

printf "$YELLOW%s$RESET\n" "run server (Django version $DJANGO_VERSION)"
sudo docker run -it -d --name genericadmin-tests --rm -p 127.0.0.1:8000:8000 $tag
