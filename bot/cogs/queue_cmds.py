"""/queue slash command cog."""

import discord
from discord import app_commands
from discord.ext import commands

from bot.audio.player import AudioPlayer
from bot.embeds.builder import build_error_embed, build_queue_embed


class QueueCommands(commands.Cog):
    """/queue slash command."""

    def __init__(self, bot: commands.Bot, player: AudioPlayer | None = None) -> None:
        self.bot = bot
        self.player = player or getattr(bot, "player", None)

    @app_commands.command(name="queue", description="Display the current track queue")
    async def queue(self, interaction: discord.Interaction) -> None:
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

        tracks = self.player.queue_manager.get_queue(interaction.guild.id)
        if not tracks:
            embed = build_queue_embed([], 0)
        else:
            embed = build_queue_embed(tracks, len(tracks))

        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot) -> None:
    player = getattr(bot, "player", None)
    await bot.add_cog(QueueCommands(bot, player))
