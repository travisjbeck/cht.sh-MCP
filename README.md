# chtsh-mcp-server

Model Context Protocol server for cht.sh integration with Cursor.

## Description

This project provides an MCP (Model Context Protocol) server that allows integration with cht.sh for use within the Cursor editor or any other MCP-compatible client. It enables you to search for programming language cheat sheets, examples, and documentation directly within your editor.

## Features

- Search for programming language documentation
- Get cheat sheets for common tasks
- Find examples for specific functions or methods
- Access programming language tricks and best practices
- Supports all languages available on cht.sh

## Installation

1. **Using npx (recommended):**
   ```bash
   npx chtsh-mcp-server
   ```

2. **Global installation:**
   ```bash
   npm install -g chtsh-mcp-server
   chtsh-mcp-server
   ```

3. **Clone and build from source:**
   ```bash
   git clone https://github.com/travisjbeck/cht.sh-MCP.git
   cd cht.sh-MCP
   npm install
   npm run build
   npm start
   ```

## Configuration in Cursor

### Using the Settings UI (Recommended)

1. Open Cursor and go to `Settings > Cursor Settings > MCP` 
2. Click `+ Add new global MCP server`
3. Fill in the fields:
   - **Name**: `cht.sh`
   - **Type**: `command`
   - **Command**: `npx -y chtsh-mcp-server`
4. Click `Add`

### Manual Configuration (Alternative)

Create or edit the file `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "cht.sh": {
      "command": "npx",
      "args": ["-y", "chtsh-mcp-server"]
    }
  }
}
```

For project-specific configuration, create a `.cursor/mcp.json` file in your project root with the same structure.

## Usage Examples

Once configured in Cursor, you can use the cht.sh tool in Chat/Agent mode:

**Basic usage:**
```
Can you show me the Python syntax for list comprehension?
```

**Specify language explicitly:**
```
Show me JavaScript async/await examples from cht.sh
```

**Specific function lookup:**
```
How do I use the map function in Ruby? Check cht.sh
```

## Troubleshooting

### "No tools available" or Orange Indicator in Cursor

If you see an orange indicator in Cursor and "No tools available":

1. **Restart Cursor** completely (quit and reopen)
2. Try using explicitly npx with the -y flag: `npx -y chtsh-mcp-server`
3. Check Cursor's logs via `Help > Toggle Developer Tools` and look at the console

### Communication Issues

If you suspect problems with the stdio communication:

1. Try running the server manually to see any error output:
   ```bash
   npx chtsh-mcp-server
   ```
2. Make sure no firewall or antivirus is blocking the process
3. Try the latest version: `npx -y chtsh-mcp-server@latest`

### Common Errors

- **"Cannot find module"**: Run with npx -y to automatically install dependencies
- **"Port already in use"**: This is fine, the server will automatically find an open port
- **API errors**: Check your internet connection; the server needs to reach cht.sh

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `ts-node` to execute the TypeScript source directly with auto-reloading.

### Building

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist` directory.

### Structure

- `src/index.ts`: Main server code
- The server implements JSON-RPC 2.0 over stdio transport for MCP communication

## License

This project is licensed under the MIT License. 