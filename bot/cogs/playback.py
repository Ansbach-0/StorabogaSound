"""/play and /skip slash commands cog."""

import asyncio
from datetime import datetime, timezone
import logging
import discord
from discord import app_commands
from discord.ext import commands

from bot.audio.player import AudioPlayer
from bot.embeds.builder import (
    SOUL_COLOR_HEX,
    build_error_embed,
    build_now_playing_embed,
    build_skip_embed,
)

logger = logging.getLogger(__name__)


class Playback(commands.Cog):
    """/play and /skip slash commands."""

    def __init__(self, bot: commands.Bot, player: AudioPlayer | None = None) -> None:
        self.bot = bot
        self.player = player or getattr(bot, "player", None)

    @app_commands.command(name="play", description="Search and play a track")
    @app_commands.describe(query="Song name, artist, or direct URL")
    async def play(self, interaction: discord.Interaction, query: str) -> None:
        if (
            not interaction.guild
            or not isinstance(interaction.user, discord.Member)
            or not interaction.user.voice
            or not interaction.user.voice.channel
        ):
            await interaction.response.send_message(
                embed=build_error_embed("You need to be in a voice channel first."),
                ephemeral=True,
            )
            return

        if self.player is None:
            self.player = getattr(self.bot, "player", None)

        if self.player is None:
            await interaction.response.send_message(
                embed=build_error_embed("Audio player is not initialized."),
                ephemeral=True,
            )
            return

        await interaction.response.defer()
        try:
            track = await self.player.search_and_play(
                query=query,
                voice_channel=interaction.user.voice.channel,
                guild=interaction.guild,
                requester=interaction.user,
            )
            embed = build_now_playing_embed(track)
            await interaction.followup.send(embed=embed)
        except Exception as e:
            logger.error(f"Search and play error for query '{query}': {e}")
            embed = build_error_embed("Couldn't find that track. Try a different search term or URL.")
            await interaction.followup.send(embed=embed)

    @app_commands.command(name="skip", description="Skip the current track")
    async def skip(self, interaction: discord.Interaction) -> None:
        if not interaction.guild:
            await interaction.response.send_message(
                embed=build_error_embed("This command can only be used in a server."),
                ephemeral=True,
            )
            return

        if self.player is None:
            self.player = getattr(self.bot, "player", None)

        if self.player is None:
            await interaction.response.send_message(
                embed=build_error_embed("Audio player is not initialized."),
                ephemeral=True,
            )
            return

        guild_id = interaction.guild.id
        active = self.player.queue_manager.get_active(guild_id)
        if not active:
            await interaction.response.send_message(
                embed=build_error_embed("Nothing is playing right now."),
            )
            return

        try:
            skipped = await self.player.skip(guild_id)
        except Exception as e:
            logger.error(f"Error skipping track in guild {guild_id}: {e}")
            await interaction.response.send_message(
                embed=build_error_embed("Nothing is playing right now."),
            )
            return

        if not skipped and not self.player.queue_manager.get_active(guild_id):
            await interaction.response.send_message(
                embed=build_error_embed("Nothing is playing right now."),
            )
            return

        await asyncio.sleep(0.05)
        next_track = self.player.queue_manager.get_active(guild_id)

        if next_track:
            embed = build_skip_embed(skipped)
            await interaction.response.send_message(embed=embed)
        else:
            if skipped:
                embed = build_skip_embed(skipped)
                embed.description = f"{embed.description}\n\nThe queue is empty."
            else:
                embed = build_error_embed("Nothing is playing right now.")
            await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot) -> None:
    player = getattr(bot, "player", None)
    await bot.add_cog(Playback(bot, player))
