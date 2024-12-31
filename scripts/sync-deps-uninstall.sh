#!/bin/bash
PACKAGE=$1

# Install locally
npm uninstall "$PACKAGE"

# Install inside the container
docker-compose exec app npm uninstall "$PACKAGE"
