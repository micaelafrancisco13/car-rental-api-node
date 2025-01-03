# Car Rental API Node

## Running the App Locally

To start this app locally, follow these steps:

1. **Start the Containers**

   Run the following command in the root of the project to build and start the containers:
    ```shell
    docker-compose up --build --no-cache -d
    ```
   
2. **Verify the Containers**

   Ensure that both the **app** and **db** containers are successfully running:
   - Use `docker-ps` to check the status of the containers.

3. **Switch to the `develop` Branch**

   After verifying the containers, switch to the `develop` branch by running the following command:
   ```shell
   git checkout develop
   ```
4. **Updating Database Schema (On Changes to `prisma/schema.prisma`)**

   If you make local changes to `prisma/schema.prisma`, you must generate and apply a new migration afterward:    
   Run the following command in the root project terminal:
    ```shell
    scripts/db-apply-new-migration.sh <name-of-migration>
    ```
   Replace `<name-of-migration>` with a descriptive name for your migration.


## Managing Dependencies

### Installing npm Packages
To install new npm packages and sync them with the container:
```bash
scripts/sync-deps-install.sh <name-of-npm-package>
```
Replace `<name-of-npm-package>` with the name of the package you want to install.

### Uninstalling npm Packages
To uninstall npm packages and sync the changes with the container:
```bash
scripts/sync-deps-uninstall.sh <name-of-npm-package>
```
Replace `<name-of-npm-package>` with the name of the package you want to uninstall.


## Notes
- Ensure you have [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) and [Git](https://git-scm.com/downloads/win) installed on your system before running these commands.
- The _scripts_ directory contains helper scripts for managing migrations and dependencies.
