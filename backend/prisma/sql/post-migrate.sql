-- Run after Prisma migrate: psql $DATABASE_URL -f prisma/sql/post-migrate.sql

-- fabric_returns.avg_weight generated column
ALTER TABLE fabric_returns DROP COLUMN IF EXISTS avg_weight;
ALTER TABLE fabric_returns
  ADD COLUMN avg_weight DECIMAL(10,2)
  GENERATED ALWAYS AS (total_weight / quantity_returned) STORED;

-- sales constraints
ALTER TABLE sales DROP CONSTRAINT IF EXISTS exactly_one_variant;
ALTER TABLE sales ADD CONSTRAINT exactly_one_variant CHECK (
  (fabric_variant_id IS NOT NULL)::int +
  (yarn_variant_id IS NOT NULL)::int = 1
);

ALTER TABLE sales DROP CONSTRAINT IF EXISTS nonzero_quantity;
ALTER TABLE sales ADD CONSTRAINT nonzero_quantity CHECK (quantity != 0);

-- users role consistency
ALTER TABLE users DROP CONSTRAINT IF EXISTS role_link_consistency;
ALTER TABLE users ADD CONSTRAINT role_link_consistency CHECK (
  (role = 'weaver' AND weaver_id IS NOT NULL AND merchant_id IS NULL) OR
  (role = 'merchant' AND merchant_id IS NOT NULL AND weaver_id IS NULL) OR
  (role = 'admin' AND weaver_id IS NULL AND merchant_id IS NULL)
);

-- settled fabric_returns immutability
CREATE OR REPLACE FUNCTION prevent_settled_return_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.payment_id IS NOT NULL THEN
    RAISE EXCEPTION 'fabric_return % is already settled (payment_id=%). Cannot modify.',
      OLD.return_id, OLD.payment_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fabric_return_immutable ON fabric_returns;
CREATE TRIGGER trg_fabric_return_immutable
  BEFORE UPDATE ON fabric_returns
  FOR EACH ROW EXECUTE FUNCTION prevent_settled_return_update();

-- stock snapshot: yarn purchase lines
CREATE OR REPLACE FUNCTION trg_yarn_purchase_line_stock()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE yarn_variants
    SET stock_snapshot = stock_snapshot + NEW.quantity
    WHERE yarn_variant_id = NEW.yarn_variant_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ypline_insert ON yarn_purchase_lines;
CREATE TRIGGER trg_ypline_insert
  AFTER INSERT ON yarn_purchase_lines
  FOR EACH ROW EXECUTE FUNCTION trg_yarn_purchase_line_stock();

-- stock snapshot: yarn given
CREATE OR REPLACE FUNCTION trg_yarn_given_stock()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE yarn_variants
    SET stock_snapshot = stock_snapshot - NEW.quantity
    WHERE yarn_variant_id = NEW.yarn_variant_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_yarn_given_stock ON yarn_given;
CREATE TRIGGER trg_yarn_given_stock
  AFTER INSERT ON yarn_given
  FOR EACH ROW EXECUTE FUNCTION trg_yarn_given_stock();

-- work order status: assigned -> in_progress on first fabric return (not yarn given)
DROP TRIGGER IF EXISTS trg_yarn_given_insert ON yarn_given;
DROP FUNCTION IF EXISTS trg_yarn_given_status();

CREATE OR REPLACE FUNCTION trg_fabric_return_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE work_orders
    SET status = 'in_progress'
    WHERE zig_id = NEW.zig_id AND status = 'assigned';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fabric_return_status ON fabric_returns;
CREATE TRIGGER trg_fabric_return_status
  AFTER INSERT ON fabric_returns
  FOR EACH ROW EXECUTE FUNCTION trg_fabric_return_status();

-- stock snapshot: fabric returns
CREATE OR REPLACE FUNCTION trg_fabric_return_stock()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE fabric_variants
    SET stock_snapshot = stock_snapshot + NEW.quantity_returned
    WHERE fabric_variant_id = NEW.fabric_variant_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fabric_return_stock ON fabric_returns;
