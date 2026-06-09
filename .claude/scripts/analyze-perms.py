import json
import os
from pathlib import Path
from collections import Counter

home = os.path.expanduser("~")
transcript_dir = Path(home) / ".claude" / "projects" / "C--Users-kryst-Code-App-Builder"

# Get most recent 20 transcript files
files = sorted(
    [f for f in transcript_dir.glob("*.jsonl") if f.is_file()],
    key=lambda x: x.stat().st_mtime,
    reverse=True
)[:20]

print(f"Found {len(files)} transcripts to analyze\n")

bash_commands = Counter()
mcp_tools = Counter()

readonly_builtins = {
    'cal', 'uptime', 'cat', 'head', 'tail', 'wc', 'stat', 'strings', 'hexdump', 'od', 'nl',
    'id', 'uname', 'free', 'df', 'du', 'locale', 'groups', 'nproc', 'basename', 'dirname',
    'realpath', 'cut', 'paste', 'tr', 'column', 'tac', 'rev', 'fold', 'expand', 'unexpand',
    'fmt', 'comm', 'cmp', 'numfmt', 'readlink', 'diff', 'true', 'false', 'sleep', 'which',
    'type', 'expr', 'seq', 'tsort', 'pr', 'echo', 'ls', 'cd', 'pwd', 'whoami', 'alias',
    'git', 'gh', 'rg', 'grep', 'egrep', 'fgrep', 'find', 'fd', 'jq'
}

for file in files:
    try:
        with open(file, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                try:
                    obj = json.loads(line)
                    messages = obj.get('messages', [])
                    for msg in messages:
                        if msg.get('role') == 'assistant':
                            content = msg.get('content', [])
                            for item in content:
                                if item.get('type') == 'tool_use':
                                    tool_name = item.get('name', '')
                                    if tool_name == 'Bash':
                                        cmd = item.get('input', {}).get('command', '')
                                        if cmd:
                                            # Extract main command, removing sudo
                                            cleaned = cmd.lstrip()
                                            if cleaned.startswith('sudo '):
                                                cleaned = cleaned[5:].lstrip()
                                            parts = cleaned.split()
                                            if parts:
                                                main_cmd = parts[0]
                                                # Count all bash commands, not just readonly
                                                bash_commands[main_cmd] += 1
                                    elif tool_name.startswith('mcp__'):
                                        # Count all MCP tools
                                        mcp_tools[tool_name] += 1
                except json.JSONDecodeError:
                    pass
    except Exception as e:
        pass  # Silently skip errors

print("Top Bash commands (count >= 3):")
for cmd, count in bash_commands.most_common(20):
    if count >= 3:
        print(f"  {cmd}: {count}")

print("\nTop MCP tools (count >= 3):")
for tool, count in mcp_tools.most_common(10):
    if count >= 3:
        print(f"  {tool}: {count}")
