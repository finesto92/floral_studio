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
    const state = await loadDbState();
    json(response, 200, state);
    return;
  }

  if (request.method === "POST") {
    const body = await readJson(request);
    await saveDbState(body);
    json(response, 200, body);
    return;
  }

  json(response, 405, { error: "Method not allowed" });
}

async function loadDbState() {
  const [products, deliveryAreas, orders, customers, notifications] = await Promise.all([
    supabaseRequest("floral_products?select=*&order=id.asc", { method: "GET" }),
    supabaseRequest("floral_delivery_areas?select=*&order=id.asc", { method: "GET" }),
    supabaseRequest("floral_orders?select=*&order=created_at.desc", { method: "GET" }),
    supabaseRequest("floral_customers?select=*&order=name.asc", { method: "GET" }),
    supabaseRequest("floral_notifications?select=*&order=created_at.desc", { method: "GET" }),
  ]);

  return {
    products: products.map(fromProductRow),
    deliveryAreas: deliveryAreas.map(fromDeliveryAreaRow),
    orders: orders.map(fromOrderRow),
    customers: customers.map(fromCustomerRow),
    notifications: notifications.map(fromNotificationRow),
  };
}

async function saveDbState(state) {
  await Promise.all([
    upsertRows("floral_products", state.products.map(toProductRow)),
    upsertRows("floral_delivery_areas", state.deliveryAreas.map(toDeliveryAreaRow)),
    upsertRows("floral_orders", state.orders.map(toOrderRow)),
    upsertRows("floral_customers", state.customers.map(toCustomerRow)),
    upsertRows("floral_notifications", state.notifications.map(toNotificationRow)),
  ]);
}

async function upsertRows(table, rows) {
  if (!rows.length) return;
  await supabaseRequest(`${table}?on_conflict=id`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
}

function toProductRow(product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description || "",
    image_url: product.imageUrl || "",
    min_budget: product.minBudget || 0,
    budgets: product.budgets || [],
    pickup: product.pickup !== false,
    delivery: product.delivery !== false,
    available: product.available !== false,
    visible: product.visible !== false,
    images: product.images || [],
    updated_at: new Date().toISOString(),
  };
}

function fromProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    minBudget: row.min_budget,
    budgets: row.budgets || [],
    pickup: row.pickup,
    delivery: row.delivery,
    available: row.available,
    visible: row.visible,
    images: row.images || [],
  };
}

function toDeliveryAreaRow(area) {
  return {
    id: area.id,
    name: area.name,
    fee: area.fee,
    fee_label: area.feeLabel || "",
    available: area.available !== false,
    updated_at: new Date().toISOString(),
  };
}

function fromDeliveryAreaRow(row) {
  return {
    id: row.id,
    name: row.name,
    fee: row.fee,
    feeLabel: row.fee_label,
    available: row.available,
  };
}

function toOrderRow(order) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    paid: order.paid || false,
    created_at: order.createdAt || new Date().toISOString(),
    category: order.category,
    category_id: order.categoryId,
    budget: order.budget || 0,
    color: order.color || "",
    mood: order.mood || "",
    occasion: order.occasion || "",
    card_message: order.cardMessage || "",
    reference_image_name: order.referenceImageName || "",
    fulfillment: order.fulfillment,
    receive_date: order.receiveDate,
    receive_time: order.receiveTime,
    delivery_area: order.deliveryArea || "",
    delivery_fee: order.deliveryFee || 0,
    delivery_fee_label: order.deliveryFeeLabel || "",
    delivery_address: order.deliveryAddress || "",
    delivery_detail: order.deliveryDetail || "",
    delivery_request: order.deliveryRequest || "",
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    recipient_name: order.recipientName || "",
    recipient_phone: order.recipientPhone || "",
    request_note: order.requestNote || "",
    order_memo: order.orderMemo || "",
    updated_at: new Date().toISOString(),
  };
}

function fromOrderRow(row) {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    paid: row.paid,
    createdAt: row.created_at,
    category: row.category,
    categoryId: row.category_id,
    budget: row.budget,
    color: row.color,
    mood: row.mood,
    occasion: row.occasion,
    cardMessage: row.card_message,
    referenceImageName: row.reference_image_name,
    fulfillment: row.fulfillment,
    receiveDate: row.receive_date,
    receiveTime: row.receive_time,
    deliveryArea: row.delivery_area,
    deliveryFee: Number(row.delivery_fee || 0),
    deliveryFeeLabel: row.delivery_fee_label,
    deliveryAddress: row.delivery_address,
    deliveryDetail: row.delivery_detail,
    deliveryRequest: row.delivery_request,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    requestNote: row.request_note,
    orderMemo: row.order_memo,
  };
}

function toCustomerRow(customer) {
  return {
    id: customer.id,
    customer_key: customer.key,
    name: customer.name,
    phone: customer.phone,
    memo: customer.memo || "",
    tags: customer.tags || [],
    order_ids: customer.orderIds || [],
    updated_at: new Date().toISOString(),
  };
}

function fromCustomerRow(row) {
  return {
    id: row.id,
    key: row.customer_key,
    name: row.name,
    phone: row.phone,
    memo: row.memo,
    tags: row.tags || [],
    orderIds: row.order_ids || [],
  };
}

function toNotificationRow(notification) {
  return {
    id: notification.id,
    target: notification.target,
    message: notification.message,
    status: notification.status || "success",
    created_at: parseKoreanDateTime(notification.createdAt) || new Date().toISOString(),
  };
}

function fromNotificationRow(row) {
  return {
    id: row.id,
    target: row.target,
    message: row.message,
    status: row.status,
    createdAt: new Date(row.created_at).toLocaleString("ko-KR"),
  };
}

function parseKoreanDateTime(value) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
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

  const text = await result.text();
  return text ? JSON.parse(text) : null;
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
