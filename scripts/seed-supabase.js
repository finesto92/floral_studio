const fs = require("node:fs");
const path = require("node:path");

loadEnv(path.join(__dirname, "..", ".env.local"));

const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const supabaseKey = process.env.SUPABASE_SECRET_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const sampleOrder = {
  id: `sample-${Date.now()}`,
  number: `FS-SAMPLE-${Date.now().toString().slice(-6)}`,
  status: "접수",
  paid: false,
  category: "꽃다발",
  category_id: "bouquet",
  budget: 50000,
  color: "핑크",
  mood: "화사한",
  occasion: "기념일",
  fulfillment: "pickup",
  receive_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  receive_time: "13:00",
  customer_name: "샘플고객",
  customer_phone: "010-0000-0000",
  request_note: "Supabase DB 저장 검증용 샘플 주문",
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  await request("floral_orders", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(sampleOrder),
  });

  const rows = await request(`floral_orders?id=eq.${sampleOrder.id}&select=id,number,customer_name,request_note`, {
    method: "GET",
  });

  console.log(JSON.stringify({ inserted: rows?.[0] || null }, null, 2));
}

async function request(endpoint, options) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      apikey: supabaseKey,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${endpoint} failed: ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^"|"$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
