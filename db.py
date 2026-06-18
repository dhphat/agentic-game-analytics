"""
db.py - Central data loader.

Loads data from Supabase via REST API (HTTPS/port 443) into Pandas DataFrames,
then registers them as in-memory DuckDB views so the rest of the codebase can
query them with DuckDB SQL exactly as before.

Using REST API instead of direct PostgreSQL to avoid firewall/IPv6 issues
on cloud hosting providers like Render.

Falls back to local CSV files if SUPABASE_URL / SUPABASE_KEY are not set.
"""

import os
import pandas as pd
import duckdb
from dotenv import load_dotenv

load_dotenv()

# --- Supabase REST API credentials ---
SUPABASE_URL = os.getenv("SUPABASE_URL")   # e.g. https://tejpwrkawycwycjmfxjf.supabase.co
SUPABASE_KEY = os.getenv("SUPABASE_KEY")   # anon/service_role key

# --- Module-level DataFrames (loaded once at startup) ---
_users_df: pd.DataFrame = None
_payments_df: pd.DataFrame = None
_surveys_df: pd.DataFrame = None


def _fetch_table(table_name: str) -> pd.DataFrame:
    """Fetch an entire table from Supabase REST API, handling pagination."""
    import requests

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }

    all_rows = []
    limit = 1000
    offset = 0

    while True:
        url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*&limit={limit}&offset={offset}"
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        rows = resp.json()
        if not rows:
            break
        all_rows.extend(rows)
        if len(rows) < limit:
            break
        offset += limit

    return pd.DataFrame(all_rows)


def _load_from_supabase() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load all tables from Supabase via REST API (HTTPS — no firewall issues)."""
    print("[db] Loading data from Supabase REST API...")
    users_df = _fetch_table("users_segment")
    payments_df = _fetch_table("payments")
    surveys_df = _fetch_table("surveys")

    # Validate — if any table is empty, it usually means RLS is blocking reads
    for name, df in [("users_segment", users_df), ("payments", payments_df), ("surveys", surveys_df)]:
        if df.empty:
            raise RuntimeError(
                f"[db] Table '{name}' returned 0 rows from Supabase. "
                "This is usually caused by Row Level Security (RLS) blocking the anon key. "
                "Fix: In Supabase Dashboard → Authentication → Policies, disable RLS on all 3 tables, "
                "OR replace SUPABASE_KEY with the service_role key."
            )

    print(f"[db] Loaded from Supabase: {len(users_df)} users, {len(payments_df)} payments, {len(surveys_df)} surveys.")
    return users_df, payments_df, surveys_df



def _load_from_csv() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Fallback: load from local CSV files (for local development)."""
    print("[db] SUPABASE_URL not set. Loading from local CSV files...")
    users_df = pd.read_csv("users_segment.csv")
    payments_df = pd.read_csv("payments.csv")
    surveys_df = pd.read_csv("surveys.csv")
    print(f"[db] Loaded from CSV: {len(users_df)} users, {len(payments_df)} payments, {len(surveys_df)} surveys.")
    return users_df, payments_df, surveys_df


def load_all_data(force_reload: bool = False):
    """
    Load all dataframes (once). Subsequent calls return cached data.
    Set force_reload=True to re-fetch from the database.
    """
    global _users_df, _payments_df, _surveys_df

    if _users_df is not None and not force_reload:
        return _users_df, _payments_df, _surveys_df

    if SUPABASE_URL and SUPABASE_KEY:
        _users_df, _payments_df, _surveys_df = _load_from_supabase()
    else:
        _users_df, _payments_df, _surveys_df = _load_from_csv()

    return _users_df, _payments_df, _surveys_df


def get_duckdb_connection() -> duckdb.DuckDBPyConnection:
    """
    Returns a new in-memory DuckDB connection with all 3 tables
    pre-registered as views from the cached DataFrames.
    """
    users_df, payments_df, surveys_df = load_all_data()

    con = duckdb.connect(database=":memory:")
    con.register("users_segment", users_df)
    con.register("payments", payments_df)
    con.register("surveys", surveys_df)
    return con
