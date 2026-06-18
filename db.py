"""
db.py - Central data loader.

Loads data from Supabase (via PostgreSQL connection string) into Pandas DataFrames,
then registers them as in-memory DuckDB views so the rest of the codebase can
query them with DuckDB SQL exactly as before.

Falls back to local CSV files if SUPABASE_DB_URL is not set (for local development).
"""

import os
import pandas as pd
import duckdb
from dotenv import load_dotenv

load_dotenv()

# --- Connection ---
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")  # Format: postgresql://user:password@host:port/dbname

# --- Module-level DataFrames (loaded once at startup) ---
_users_df: pd.DataFrame = None
_payments_df: pd.DataFrame = None
_surveys_df: pd.DataFrame = None


def _load_from_supabase() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load all tables from Supabase PostgreSQL."""
    print("[db] Loading data from Supabase...")
    engine_url = SUPABASE_DB_URL
    # Use psycopg2 to load via pandas
    import psycopg2
    conn = psycopg2.connect(engine_url)
    try:
        users_df = pd.read_sql("SELECT * FROM users_segment", conn)
        payments_df = pd.read_sql("SELECT * FROM payments", conn)
        surveys_df = pd.read_sql("SELECT * FROM surveys", conn)
        print(f"[db] Loaded from Supabase: {len(users_df)} users, {len(payments_df)} payments, {len(surveys_df)} surveys.")
        return users_df, payments_df, surveys_df
    finally:
        conn.close()


def _load_from_csv() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Fallback: load from local CSV files."""
    print("[db] SUPABASE_DB_URL not set. Loading from local CSV files...")
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

    if SUPABASE_DB_URL:
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
