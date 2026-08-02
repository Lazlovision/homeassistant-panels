#!/usr/bin/env python3
"""
Find and replace real IP addresses in workspace files.

Usage:
    python obfuscate_ips.py <real_ip> <fake_ip> [directory]

Example:
    python obfuscate_ips.py 192.168.1.100 10.200.100.5 F:\\AI\\pi

This script searches all .txt, .md, .yaml, .py files (and others) under the
given directory, replacing every occurrence of <real_ip> with <fake_ip>.

It handles binary-safe reading and writes only text lines.
"""
import sys
import os
from pathlib import Path


def find_and_replace(directory, real_ip, fake_ip):
    """Replace real_ip with fake_ip in all text files under directory."""
    extensions = {".txt", ".md", ".yaml", ".yml", ".py", ".js", ".json",
                  ".html", ".css", ".cfg", ".ini", ".log", ".toml"}
    
    replaced = []
    for root, dirs, files in os.walk(directory):
        # Skip .git directories
        dirs[:] = [d for d in dirs if not d.startswith(".git")]
        
        for name in files:
            filepath = Path(root) / name
            if filepath.suffix.lower() not in extensions:
                continue
            
            try:
                text = filepath.read_text(encoding="utf-8", errors="ignore")
                new_text = text.replace(real_ip, fake_ip)
                if new_text != text:
                    filepath.write_text(new_text, encoding="utf-8")
                    count = text.count(real_ip)
                    replaced.append((str(filepath.relative_to(directory)), count))
            except Exception as e:
                print(f"  Skipping {filepath}: {e}")
    
    return replaced


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    
    real_ip = sys.argv[1]
    fake_ip = sys.argv[2]
    directory = sys.argv[3] if len(sys.argv) > 3 else "."
    
    print(f"Obfuscating {real_ip} -> {fake_ip} in {directory}/")
    replaced = find_and_replace(directory, real_ip, fake_ip)
    
    for path, count in replaced:
        print(f"  Replaced {count} occurrence(s) in {path}")
    
    print(f"\nTotal files modified: {len(replaced)}")
