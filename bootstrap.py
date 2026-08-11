"""Storaboga Sound — First-run bootstrap script.

Run: python bootstrap.py

Steps:
1. Check Python version (3.13+)
2. Check ffmpeg is installed and accessible
3. Create .env from .env.example if not exists
4. Install pip dependencies (pip install -r requirements.txt)
5. Initialize database (creates tables)
6. Print next steps (set DISCORD_TOKEN, register OAuth2 redirect URI, run bot)
"""

import asyncio
import os
import shutil
import subprocess
import sys


def check_python_version() -> None:
    """Verify Python version is 3.13 or higher."""
    print("Checking Python version...")
    if sys.version_info < (3, 13):
        print(
            f"ERROR: Python 3.13+ is required. Current version is "
            f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}."
        )
        sys.exit(1)
    print(f"  OK: Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")


def check_ffmpeg() -> None:
    """Verify FFmpeg binary exists in system PATH or FFMPEG_PATH."""
    print("Checking FFmpeg installation...")
    ffmpeg_binary = os.getenv("FFMPEG_PATH", "ffmpeg")
    path = shutil.which(ffmpeg_binary)
    if not path:
        print(f"WARNING: '{ffmpeg_binary}' binary not found in PATH.")
        print("         Audio playback requires FFmpeg to be installed on your system.")
    else:
        print(f"  OK: FFmpeg found at {path}")


def setup_env() -> None:
    """Create .env from .env.example if .env does not exist."""
    print("Checking .env configuration file...")
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            shutil.copyfile(".env.example", ".env")
            print("  Created .env from .env.example")
            print("  WARNING: Remember to edit .env and provide DISCORD_TOKEN, DISCORD_CLIENT_ID, and DISCORD_CLIENT_SECRET!")
        else:
            print("  WARNING: Neither .env nor .env.example found.")
    else:
        print("  OK: .env exists")


def install_dependencies() -> None:
    """Install required pip packages using pip or available package manager."""
    print("Installing pip dependencies from requirements.txt...")
    req_file = "requirements.txt"
    if not os.path.exists(req_file):
        print(f"ERROR: {req_file} not found.")
        sys.exit(1)

    commands_to_try = [
        [sys.executable, "-m", "pip", "install", "-r", req_file],
        ["pip", "install", "-r", req_file],
        ["pip3", "install", "-r", req_file],
        ["uv", "pip", "install", "-r", req_file],
    ]

    success = False
    for cmd in commands_to_try:
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode == 0:
                print("  OK: Dependencies installed successfully.")
                success = True
                break
        except FileNotFoundError:
            continue

    if not success:
        print("ERROR: Could not install dependencies with pip or uv.")
        sys.exit(1)


def init_database() -> None:
    """Initialize SQLite database tables using bot.db.queries schema."""
    print("Initializing database...")
    try:
        from dotenv import load_dotenv
        load_dotenv()
        from bot.db.queries import init_db
        db_path = os.getenv("DB_PATH", "storaboga.db")
        asyncio.run(init_db(db_path))
        print(f"  OK: Database initialized at {db_path}")
    except Exception as e:
        print(f"ERROR: Database initialization failed: {e}")
        sys.exit(1)


def print_next_steps() -> None:
    """Print first-run instructions summary."""
    print("\n" + "=" * 60)
    print(" Storaboga Sound — Bootstrap Complete!")
    print("=" * 60)
    print("Next steps:")
    print("  1. Fill in DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET in .env")
    print("  2. Register OAuth2 redirect URI in Discord Developer Portal:")
    print("     http://<server-ip>:2497/auth/callback")
    print("  3. Enable Server Members Intent in Discord Developer Portal > Bot")
    print("  4. Run: python -m bot.main")
    print("=" * 60 + "\n")


def main() -> None:
    """Run all bootstrap steps sequentially."""
    print("--- Starting Storaboga Sound Bootstrap ---\n")
    check_python_version()
    check_ffmpeg()
    setup_env()
    install_dependencies()
    init_database()
    print_next_steps()


if __name__ == "__main__":
    main()
