#!/bin/bash
PACKAGE=$1

# Install locally
npm install "$PACKAGE"

# Install inside the container
docker-compose exec app npm install "$PACKAGE"
