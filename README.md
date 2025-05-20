# chtsh-mcp-server

Model Context Protocol server for cht.sh integration with Cursor.

## Description

This project provides an MCP (Model Context Protocol) server that allows integration with cht.sh for use within the Cursor editor. It enables cht.sh to act as a context provider for Cursor.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/travisjbeck/cht.sh-MCP.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd cht.sh-MCP
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Build the project:
    ```bash
    npm run build
    ```

## Usage

### Running the server locally

To start the server directly using Node:

```bash
npm start
```

The server will automatically select the first available port between 3000 and 3100. The selected port will be logged to the console, e.g.:

```
cht.sh MCP Server running on port 3005
```

### Running as an npx command

You can run it directly using:

```bash
npx chtsh-mcp-server
```

This will also select the first available port between 3000 and 3100 and log the port in use.

### Configuration in Cursor

Add the server to Cursor's MCP configuration. This is likely located in `~/.cursor/config.json` or can be accessed through Cursor's settings.

**Option 1: Local Development**

If you are running the server locally from the built `dist` directory:

```json
{
  "mcpServers": {
    "cht.sh MCP (Local)": {
      "command": "node",
      "args": [
        "/path/to/your/chtsh-mcp-server/dist/index.js"
      ]
    }
  }
}
```
Replace `/path/to/your/chtsh-mcp-server/` with the actual absolute path to this project on your system.

**Option 2: Using npx (published to npm)**

If you want to run it via `npx`:

```json
{
  "mcpServers": {
    "cht.sh MCP (npx)": {
      "command": "npx",
      "args": [
        "chtsh-mcp-server"
      ]
    }
  }
}
```

## Development

To run the server in development mode with automatic reloading on changes:

```bash
npm run dev
```

This uses `ts-node` to execute the TypeScript source directly.

## Scripts

-   `npm run build`: Compiles TypeScript to JavaScript in the `dist` directory.
-   `npm run start`: Starts the production server from the `dist` directory.
-   `npm run dev`: Starts the development server using `ts-node`.

## License

This project is licensed under the MIT License. 