# dev-tools

This repository contains a collection of useful developer tools. Currently, it features a **Webhook Testing Tool** designed to help developers test webhook integrations by providing a unique URL to capture and inspect incoming requests, along with other general-purpose utilities.

## Features

-   **Webhook Testing Tool:**
    -   Generate unique webhook URLs.
    -   Capture and inspect incoming HTTP requests (headers, body, query parameters, method).
    -   Configure custom responses (status code, body, headers) for the webhook URL.
    -   Requests and configurations are stored temporarily (currently using Redis with expiration).
    -   Simple UI to view captured requests and manage configurations.
-   **UUID Generation:** Generate universally unique identifiers (UUIDs).
-   **Random String Generation:** Generate random strings of configurable length.
-   **AES Encryption/Decryption:** Encrypt and decrypt data using AES (Advanced Encryption Standard) with multiple key lengths.

## Prerequisites

Before deploying this application, ensure you have the following installed:

-   Node.js (v18 or later recommended)
-   npm or yarn or pnpm
-   A running Redis instance that the application can connect to.

If you plan to use the Docker deployment method, you will also need:

-   Docker
-   Docker Compose

## Deployment Guide

This project can be deployed in a couple of ways: by building and running the Next.js application directly, or by using Docker and Docker Compose.

### Method 1: Deploying with Docker and Docker Compose (Recommended)

This method is recommended for containerized environments and simplifies managing the application and its dependencies (like Redis).

1.  **Clone the repository:**

        ```bash
        git clone https://github.com/Zixties60/dev-tools.git

    cd dev-tools
    ```

2.  **Review Dockerfile and Docker Compose file:**
    This project includes a `Dockerfile` and a `docker-compose.yml` file configured for production.

    -   The `Dockerfile` (located at `/Users/zixties/Documents/Coding/dev-tools/Dockerfile`) sets up the Node.js environment, installs dependencies, builds the Next.js application, and prepares a lean production image.
    -   The `docker-compose.yml` (located at `/Users/zixties/Documents/Coding/dev-tools/docker-compose.yml`) defines the `dev-tools` application service and a `redis` service, linking them together on a dedicated network.

    You can review these files to understand the build process and service configuration. The provided `docker-compose.yml` is set up to use the `Dockerfile` in the current directory.

3.  **Configure Environment Variables (for Docker Compose):**
    The `docker-compose.yml` file is already configured to pass the `REDIS_URL` to the application container. It expects the Redis service to be named `redis`.

    If you need to customize other environment variables, you can create a `.env` file in the project root (same directory as `docker-compose.yml`). Docker Compose will automatically load variables from this file.

    ```dotenv:.env
    # .env (for docker-compose)

    If your Redis requires a password or is on a different host/port, update the `REDIS_URL` accordingly. If using the `redis` service defined in the `docker-compose.yml`, the hostname should be `redis`.

    ```

4.  **Build and run with Docker Compose:**
    Navigate to the directory containing `docker-compose.yml` and `Dockerfile`, then run:

    ```bash
    docker compose up --build -d
    ```

    -   `--build`: Builds the application service image (named `dev-tools` in your `docker-compose.yml`) before starting.
    -   `-d`: Runs the containers in detached mode (in the background).

    This command will build the Next.js image, pull the Redis image, and start both services.

5.  **Access the application:**
    The application should be available at `http://localhost:3000`.

6.  **Stopping the application:**
    To stop the running containers, run:

    ```bash
    docker compose down
    ```

### Method 2: Deploying the Next.js App Directly

This method is suitable for traditional server environments or platforms that support Node.js applications.

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Zixties60/dev-tools.git
    cd dev-tools
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or yarn install
    # or pnpm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root of the project. You **must** provide the connection URL for your Redis instance.

    ```dotenv
    # .env.local
    REDIS_URL="redis://your_redis_host:your_redis_port"
    # Example for local Redis: REDIS_URL="redis://localhost:6379"
    # Example with password: REDIS_URL="redis://:your_password@your_redis_host:your_redis_port"
    ```

    Replace `"redis://your_redis_host:your_redis_port"` with the actual connection string for your Redis instance.

4.  **Build the application:**

    ```bash
    npm run build
    # or yarn build
    # or pnpm build
    ```

    This command compiles the Next.js application for production.

5.  **Start the application:**
    ```bash
    npm start
    # or yarn start
    # or pnpm start
    ```
    The application will start on the port specified by the `PORT` environment variable (defaulting to 3000). You can access it in your browser at `http://localhost:3000` (or the configured port).
