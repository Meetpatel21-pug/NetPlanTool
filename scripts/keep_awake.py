#!/usr/bin/env python3
"""
NetPlanTool - Render 24/7 Keep-Awake Pinger Script
--------------------------------------------------
Render's free tier spins down web services after 15 minutes of inactivity.
This script periodically sends an HTTP GET request to your Render web service's
health check endpoint to keep it awake indefinitely with 0 cold starts.

Usage:
    python scripts/keep_awake.py --url https://your-app.onrender.com/api/health
    python scripts/keep_awake.py --url https://your-app.onrender.com/api/health --interval 600

Environment Variable Alternative:
    set RENDER_APP_URL=https://your-app.onrender.com/api/health
    python scripts/keep_awake.py
"""

import argparse
import datetime
import os
import sys
import time
import urllib.error
import urllib.request

DEFAULT_INTERVAL_SECONDS = 600  # 10 minutes (Render spins down after 15 min)
DEFAULT_TIMEOUT_SECONDS = 30


def ping(url: str, timeout: int = DEFAULT_TIMEOUT_SECONDS) -> bool:
    """Send an HTTP GET request to the target URL and return True if successful."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "NetPlanTool-KeepAwake/1.0 (+https://github.com/Meetpatel21-pug/NetPlanTool)",
            "Accept": "application/json",
        },
    )

    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            latency_ms = int((time.time() - start_time) * 1000)
            status_code = response.getcode()
            print(f"[{timestamp}] [SUCCESS] HTTP {status_code} | Latency: {latency_ms}ms | Target: {url}")
            return True
    except urllib.error.HTTPError as exc:
        latency_ms = int((time.time() - start_time) * 1000)
        # Even a 4xx or 5xx response hits Render's edge proxy and resets the sleep timer!
        print(f"[{timestamp}] [WARNING] HTTP {exc.code} {exc.reason} | Latency: {latency_ms}ms | Render proxy was reached & kept awake!")
        return True
    except urllib.error.URLError as exc:
        latency_ms = int((time.time() - start_time) * 1000)
        print(f"[{timestamp}] [ERROR] Connection failed: {exc.reason} | Target: {url}", file=sys.stderr)
        return False
    except Exception as exc:
        print(f"[{timestamp}] [ERROR] Unexpected exception: {exc}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="NetPlanTool Render Keep-Awake Pinger")
    parser.add_argument(
        "--url",
        type=str,
        default=os.environ.get("RENDER_APP_URL", ""),
        help="Target Render web service URL (e.g. https://netplantool.onrender.com/api/health)",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=int(os.environ.get("PING_INTERVAL", DEFAULT_INTERVAL_SECONDS)),
        help=f"Interval between pings in seconds (default: {DEFAULT_INTERVAL_SECONDS}s / 10 minutes)",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Send a single ping and exit immediately (useful for CI/CD or crontab)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT_SECONDS,
        help="HTTP request timeout in seconds (default: 30s)",
    )

    args = parser.parse_args()

    url = args.url.strip()
    if not url:
        print("=" * 70, file=sys.stderr)
        print("ERROR: Target URL is required!", file=sys.stderr)
        print("Provide it via --url or set the RENDER_APP_URL environment variable.", file=sys.stderr)
        print("Example:", file=sys.stderr)
        print("  python scripts/keep_awake.py --url https://netplantool.onrender.com/api/health", file=sys.stderr)
        print("=" * 70, file=sys.stderr)
        sys.exit(1)

    # Normalize URL if endpoint path omitted
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    if not (url.endswith("/api/health") or url.endswith("/health")):
        url = url.rstrip("/") + "/api/health"

    print("=" * 70)
    print("NetPlanTool - Render Keep-Awake Service Running")
    print(f"Target URL : {url}")
    print(f"Interval   : {args.interval}s ({args.interval // 60}m {args.interval % 60}s)")
    print(f"Mode       : {'Single-shot ping' if args.once else 'Continuous keep-awake loop (Ctrl+C to stop)'}")
    print("=" * 70)

    if args.once:
        success = ping(url, timeout=args.timeout)
        sys.exit(0 if success else 1)

    try:
        while True:
            ping(url, timeout=args.timeout)
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n[INFO] Keep-awake pinger stopped by user.")
        sys.exit(0)


if __name__ == "__main__":
    main()
