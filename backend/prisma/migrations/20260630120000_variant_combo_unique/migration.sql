CREATE UNIQUE INDEX IF NOT EXISTS fabric_variant_combo_idx
  ON fabric_variants (product_id, warp_color_id, weft_color_id, COALESCE(design_id, -1));

CREATE UNIQUE INDEX IF NOT EXISTS yarn_variant_combo_idx
  ON yarn_variants (yarn_type_id, color_id, supplier_id);