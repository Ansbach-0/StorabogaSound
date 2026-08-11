"""/nowplaying slash command cog."""

import discord
from discord import app_commands
from discord.ext import commands

from bot.audio.player import AudioPlayer
from bot.embeds.builder import build_error_embed, build_now_playing_embed


class NowPlaying(commands.Cog):
    """/nowplaying slash command."""

    def __init__(self, bot: commands.Bot, player: AudioPlayer | None = None) -> None:
        self.bot = bot
        self.player = player or getattr(bot, "player", None)

    @app_commands.command(name="nowplaying", description="Show details for the currently playing track")
    async def nowplaying(self, interaction: discord.Interaction) -> None:
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

        active_track = self.player.queue_manager.get_active(interaction.guild.id)
        if active_track:
            embed = build_now_playing_embed(active_track)
            await interaction.response.send_message(embed=embed)
        else:
            embed = build_error_embed("Nothing is playing right now.")
            await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot) -> None:
    player = getattr(bot, "player", None)
    await bot.add_cog(NowPlaying(bot, player))
