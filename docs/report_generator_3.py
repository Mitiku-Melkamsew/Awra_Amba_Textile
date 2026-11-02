import sys
import pandas as pd
from math import floor
from datetime import datetime
import os
import re

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ==============================================================================
# CONFIGURATION / ማስተካከያ
# ==============================================================================
ENCODING_TYPE = "utf-8-sig"
HISAB = "hisab-5"

# Filter by the first day fabric was returned (Format: DD/MM/YYYY):
# Only zigs whose first fabric return was on or before this date will be included.
# Set CUTOFF_DATE = None to include all completed zigs without date restriction.
#
# QUICK REFERENCE TABLE (በቀን ማጣሪያ ፈጣን መመሪያ ለበጀት):
#   CUTOFF_DATE = "01/11/2018" -> 113 zigs | 75 weavers | ~1.77 Million Birr (1,773,183 ETB)
#   CUTOFF_DATE = "15/11/2018" -> 156 zigs | 81 weavers | ~2.58 Million Birr (2,578,260 ETB)
#   CUTOFF_DATE = "01/12/2018" -> 184 zigs | 83 weavers | ~3.40 Million Birr (3,402,707 ETB)
#   CUTOFF_DATE = "08/12/2018" -> 207 zigs | 85 weavers | ~4.47 Million Birr (4,468,533 ETB)
#   CUTOFF_DATE = "09/12/2018" -> 212 zigs | 85 weavers | ~4.76 Million Birr (4,759,623 ETB)
#   CUTOFF_DATE = "15/12/2018" -> 222 zigs | 85 weavers | ~5.28 Million Birr (5,284,390 ETB)
#   CUTOFF_DATE = "20/12/2018" -> 232 zigs | 85 weavers | ~5.85 Million Birr (5,850,789 ETB)
#   CUTOFF_DATE = None         -> 256 zigs | 85 weavers | ~6.93 Million Birr (All Completed)
#
CUTOFF_DATE = "1/1/2019"

# Only pay completed zigs (True) vs include non-settled ongoing zigs (False)
# Recommended: True (so ongoing unreturned yarn is not penalized against completed work)
ONLY_COMPLETED = True

# Output file path
DETAIL_CSV_OUTPUT_FILE = "hisab-5/Detailed_Calculation_Steps-5-cutoff.csv"

# ==============================================================================
# MAPPINGS AND QUALITY RULES
# ==============================================================================
FE_MAP = {
    "f-01": "መደበኛ",
    "f-02": "በ 2.50 ሜ",
    "f-03": "በ 2.75 ሜ",
    "f-04": "በ 3.00 ሜ",
    "f-05": "ከ 60",
    "f-06": "ከ 10",
}

QUALITY_RULES = {
    "f-01": 64,
    "f-02": 71,
    "f-03": 78,
    "f-04": 84,
    "f-05": 90,
    "f-06": 42,
}


def parse_date(d_str):
    """Robust date parser supporting D/M/YYYY, YYYY-MM-DD, M/D/YYYY."""
    if pd.isna(d_str):
        return None
    d_str = str(d_str).strip()
    if not d_str or d_str.lower() in {"nan", "nat", "-"}:
        return None

    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(d_str, fmt)
        except ValueError:
            pass

    parts = d_str.split("/")
    if len(parts) == 3:
        try:
            return datetime(int(parts[2]), int(parts[1]), int(parts[0]))
        except Exception:
            return None
    return None


def number_to_amharic_words(n):
    """Converts a number to Amharic text (supports up to millions)."""
    if n == 0:
        return "ዜሮ"

    ones = ["", "አንድ", "ሁለት", "ሦስት", "አራት", "አምስት", "ስድስት", "ሰባት", "ስምንት", "ዘጠኝ"]
    tens = ["", "አስር", "ሃያ", "ሰላሳ", "አርባ", "ሃምሳ", "ስልሳ", "ሰባ", "ሰማንያ", "ዘጠና"]
    teens = [
        "አስር", "አስራ አንድ", "አስራ ሁለት", "አስራ ሦስት", "አስራ አራት",
        "አስራ አምስት", "አስራ ስድስት", "አስራ ሰባት", "አስራ ስምንት", "አስራ ዘጠኝ",
    ]

    def convert_hundreds(num):
        words = []
        h = num // 100
        rem = num % 100
        if h > 0:
            if h == 1:
                words.append("አንድ መቶ")
            else:
                words.append(ones[h] + " መቶ")

        if rem > 0:
            if rem < 10:
                words.append(ones[rem])
            elif rem < 20:
                words.append(teens[rem - 10])
            else:
                t = rem // 10
                o = rem % 10
                words.append(tens[t])
                if o > 0:
                    words.append(ones[o])
        return " ".join(words)

    if n < 0:
        return "ኔጌቲቭ " + number_to_amharic_words(-n)

    parts = []
    millions = n // 1000000
    n %= 1000000
    thousands = n // 1000
    n %= 1000

    if millions > 0:
        parts.append(convert_hundreds(millions) + " ሚሊዮን")
    if thousands > 0:
        parts.append(convert_hundreds(thousands) + " ሺህ")
    if n > 0:
        parts.append(convert_hundreds(n))

    return " ".join(parts)


