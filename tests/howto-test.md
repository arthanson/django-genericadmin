How to test
===========

## Prerequisites

- Python
- Docker

## Prepare environment

    python3 -m venv .venv~
    source .venv~/bin/activate

    pip install pytest-playwright
    playwright install-deps
    playwright install chromium

## Run tests

    ./tests/run-tests.sh
