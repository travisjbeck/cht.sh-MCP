#!/usr/bin/env node

// cht.sh MCP Server for Cursor
// Implements the Model Context Protocol for cht.sh integration

import axios from 'axios';
import readline from 'readline';
import pkg from '../package.json'; // Import package.json

// MCP protocol types
interface MCPRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
}

interface MCPResponse {
  id: string | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  jsonrpc: "2.0";
}

interface MCPToolDescription {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// cht.sh base URL
const CHT_SH_BASE_URL = 'https://cht.sh/';

// Define the cht.sh tool
const chtShTool: MCPToolDescription = {
  name: "cht_sh",
  description: "Look up programming language cheat sheets, examples and documentation from cht.sh",
  inputSchema: {
    type: "object",
    properties: {
      language: {
        type: "string",
        description: "Programming language (e.g., javascript, python, go)"
      },
      query: {
        type: "string",
        description: "Query or topic to search for (e.g., map, regex, sort)"
      },
      options: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Optional parameters (e.g., 'T' for text-only, 'q' for quiet)"
      }
    },
    required: ["query"]
  }
};

// Fetch data from cht.sh
async function fetchFromChtSh(query: string, language?: string, options: string[] = []): Promise<string> {
  let url = `${CHT_SH_BASE_URL}`;
  
  if (language) {
    url += `${language}/`;
  }
  
  url += query;
  
  // Add options as query parameters
  if (options.length > 0) {
    url += `?${options.join('&')}`;
  }
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'curl/7.68.0', // Mimic curl for consistent cht.sh behavior
      },
    });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch from cht.sh: ${error.message}`);
    }
    throw error;
  }
}

// Handle MCP requests
async function handleRequest(request: MCPRequest): Promise<MCPResponse> {
  // Handle initialization request
  if (request.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        protocolVersion: "2024-03-26",
        capabilities: {
          tools: {
            listChanged: true
          }
        },
        serverInfo: {
          name: "chtsh-mcp-server",
          version: pkg.version // Use dynamic version from package.json
        }
      }
    };
  }

  // Handle tool listing request
  if (request.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        tools: [chtShTool]
      }
    };
  }

  // Handle ping request
  if (request.method === "ping") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: { status: "ok", timestamp: Date.now() }
    };
  }
      
  // Handle tool call
  if (request.method === "callTool") {
    try {
      const params = request.params as { 
        name: string;
        arguments: { 
          language?: string; 
          query: string; 
          options?: string[] 
        } 
      };
      
      if (params.name !== "cht_sh") {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: `Tool not found: ${params.name}`
          }
        };
      }

      const { language, query, options } = params.arguments;
      
      if (!query) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32602,
            message: "Invalid params: query is required"
          }
        };
      }
      
      const result = await fetchFromChtSh(
        query,
        language,
        options || []
      );
      
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          content: [
            {
              type: "text",
              text: result
            }
          ]
        }
      };
    } catch (error: any) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : "Unknown error"
        }
      };
    }
  }
      
  // Default case for unknown methods
  return {
    jsonrpc: "2.0",
    id: request.id,
    error: {
      code: -32601,
      message: `Method not found: ${request.method}`
    }
  };
}

// Set up readline interface for STDIO
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Log the start of the server (this goes to stderr which won't interfere with the protocol)
console.error("cht.sh MCP Server starting...");

// Handle incoming STDIO requests
rl.on('line', async (line) => {
  try {
    console.error(`Received: ${line}`);
    const request: MCPRequest = JSON.parse(line);
    const response = await handleRequest(request);
    const responseJson = JSON.stringify(response);
    console.error(`Sending: ${responseJson}`);
    process.stdout.write(responseJson + '\n');

    // If this was an initialize request, handle the initialized notification from client
    if (request.method === "initialize") {
      console.error("Waiting for initialized notification...");
    }
  } catch (error: any) {
    console.error("Error processing request:", error);
    const errorResponse: MCPResponse = {
      id: null,
      jsonrpc: "2.0",
      error: {
        code: -32700,
        message: "Parse error",
        data: error instanceof Error ? error.message : "Unknown error"
      }
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