def resolve_path(rel_path):
    """Resolves relative file path against script directory or current working directory."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidate = os.path.join(script_dir, rel_path)
    if os.path.exists(candidate) or os.path.exists(os.path.dirname(candidate)):
        return candidate
    return rel_path


def load_data():
    """Loads input CSVs from the configured hisab directory."""
    hisab_dir = resolve_path(HISAB)
    weavers_path = os.path.join(hisab_dir, "weavers.csv")
    zigs_path = os.path.join(hisab_dir, "zigs.csv")
    yarn_path = os.path.join(hisab_dir, "yarn_given.csv")
    returns_path = os.path.join(hisab_dir, "fabric_returned.csv")

    weavers_df = pd.read_csv(weavers_path, encoding=ENCODING_TYPE)
    zigs_df = pd.read_csv(zigs_path, encoding=ENCODING_TYPE)
    yarn_given_df = pd.read_csv(yarn_path, encoding=ENCODING_TYPE)
    returns_df = pd.read_csv(returns_path, encoding=ENCODING_TYPE)

    for df in [weavers_df, zigs_df, yarn_given_df, returns_df]:
        df.columns = df.columns.str.strip()

    return weavers_df, zigs_df, yarn_given_df, returns_df


def clean_number(value):
    if pd.isna(value):
        return 0.0

    text = str(value).strip()
    if not text or text in {"$-", "-", "na", "NA"}:
        return 0.0

    # Keep digits, minus sign, and decimal point only.
    text = re.sub(r"[^0-9.\-]", "", text)
    if text in {"", ".", "-", "-."}:
        return 0.0

    try:
        return float(text)
    except ValueError:
        return 0.0


def add_numeric_columns(df, columns):
    for column in columns:
        if column in df.columns:
            df[column] = df[column].apply(clean_number)
    return df


def get_quality_info(fabric_id, avg_weight):
    if pd.isna(avg_weight) or avg_weight == 0:
        return 0

    rule = QUALITY_RULES.get(fabric_id)
    if rule is None or avg_weight >= rule:
        return 0

    return (rule - floor(avg_weight)) * 10


def build_yarn_aggregation(yarn_given_df):
    yarn_given_df = yarn_given_df.dropna(subset=["zig_id"]).copy()
    yarn_given_df["zig_id"] = yarn_given_df["zig_id"].astype(str).str.strip().str.lower()
    yarn_given_df = add_numeric_columns(yarn_given_df, ["quantity", "subtotal"])
    yarn_agg = (
        yarn_given_df.groupby("zig_id", as_index=False)
        .agg(quantity=("quantity", "sum"), subtotal=("subtotal", "sum"))
    )
    yarn_agg["avg_unit_price"] = 0.0
    non_zero_qty = yarn_agg["quantity"] > 0
    yarn_agg.loc[non_zero_qty, "avg_unit_price"] = (
        yarn_agg.loc[non_zero_qty, "subtotal"] / yarn_agg.loc[non_zero_qty, "quantity"]
    )
    return yarn_agg


def build_processed_returns(returns_df):
    returns_df = returns_df.dropna(subset=["zig_id"]).copy()
    returns_df["zig_id"] = returns_df["zig_id"].astype(str).str.strip().str.lower()
    returns_df["fabric_id"] = returns_df["fabric_id"].astype(str).str.strip().str.lower()
    returns_df = add_numeric_columns(returns_df, ["quantity", "total_weight", "unit_price"])

    # Calculate exact natural base value (quantity * price) for each entry BEFORE grouping
    returns_df["total_base_value"] = returns_df["quantity"] * returns_df["unit_price"]

    returns_agg = (
        returns_df.groupby(["zig_id", "fabric_id"], as_index=False)
        .agg(
            quantity=("quantity", "sum"),
            total_weight=("total_weight", "sum"),
            total_base_value=("total_base_value", "sum"),
        )
    )

    returns_agg["avg_weight"] = 0.0
    non_zero_qty = returns_agg["quantity"] > 0
    returns_agg.loc[non_zero_qty, "avg_weight"] = (
        returns_agg.loc[non_zero_qty, "total_weight"] / returns_agg.loc[non_zero_qty, "quantity"]
    )

    # Average unit price weighted by quantity
    returns_agg["unit_price"] = 0.0
    returns_agg.loc[non_zero_qty, "unit_price"] = (
        returns_agg.loc[non_zero_qty, "total_base_value"] / returns_agg.loc[non_zero_qty, "quantity"]
    )

    quality_df = returns_agg.apply(
        lambda row: pd.Series(get_quality_info(row["fabric_id"], row["avg_weight"]), index=["deduction"]),
        axis=1,
    )
    returns_agg = pd.concat([returns_agg, quality_df], axis=1)

    returns_agg["adjusted_price"] = returns_agg["unit_price"] - returns_agg["deduction"]
    returns_agg["fabric_subtotal"] = (
        returns_agg["total_base_value"] - (returns_agg["deduction"] * returns_agg["quantity"])
    ).round().astype(int)

    returns_agg["fabric_am"] = returns_agg["fabric_id"].map(FE_MAP).fillna(returns_agg["fabric_id"])
    returns_agg["weighted_total_weight"] = returns_agg["quantity"] * returns_agg["avg_weight"]

    return returns_agg


def build_zig_totals(processed_df, yarn_agg):
    fabric_totals = (
        processed_df.groupby("zig_id", as_index=False)
        .agg(
            fabric_qty=("quantity", "sum"),
            fabric_value=("fabric_subtotal", "sum"),
            total_fabric_weight=("weighted_total_weight", "sum"),
        )
    )

    zig_totals = fabric_totals.merge(yarn_agg, on="zig_id", how="outer")
    for col in ["fabric_qty", "fabric_value", "total_fabric_weight", "quantity", "subtotal", "avg_unit_price"]:
        zig_totals[col] = zig_totals[col].fillna(0)

    zig_totals = zig_totals.rename(
        columns={
            "quantity": "yarn_qty",
            "subtotal": "yarn_total",
            "avg_unit_price": "yarn_unit_price",
        }
    )
    zig_totals["net_profit"] = zig_totals["fabric_value"] - zig_totals["yarn_total"]

    return zig_totals


def get_first_return_dates(returns_df):
    """Finds the earliest fabric return date for every zig."""
    df = returns_df.dropna(subset=["zig_id", "date"]).copy()
    df["parsed_date"] = df["date"].apply(parse_date)
    df = df.dropna(subset=["parsed_date"])
    df["zid_lower"] = df["zig_id"].astype(str).str.strip().str.lower()
    return df.groupby("zid_lower")["parsed_date"].min().to_dict()


def get_completed_zigs(zigs_df, weavers_df, first_return_dates, cutoff_date=None, only_completed=True):
    """
    Selects zigs for payment filtered by:
    1. Status (Completed vs non-settled).
    2. First fabric return date on or before cutoff_date.
    """
    zigs_df = zigs_df.dropna(subset=["zig_id", "weaver_id"]).copy()
    weavers_df = weavers_df.dropna(subset=["weaver_id"]).copy()
    
    zigs_df["status_clean"] = zigs_df["status"].astype(str).str.strip().str.lower()
    zigs_df["weaver_id"] = zigs_df["weaver_id"].astype(float).astype(int)
    weavers_df["weaver_id"] = weavers_df["weaver_id"].astype(float).astype(int)

    if only_completed:
        filtered = zigs_df[zigs_df["status_clean"] == "completed"].copy()
    else:
        filtered = zigs_df[zigs_df["status_clean"] != "settled"].copy()

    # Map first return date
    filtered["zid_lower"] = filtered["zig_id"].astype(str).str.strip().str.lower()
    filtered["first_return_date"] = filtered["zid_lower"].map(first_return_dates)

    # Filter by cutoff date
    if cutoff_date:
        cutoff_dt = parse_date(cutoff_date)
        if cutoff_dt:
            filtered = filtered[
                filtered["first_return_date"].notna()
                & (filtered["first_return_date"] <= cutoff_dt)
            ]

    # Sort chronologically by first return date, then zig_id numerical
    filtered = filtered.sort_values(by=["first_return_date", "zig_id"])
    filtered = filtered.merge(weavers_df, on="weaver_id", how="left")

    return filtered


def zig_numeric_key(zig_id):
    match = re.search(r"(\d+)", str(zig_id))
    if match:
        return int(match.group(1))
    return 10**9


def write_detailed_csv(completed_zigs, processed_df, zig_totals, output_file):
    processed_by_zig = {zig_id: group.copy() for zig_id, group in processed_df.groupby("zig_id")}
    totals_by_zig = zig_totals.set_index("zig_id").to_dict(orient="index")

    rows = []
    weaver_groups = (
        completed_zigs[["weaver_id", "first_name", "last_name"]]
        .drop_duplicates()
        .sort_values(["weaver_id", "first_name", "last_name"])
    )

    for _, weaver in weaver_groups.iterrows():
        weaver_id = int(weaver["weaver_id"])
        full_name = f"{weaver['first_name']} {weaver['last_name']}"
        weaver_zigs = sorted(
            completed_zigs[completed_zigs["weaver_id"] == weaver_id]["zig_id"].unique(),
            key=zig_numeric_key,
        )

        # Calculate the total net profit for the weaver before starting the rows
        weaver_net_profit_total = sum(totals_by_zig.get(str(z).lower(), {}).get("net_profit", 0) for z in weaver_zigs)

        first_row_for_weaver = True
        for zig_id in weaver_zigs:
            zid_key = str(zig_id).lower()
            zig_fabrics = processed_by_zig.get(zid_key)
            zig_total = totals_by_zig.get(zid_key, {})

            line_rows = []
            if zig_fabrics is not None and not zig_fabrics.empty:
                zig_fabrics = zig_fabrics.sort_values(["fabric_id", "fabric_am"])
                for _, fabric_row in zig_fabrics.iterrows():
                    line_rows.append({
                        "fabric_type": fabric_row["fabric_am"],
                        "fabric_qty": int(fabric_row["quantity"]),
                        "avg_weight": floor(fabric_row["avg_weight"]),
                        "base_price": round(fabric_row["unit_price"], 2),
                        "deduction": int(fabric_row["deduction"]),
                        "adjusted_price": round(fabric_row["adjusted_price"], 2),
                        "line_subtotal": int(fabric_row["fabric_subtotal"]),
                    })
            else:
                line_rows.append({
                    "fabric_type": "", "fabric_qty": "", "avg_weight": "",
                    "base_price": "", "deduction": "", "adjusted_price": "", "line_subtotal": "",
                })

            first_row_for_zig = True
            for line in line_rows:
                row = {
                    "weaver_id": weaver_id if first_row_for_weaver else "",
                    "weaver_name": full_name if first_row_for_weaver else "",
                    "zig_id": zig_id if first_row_for_zig else "",
                    "fabric_type": line["fabric_type"],
                    "fabric_qty": line["fabric_qty"],
                    "avg_weight": line["avg_weight"],
                    "base_price": line["base_price"],
                    "deduction": line["deduction"],
                    "adjusted_price": line["adjusted_price"],
                    "line_subtotal": line["line_subtotal"],
                    "fabric_total_value": int(zig_total.get("fabric_value", 0)) if first_row_for_zig else "",
                    "yarn_qty": zig_total.get("yarn_qty", 0) if first_row_for_zig else "",
                    "yarn_avg_price": round(zig_total.get("yarn_unit_price", 0), 2) if first_row_for_zig else "",
                    "yarn_total": int(zig_total.get("yarn_total", 0)) if first_row_for_zig else "",
                    "net_profit": int(zig_total.get("net_profit", 0)) if first_row_for_zig else "",
                    "total_net_profit": int(weaver_net_profit_total) if first_row_for_weaver else "",
                }
                rows.append(row)
                first_row_for_weaver = False
                first_row_for_zig = False

    # --- Calculate Grand Totals ---
    completed_zig_ids = set(completed_zigs["zig_id"].unique())
    completed_totals = [totals_by_zig.get(str(z).lower(), {}) for z in completed_zig_ids]

    grand_fabric_qty = sum(t.get("fabric_qty", 0) for t in completed_totals)
    grand_fabric_value = sum(t.get("fabric_value", 0) for t in completed_totals)
    grand_yarn_qty = sum(t.get("yarn_qty", 0) for t in completed_totals)
    grand_yarn_total = sum(t.get("yarn_total", 0) for t in completed_totals)
    grand_net_profit = sum(t.get("net_profit", 0) for t in completed_totals)

    # Empty spacer row
    rows.append({col: "" for col in rows[0].keys()} if rows else {})

    # Grand Totals Row
    rows.append({
        "weaver_id": "",
        "weaver_name": "ድምር",
        "zig_id": "",
        "fabric_type": "",
        "fabric_qty": int(grand_fabric_qty),
        "avg_weight": "",
        "base_price": "",
        "deduction": "",
        "adjusted_price": "",
        "line_subtotal": "",
        "fabric_total_value": int(grand_fabric_value),
        "yarn_qty": int(grand_yarn_qty) if grand_yarn_qty.is_integer() else grand_yarn_qty,
        "yarn_avg_price": "",
        "yarn_total": int(grand_yarn_total),
        "net_profit": int(grand_net_profit),
        "total_net_profit": int(grand_net_profit),
    })

    # Amharic Amount Text
    total_profit_int = int(round(grand_net_profit))
    amharic_amount = number_to_amharic_words(total_profit_int)

    rows.append({
        "weaver_id": f"ጠቅላላ ተከፋይ {amharic_amount}",
        "weaver_name": "", "zig_id": "", "fabric_type": "", "fabric_qty": "",
        "avg_weight": "", "base_price": "", "deduction": "", "adjusted_price": "",
        "line_subtotal": "", "fabric_total_value": "", "yarn_qty": "",
        "yarn_avg_price": "", "yarn_total": "", "net_profit": "", "total_net_profit": "",
    })

    # Extra spacing for signatures
    rows.extend([{col: "" for col in rows[0].keys()}] * 2)

    # Signature Block
    rows.append({
        "weaver_id": "",
        "weaver_name": "ክፍያውን ያዘጋጀው",
        "zig_id": "የገንዘብ ከፋይ",
        "fabric_type": "ክፍያውን ያጸደቀው",
        **{k: "" for k in list(rows[0].keys())[4:]}
    })
    rows.append({
        "weaver_id": "ስም",
        "weaver_name": "",
        "zig_id": "",
        "fabric_type": "",
        **{k: "" for k in list(rows[0].keys())[4:]}
    })
    rows.append({
        "weaver_id": "ፊርማ",
        "weaver_name": "",
        "zig_id": "",
        "fabric_type": "",
        **{k: "" for k in list(rows[0].keys())[4:]}
    })

    # --- Write to CSV with Date Header ---
    resolved_output = resolve_path(output_file)
    os.makedirs(os.path.dirname(resolved_output), exist_ok=True)
    with open(resolved_output, "w", encoding="utf-8-sig") as f:
        f.write("ቀን: ____________________\n\n")

    detail_csv_df = pd.DataFrame(rows)
    detail_csv_df.to_csv(resolved_output, mode="a", index=False, encoding="utf-8-sig")


def main():
    print("=" * 65)
    print("      ALBASAT TEXTILE - REPORT GENERATOR 3 (FILTER ENABLED)")
    print("=" * 65)

    weavers_df, zigs_df, yarn_given_df, returns_df = load_data()
    yarn_agg = build_yarn_aggregation(yarn_given_df)
    processed_df = build_processed_returns(returns_df)
    zig_totals = build_zig_totals(processed_df, yarn_agg)
    first_return_dates = get_first_return_dates(returns_df)

    completed_zigs = get_completed_zigs(
        zigs_df=zigs_df,
        weavers_df=weavers_df,
        first_return_dates=first_return_dates,
        cutoff_date=CUTOFF_DATE,
        only_completed=ONLY_COMPLETED,
    )

    write_detailed_csv(
        completed_zigs=completed_zigs,
        processed_df=processed_df,
        zig_totals=zig_totals,
        output_file=DETAIL_CSV_OUTPUT_FILE,
    )

    # Calculate summary
    totals_map = zig_totals.set_index("zig_id")["net_profit"].to_dict()
    approved_zig_ids = completed_zigs["zig_id"].unique()
    total_payout = sum(totals_map.get(z, 0) for z in approved_zig_ids)
    weavers_count = completed_zigs["weaver_id"].nunique()

    print(f"\n[+] Cutoff Date Filter : {CUTOFF_DATE if CUTOFF_DATE else 'No Filter (All Completed)'}")
    print(f"[+] Only Completed Zigs: {ONLY_COMPLETED}")
    print(f"[+] Approved Zigs Count: {len(approved_zig_ids)}")
    print(f"[+] Weavers Covered    : {weavers_count}")
    print(f"[+] Total Payout Amount: {total_payout:,.2f} ETB")
    print(f"[+] Amount in Words    : {number_to_amharic_words(int(round(total_payout)))} ብር")
    print(f"[+] Output Written To  : {resolve_path(DETAIL_CSV_OUTPUT_FILE)}")
    print("=" * 65)


if __name__ == "__main__":
    main()
