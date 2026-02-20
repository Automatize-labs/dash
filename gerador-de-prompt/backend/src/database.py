"""Supabase database operations."""
from supabase import create_client, Client


def get_supabase_client(url: str, key: str) -> Client:
    """Create and return a Supabase client."""
    return create_client(url, key)


def save_prompt(supabase: Client, data: dict) -> dict:
    """Save a prompt record to the database."""
    result = supabase.table("prompts").insert(data).execute()
    return result.data[0] if result.data else {}


def get_prompts_by_user(supabase: Client, user_id: str) -> list:
    """Get all prompts for a specific user."""
    result = (
        supabase.table("prompts")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def get_prompt_by_id(supabase: Client, prompt_id: str, user_id: str) -> dict | None:
    """Get a single prompt by ID (scoped to user)."""
    result = (
        supabase.table("prompts")
        .select("*")
        .eq("id", prompt_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return result.data


def update_prompt(supabase: Client, prompt_id: str, data: dict) -> dict:
    """Update a prompt record."""
    result = (
        supabase.table("prompts")
        .update(data)
        .eq("id", prompt_id)
        .execute()
    )
    return result.data[0] if result.data else {}


def delete_prompt(supabase: Client, prompt_id: str) -> bool:
    """Delete a prompt record."""
    supabase.table("prompts").delete().eq("id", prompt_id).execute()
    return True


def save_framework(supabase: Client, data: dict) -> dict:
    """Save a framework record."""
    result = supabase.table("frameworks").insert(data).execute()
    return result.data[0] if result.data else {}


def get_frameworks(supabase: Client, user_id: str) -> list:
    """Get frameworks for a user (own + public)."""
    result = (
        supabase.table("frameworks")
        .select("*")
        .or_(f"user_id.eq.{user_id},is_public.eq.true")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data
