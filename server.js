const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
loadEnv(path.join(root, ".env.local"));

const port = Number(process.env.PORT || 8000);
const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || "";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === "/api/state") {
      await handleStateApi(request, response);
      return;
    }

    serveStatic(url.pathname, response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Internal server error" }));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Floral Studio server running at http://127.0.0.1:${port}/index.html`);
});

async function handleStateApi(request, response) {
  if (!supabaseUrl || !supabaseSecretKey) {
    json(response, 503, { error: "Supabase server configuration is missing." });
    return;
  }

  if (request.method === "GET") {
    const rows = await supabaseRequest("app_state?id=eq.default&select=data", { method: "GET" });
    json(response, 200, rows?.[0]?.data || null);
    return;
  }

  if (request.method === "POST") {
    const body = await readJson(request);
    const saved = await supabaseRequest("app_state", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ id: "default", data: body, updated_at: new Date().toISOString() }),
    });
    json(response, 200, saved?.[0]?.data || body);
    return;
  }

  json(response, 405, { error: "Method not allowed" });
}

async function supabaseRequest(endpoint, options) {
  const result = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${supabaseSecretKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!result.ok) {
    const message = await result.text();
    throw new Error(`Supabase request failed: ${result.status} ${message}`);
  }

  return result.status === 204 ? null : result.json();
}

function serveStatic(urlPath, response) {
  const requested = urlPath === "/" ? "/index.html" : decodeURIComponent(urlPath);
  const resolved = path.normalize(path.join(root, requested));

  if (!resolved.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(resolved, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(resolved)] || "application/octet-stream" });
    response.end(data);
  });
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body ? JSON.parse(body) : null));
    request.on("error", reject);
  });
}

function json(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^"|"$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