CREATE TRIGGER trg_fabric_return_stock
  AFTER INSERT ON fabric_returns
  FOR EACH ROW EXECUTE FUNCTION trg_fabric_return_stock();

-- stock snapshot: sales
CREATE OR REPLACE FUNCTION trg_sale_stock()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.fabric_variant_id IS NOT NULL THEN
    UPDATE fabric_variants
      SET stock_snapshot = stock_snapshot + NEW.quantity
      WHERE fabric_variant_id = NEW.fabric_variant_id;
  ELSIF NEW.yarn_variant_id IS NOT NULL THEN
    UPDATE yarn_variants
      SET stock_snapshot = stock_snapshot + NEW.quantity
      WHERE yarn_variant_id = NEW.yarn_variant_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sale_stock ON sales;
CREATE TRIGGER trg_sale_stock
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION trg_sale_stock();

-- commercial transaction lines: stock on delivery quantity increase
CREATE OR REPLACE FUNCTION trg_commercial_line_delivery_stock()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  txn_type TEXT;
  delta DECIMAL(10,2);
BEGIN
  IF TG_OP = 'INSERT' THEN
    delta := NEW.delivered_quantity;
  ELSE
    delta := NEW.delivered_quantity - OLD.delivered_quantity;
  END IF;

  IF delta = 0 THEN
    RETURN NEW;
  END IF;

  SELECT type::text INTO txn_type
    FROM commercial_transactions
    WHERE transaction_id = NEW.transaction_id;

  IF txn_type IN ('yarn_purchase', 'fabric_purchase') THEN
    IF NEW.yarn_variant_id IS NOT NULL THEN
      UPDATE yarn_variants
        SET stock_snapshot = stock_snapshot + delta
        WHERE yarn_variant_id = NEW.yarn_variant_id;
    ELSIF NEW.fabric_variant_id IS NOT NULL THEN
      UPDATE fabric_variants
        SET stock_snapshot = stock_snapshot + delta
        WHERE fabric_variant_id = NEW.fabric_variant_id;
    END IF;
  ELSIF txn_type IN ('yarn_sale', 'fabric_sale') THEN
    IF NEW.yarn_variant_id IS NOT NULL THEN
      UPDATE yarn_variants
        SET stock_snapshot = stock_snapshot - delta
        WHERE yarn_variant_id = NEW.yarn_variant_id;
    ELSIF NEW.fabric_variant_id IS NOT NULL THEN
      UPDATE fabric_variants
        SET stock_snapshot = stock_snapshot - delta
        WHERE fabric_variant_id = NEW.fabric_variant_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_commercial_line_delivery ON commercial_transaction_lines;
CREATE TRIGGER trg_commercial_line_delivery
  AFTER INSERT OR UPDATE OF delivered_quantity ON commercial_transaction_lines
  FOR EACH ROW EXECUTE FUNCTION trg_commercial_line_delivery_stock();

-- work order reconcile on settlement
CREATE OR REPLACE FUNCTION trg_fabric_return_reconcile()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  unsettled_count INT;
BEGIN
  IF NEW.payment_id IS NOT NULL AND OLD.payment_id IS NULL THEN
    SELECT COUNT(*) INTO unsettled_count
      FROM fabric_returns
      WHERE zig_id = NEW.zig_id AND payment_id IS NULL AND return_id != NEW.return_id;

    IF unsettled_count = 0 THEN
      UPDATE work_orders
        SET status = 'reconciled'
        WHERE zig_id = NEW.zig_id AND status = 'returned';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fr_reconcile ON fabric_returns;
CREATE TRIGGER trg_fr_reconcile
  AFTER UPDATE ON fabric_returns
  FOR EACH ROW EXECUTE FUNCTION trg_fabric_return_reconcile();