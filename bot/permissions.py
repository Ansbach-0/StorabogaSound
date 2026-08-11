"""Permission system for user, moderator, and admin permission tiers."""

import discord
import aiosqlite

from bot.db.queries import get_server_config


async def is_moderator(member: discord.Member, guild: discord.Guild, db: aiosqlite.Connection | None, bot_owner_id: int) -> bool:
    """Check if member is an admin or has the DJ role (from DB)."""
    if await is_admin(member, guild, bot_owner_id):
        return True

    if db is not None:
        config = await get_server_config(db, str(guild.id))
        if config and config.dj_role_id:
            role_ids = {str(role.id) for role in member.roles}
            if config.dj_role_id in role_ids:
                return True

    return False


async def is_admin(member: discord.Member, guild: discord.Guild, bot_owner_id: int) -> bool:
    """Check if member is guild owner or bot owner."""
    return member.id == guild.owner_id or member.id == bot_owner_id
