"""/pause, /volume, and /leave slash commands cog."""

import aiosqlite
import discord
from discord import app_commands
from discord.ext import commands

from bot.audio.player import AudioPlayer
from bot.db.models import ServerConfig
from bot.db.queries import get_server_config, set_server_config
from bot.embeds.builder import (
    build_error_embed,
    build_leave_embed,
    build_pause_embed,
    build_volume_embed,
)
from bot.permissions import is_moderator


class Controls(commands.Cog):
    """/pause, /volume, /leave slash commands."""

    def __init__(
        self,
        bot: commands.Bot,
        player: AudioPlayer | None = None,
        db: aiosqlite.Connection | None = None,
    ) -> None:
        self.bot = bot
        self.player = player or getattr(bot, "player", None)
        self.db = db or getattr(bot, "db", None)

    async def _check_moderator(self, interaction: discord.Interaction) -> bool:
        """Verify user is in a guild and has moderator permissions."""
        if not interaction.guild or not isinstance(interaction.user, discord.Member):
            await interaction.response.send_message(
                embed=build_error_embed("This command can only be used in a server."),
                ephemeral=True,
            )
            return False

        db = self.db or getattr(self.bot, "db", None)
        bot_owner_id = self.bot.owner_id or 0

        if not await is_moderator(interaction.user, interaction.guild, db, bot_owner_id):
            await interaction.response.send_message(
                embed=build_error_embed("You do not have permission to use this command. Moderator tier required."),
                ephemeral=True,
            )
            return False

        return True

    @app_commands.command(name="pause", description="Pause or resume playback")
    async def pause(self, interaction: discord.Interaction) -> None:
        if not await self._check_moderator(interaction):
            return

        assert interaction.guild is not None

        if self.player is None:
            self.player = getattr(self.bot, "player", None)

        if self.player is None:
            await interaction.response.send_message(
                embed=build_error_embed("Audio player is not initialized."),
                ephemeral=True,
            )
            return

        vc = interaction.guild.voice_client
        if not vc or not vc.is_connected():
            await interaction.response.send_message(
                embed=build_error_embed("I'm not in a voice channel."),
                ephemeral=True,
            )
            return

        is_paused = await self.player.pause(interaction.guild.id)
        embed = build_pause_embed(is_paused)
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="volume", description="Set playback volume (0-100)")
    @app_commands.describe(volume="Volume level (0-100)")
    async def volume(
        self,
        interaction: discord.Interaction,
        volume: app_commands.Range[int, 0, 100],
    ) -> None:
        if not await self._check_moderator(interaction):
            return

        assert interaction.guild is not None

        if self.player is None:
            self.player = getattr(self.bot, "player", None)

        if self.player is None:
            await interaction.response.send_message(
                embed=build_error_embed("Audio player is not initialized."),
                ephemeral=True,
            )
            return

        new_vol = await self.player.set_volume(interaction.guild, volume)
        db = self.db or getattr(self.bot, "db", None)

        if db:
            config = await get_server_config(db, str(interaction.guild.id))
            dj_role_id = config.dj_role_id if config else None
            await set_server_config(
                db,
                ServerConfig(
                    guild_id=str(interaction.guild.id),
                    dj_role_id=dj_role_id,
                    default_volume=new_vol,
                ),
            )

        embed = build_volume_embed(new_vol)
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="leave", description="Disconnect from voice channel and clear queue")
    async def leave(self, interaction: discord.Interaction) -> None:
        if not await self._check_moderator(interaction):
            return

        assert interaction.guild is not None

        if self.player is None:
            self.player = getattr(self.bot, "player", None)

        if self.player is None:
            await interaction.response.send_message(
                embed=build_error_embed("Audio player is not initialized."),
                ephemeral=True,
            )
            return

        await self.player.leave(interaction.guild.id)
        embed = build_leave_embed()
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot) -> None:
    player = getattr(bot, "player", None)
    db = getattr(bot, "db", None)
    await bot.add_cog(Controls(bot, player, db))
