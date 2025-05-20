#!/usr/bin/env node
"use strict";
// cht.sh MCP Server for Cursor
// Implements the Model Context Protocol for cht.sh integration
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const readline_1 = require("readline");
// cht.sh base URL
const CHT_SH_BASE_URL = 'https://cht.sh/';
// Set up readline interface for STDIO
const rl = (0, readline_1.createInterface)({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
// Fetch data from cht.sh
async function fetchFromChtSh(query, language, options = []) {
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
        console.error(`Fetching from URL: ${url}`);
        const response = await axios_1.default.get(url, {
            headers: {
                'User-Agent': 'curl/7.68.0', // Mimic curl for consistent cht.sh behavior
            },
        });
        return response.data;
    }
    catch (error) {
        console.error(`Error fetching from cht.sh: ${error.message}`);
        if (axios_1.default.isAxiosError(error)) {
            throw new Error(`Failed to fetch from cht.sh: ${error.message}`);
        }
        throw error;
    }
}
// Define the cht.sh tool
const chtShTool = {
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
// Handle MCP requests
async function handleRequest(request) {
    console.error(`Processing request method: ${request.method}`);
    // Handle initialization request
    if (request.method === "initialize") {
        console.error("Received initialize request");
        return {
            jsonrpc: "2.0",
            id: request.id || null,
            result: {
                protocolVersion: "2024-03-26",
                capabilities: {}, // Simplified empty capabilities object
                serverInfo: {
                    name: "CheatSheet", // Simple name without hyphens
                    version: "1.0.0" // Simple version string
                }
            }
        };
    }
    // Handle 'initialized' notification from client (no response needed)
    if (request.method === "initialized") {
        console.error("Received 'initialized' notification from client. No response will be sent.");
        return null; // No response for notifications
    }
    // Handle tool listing request
    if (request.method === "tools/list") {
        console.error("Received tools/list request");
        return {
            jsonrpc: "2.0",
            id: request.id || null,
            result: {
                tools: [chtShTool]
            }
        };
    }
    // Handle ping request
    if (request.method === "ping") {
        console.error("Received ping request");
        return {
            jsonrpc: "2.0",
            id: request.id || null,
            result: {
                status: "ok",
                timestamp: Date.now()
            }
        };
    }
    // Handle tool call
    if (request.method === "callTool") {
        console.error("Received callTool request");
        try {
            if (!request.params) {
                throw new Error("Missing parameters");
            }
            const params = request.params;
            console.error(`Tool call: ${params.name}, args:`, JSON.stringify(params.arguments));
            if (params.name !== "cht_sh") {
                return {
                    jsonrpc: "2.0",
                    id: request.id || null,
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
                    id: request.id || null,
                    error: {
                        code: -32602,
                        message: "Invalid params: query is required"
                    }
                };
            }
            const result = await fetchFromChtSh(query, language, options || []);
            return {
                jsonrpc: "2.0",
                id: request.id || null,
                result: {
                    content: [
                        {
                            type: "text",
                            text: result
                        }
                    ]
                }
            };
        }
        catch (error) {
            console.error("Error handling callTool:", error);
            return {
                jsonrpc: "2.0",
                id: request.id || null,
                error: {
                    code: -32000,
                    message: error instanceof Error ? error.message : "Unknown error"
                }
            };
        }
    }
    // Default case for unknown methods
    console.error(`Unknown method: ${request.method}`);
    return {
        jsonrpc: "2.0",
        id: request.id || null,
        error: {
            code: -32601,
            message: `Method not found: ${request.method}`
        }
    };
}
// At startup
console.error("cht.sh MCP Server starting...");
// Handle incoming STDIO requests
rl.on('line', async (line) => {
    try {
        console.error(`Received: ${line}`);
        // Validate input is proper JSON
        let request;
        try {
            request = JSON.parse(line);
        }
        catch (e) {
            console.error("Failed to parse JSON:", e);
            const errorResponse = {
                id: null,
                jsonrpc: "2.0",
                error: {
                    code: -32700,
                    message: "Parse error: Invalid JSON"
                }
            };
            process.stdout.write(JSON.stringify(errorResponse) + '\n');
            return;
        }
        // Validate required JSON-RPC 2.0 fields
        if (request.jsonrpc !== "2.0" || !request.method) {
            console.error("Invalid JSON-RPC 2.0 request");
            const errorResponse = {
                id: request.id || null,
                jsonrpc: "2.0",
                error: {
                    code: -32600,
                    message: "Invalid Request: Not a valid JSON-RPC 2.0 request"
                }
            };
            process.stdout.write(JSON.stringify(errorResponse) + '\n');
            return;
        }
        const response = await handleRequest(request);
        if (response) { // Only send a response if one is actually returned
            const responseJson = JSON.stringify(response);
            console.error(`Sending: ${responseJson}`);
            process.stdout.write(responseJson + '\n');
        }
        else {
            console.error("No response to send (notification handled)");
        }
    }
    catch (error) {
        console.error("Error processing request:", error);
        const errorResponse = {
            id: null,
            jsonrpc: "2.0",
            error: {
                code: -32603,
                message: "Internal error",
                data: error instanceof Error ? error.message : "Unknown error"
            }
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
});
// Handle readline close
rl.on('close', () => {
    console.error("cht.sh MCP Server: Input stream closed. Shutting down.");
    process.exit(0);
});
// Error handling for the process
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
// Keep the process alive
process.stdin.resume();
