"""Storaboga Sound — Pterodactyl bootstrap.

This runs at /home/container/bootstrap.py BEFORE the repo is cloned.
It clones the repo, copies .env, installs deps, and launches the bot.
"""

import hashlib
import os
import shutil
import subprocess
import sys
import time

REPO_DIR = "StorabogaSound"
GIT_ADDRESS = os.environ.get("GIT_ADDRESS", "https://github.com/Ansbach-0/StorabogaSound")
BRANCH = os.environ.get("BRANCH", "main")
ACCESS_TOKEN = os.environ.get("ACCESS_TOKEN", "")
USERNAME = os.environ.get("USERNAME", "")


def clone_or_pull():
    """Clone the repo or pull if it already exists."""
    if os.path.exists(REPO_DIR):
        print(f"[bootstrap] Repo exists, pulling latest...")
        subprocess.run(["git", "-C", REPO_DIR, "fetch", "origin"], check=False)
        subprocess.run(["git", "-C", REPO_DIR, "reset", "--hard", f"origin/{BRANCH}"], check=False)
    else:
        print(f"[bootstrap] Cloning {GIT_ADDRESS} (branch: {BRANCH})...")
        clone_url = GIT_ADDRESS
        if ACCESS_TOKEN and clone_url.startswith("https://"):
            # Inject token into URL for private repos
            clone_url = clone_url.replace(
                "https://",
                f"https://{USERNAME}:{ACCESS_TOKEN}@",
            )
        result = subprocess.run(
            ["git", "clone", "--depth", "1", "-b", BRANCH, clone_url, REPO_DIR],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            print(f"[bootstrap] Clone FAILED: {result.stderr}")
            sys.exit(1)
        print(f"[bootstrap] Clone OK")


def self_update():
    """Copy the repo's pterodactyl-bootstrap.py over this file if it changed.

    The container root bootstrap (/home/container/pterodactyl-bootstrap.py) is
    OUTSIDE the repo, so git pull never updates it.  This step copies the
    repo's version over itself and re-execs when the SHA differs, keeping the
    bootstrap logic in sync with the repo forever after the first manual copy.
    """
    self_path = os.path.abspath(__file__)
    repo_copy = os.path.join(REPO_DIR, "pterodactyl-bootstrap.py")
    if not os.path.isfile(repo_copy):
        return  # repo doesn't ship one; nothing to do

    def _sha(path):
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()

    if _sha(self_path) == _sha(repo_copy):
        return  # already in sync

    print("[bootstrap] Self-update: newer pterodactyl-bootstrap.py in repo, copying over...")
    shutil.copy(repo_copy, self_path)
    # Re-exec so the new version runs with the updated logic
    os.execv(sys.executable, [sys.executable, self_path] + sys.argv[1:])



def copy_env():
    """Copy .env from container root to repo dir."""
    if os.path.exists(".env"):
        shutil.copy(".env", os.path.join(REPO_DIR, ".env"))
        print("[bootstrap] .env copied to repo dir")
    else:
        print("[bootstrap] WARNING: no .env found at container root")


def install_deps():
    """Install pip dependencies from the repo's requirements.txt."""
    req_path = os.path.join(REPO_DIR, "requirements.txt")
    if not os.path.exists(req_path):
        print(f"[bootstrap] WARNING: {req_path} not found")
        return
    print("[bootstrap] Installing dependencies...")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", req_path],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"[bootstrap] pip install FAILED: {result.stderr}")
        sys.exit(1)
    print("[bootstrap] Dependencies installed")


def install_node():
    """Install bun (Node.js runtime + package manager) if not present."""
    if shutil.which("npm") and shutil.which("node"):
        print("[bootstrap] Node/npm already available")
        return
    print("[bootstrap] Installing bun...")
    # bun install.sh installs to ~/.bun and puts bun + bunx on PATH
    result = subprocess.run(
        ["bash", "-c", "curl -fsSL https://bun.sh/install | bash"],
        capture_output=True, text=True, timeout=120,
    )
    if result.returncode != 0:
        print(f"[bootstrap] bun install FAILED: {result.stderr[-500:]}")
        # Fallback: try nvm (Node.js)
        print("[bootstrap] Falling back to nvm + Node.js...")
        result2 = subprocess.run(
            ["bash", "-c",
             'curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && '
             'export NVM_DIR="$HOME/.nvm" && '
             '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && '
             'nvm install --lts && nvm use --lts'],
            capture_output=True, text=True, timeout=120,
        )
        if result2.returncode != 0:
            print(f"[bootstrap] nvm install FAILED: {result2.stderr[-500:]}")
            sys.exit(1)
        print("[bootstrap] Node.js installed via nvm")
        return
    # Add bun to PATH for this process and children
    bun_dir = os.path.expanduser("~/.bun/bin")
    os.environ["PATH"] = bun_dir + os.pathsep + os.environ.get("PATH", "")
    print(f"[bootstrap] bun installed at {bun_dir}")
    # Verify
    check = subprocess.run(["bun", "--version"], capture_output=True, text=True)
    print(f"[bootstrap] bun version: {check.stdout.strip()}")


def build_frontend():
    """Install frontend deps and build with bun."""
    frontend_dir = os.path.join(REPO_DIR, "frontend")
    if not os.path.exists(frontend_dir):
        print("[bootstrap] WARNING: frontend/ not found, skipping build")
        return
    print("[bootstrap] Building frontend...")
    # Use bun if available, fall back to npm
    pkg_manager = shutil.which("bun")
    runner = "bun"
    if not pkg_manager:
        pkg_manager = shutil.which("npm")
        runner = "npm"
    if not pkg_manager:
        print("[bootstrap] ERROR: no bun or npm found after install_node()")
        sys.exit(1)
    print(f"[bootstrap] Using {runner}")
    install = subprocess.run(
        [runner, "install"], cwd=frontend_dir,
        capture_output=True, text=True, timeout=180,
    )
    if install.returncode != 0:
        print(f"[bootstrap] {runner} install FAILED: {install.stderr[-500:]}")
        sys.exit(1)
    print(f"[bootstrap] {runner} install OK")
    # bun run build or npm run build
    build = subprocess.run(
        [runner, "run", "build"], cwd=frontend_dir,
        capture_output=True, text=True, timeout=180,
    )
    if build.returncode != 0:
        print(f"[bootstrap] {runner} build FAILED: {build.stderr[-500:]}")
        sys.exit(1)
    dist_dir = os.path.join(frontend_dir, "dist")
    print(f"[bootstrap] Frontend built, dist at {dist_dir}")
    if os.path.exists(dist_dir):
        for f in os.listdir(dist_dir):
            print(f"  {f}")


def launch_bot():
    """Launch the bot with the repo dir as PYTHONPATH."""
    os.chdir(REPO_DIR)
    print(f"[bootstrap] Launching Storaboga Sound from {os.getcwd()}...")
    os.execv(sys.executable, [sys.executable, "-m", "bot.main"])


if __name__ == "__main__":
    print("=" * 50)
    print(" Storaboga Sound — Pterodactyl Bootstrap")
    print("=" * 50)
    clone_or_pull()
    self_update()
    copy_env()
    install_deps()
    install_node()
    build_frontend()
    launch_bot()
