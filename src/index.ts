// cht.sh MCP Server for Cursor
// Implements the Model Context Protocol for cht.sh integration

import express from 'express';
import { createServer } from 'http';
import WebSocket from 'ws';
import axios from 'axios';
import cors from 'cors';

// Define the MCP protocol types
interface MCPRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
}

interface MCPResponse {
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface MCPToolDescription {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// Configure server
const PORT = process.env.PORT || 3000;
const CHT_SH_BASE_URL = 'https://cht.sh/';

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Define the cht.sh tool
const chtShTool: MCPToolDescription = {
  name: "cht.sh",
  description: "Look up programming language cheat sheets, examples and documentation from cht.sh",
  parameters: {
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
        'User-Agent': 'curl/7.68.0',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch from cht.sh: ${error.message}`);
    }
    throw error;
  }
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send tool registration on connection
  const toolRegistration: MCPResponse = {
    id: "registration",
    result: {
      schema: "https://modelcontextprotocol.io/schema.json",
      tools: [chtShTool]
    }
  };
  
  ws.send(JSON.stringify(toolRegistration));
  
  // Handle incoming messages
  ws.on('message', async (data) => {
    let request: MCPRequest;
    
    try {
      request = JSON.parse(data.toString());
    } catch (error) {
      const response: MCPResponse = {
        id: "error",
        error: {
          code: -32700,
          message: "Parse error"
        }
      };
      ws.send(JSON.stringify(response));
      return;
    }
    
    // Process the request
    handleRequest(request)
      .then(response => {
        ws.send(JSON.stringify(response));
      })
      .catch(error => {
        const response: MCPResponse = {
          id: request.id,
          error: {
            code: -32603,
            message: error.message || "Internal error"
          }
        };
        ws.send(JSON.stringify(response));
      });
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Handle MCP requests
async function handleRequest(request: MCPRequest): Promise<MCPResponse> {
  // Handle different methods
  switch (request.method) {
    case "ping":
      return {
        id: request.id,
        result: { status: "ok", timestamp: Date.now() }
      };
      
    case "cht.sh":
      try {
        const { language, query, options } = request.params as { 
          language?: string; 
          query: string; 
          options?: string[] 
        };
        
        if (!query) {
          return {
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
          id: request.id,
          result: {
            content: result,
            mimeType: "text/plain"
          }
        };
      } catch (error) {
        console.error("Error fetching from cht.sh:", error);
        return {
          id: request.id,
          error: {
            code: -32000,
            message: error instanceof Error ? error.message : "Unknown error"
          }
        };
      }
      
    default:
      return {
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      };
  }
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cht.sh-mcp-server' });
});

// Start the server
server.listen(PORT, () => {
  console.log(`cht.sh MCP Server running on port ${PORT}`);
});

// Handle process errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
