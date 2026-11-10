-- Times are Unix epoch milliseconds. Money is whole rupees.

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  intro TEXT NOT NULL DEFAULT '',
  image_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  price INTEGER,
  price_unit TEXT,
  min_order_qty INTEGER,
  min_order_unit TEXT,
  mukhi INTEGER,
  origin TEXT,
  bead_size TEXT,
  certification TEXT,
  lab_name TEXT,
  treatment TEXT,
  ruling_deity TEXT,
  ruling_planet TEXT,
  usage TEXT,
  shape TEXT,
  color TEXT,
  material TEXT,
  -- JSON object of label -> value
  specs TEXT NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  -- JSON array of KV image keys; the first one is the cover
  images TEXT NOT NULL DEFAULT '[]',
  in_stock INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_products_category ON products (category_id, sort_order);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  -- SHA-256 of the secret the customer's device keeps to view or cancel the order
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  coupon_code TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  courier TEXT NOT NULL DEFAULT '',
  tracking_number TEXT NOT NULL DEFAULT '',
  -- Internal; never sent to customers
  admin_note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_orders_created ON orders (created_at);
CREATE INDEX idx_orders_status ON orders (status, created_at);
CREATE INDEX idx_orders_phone ON orders (phone);

-- Snapshot of what was bought, so orders survive product edits and deletes.
CREATE TABLE order_items (
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  price_unit TEXT,
  qty INTEGER NOT NULL,
  PRIMARY KEY (order_id, position)
);

CREATE INDEX idx_order_items_product ON order_items (product_id);

CREATE TABLE order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  status TEXT,
  payment_status TEXT,
  note TEXT NOT NULL DEFAULT '',
  -- 'customer' or the admin's email
  actor TEXT NOT NULL
);

CREATE INDEX idx_order_events_order ON order_events (order_id, created_at);
