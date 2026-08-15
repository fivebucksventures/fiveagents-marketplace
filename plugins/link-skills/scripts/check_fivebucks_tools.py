#!/usr/bin/env python3
"""
Drift gate: every `fivebucks_*` tool a skill tells the agent to call must
actually exist in fiveagents-gateway.

WHY
---
Skills are written against the tool surface the author believed was shipping.
Twice now that has drifted from reality:

  * v2.20.0 of seo-researcher told the agent that `fivebucks_research_topic`
    returns `serpSourceId`s. It does not — it returns clusters — so every run
    of the skill broke at the next step. Caught by a human, in production.
  * seo-researcher Step 6 asked the agent to report "competitor angles" from
    `fivebucks_analyze_serp_cluster`, which is an LLM topic analysis and
    structurally cannot return competitors. A customer concluded the product
    could not find competitors at all, when `fivebucks_find_competitors`
    does exactly that in a different scope.

The first class of bug — naming a tool that does not exist — is mechanically
checkable, so check it.

USAGE
-----
Regenerate the vendored inventory from a local gateway checkout:
    python check_fivebucks_tools.py --update --gateway ../../fiveagents-gateway

Validate skills against the committed inventory (what CI runs):
    python check_fivebucks_tools.py --check

The inventory is vendored rather than fetched so CI stays hermetic and does not
need cross-repo credentials. Regenerate it whenever the gateway adds or renames
a tool — the gateway's release checklist should say so.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PLUGIN_ROOT = HERE.parent
INVENTORY = PLUGIN_ROOT / "fivebucks-tools.json"
SKILLS_DIR = PLUGIN_ROOT / "skills"
AGENT_DOC = PLUGIN_ROOT / "agents" / "link.md"

# Tool registrations in the gateway look like:  server.registerTool(\n  "fivebucks_x",
REGISTER_RE = re.compile(r'registerTool\(\s*["\'](fivebucks_[a-z0-9_]+)["\']')
# Any fivebucks_* mention in prose, backticked or bare.
REFERENCE_RE = re.compile(r"\bfivebucks_[a-z0-9_]+\b")

# `fivebucks_*` identifiers that are deliberately NOT tools — plugin userConfig
# keys, env var names, and the like. Kept as an explicit list rather than a
# looser regex so a genuinely misspelled tool name still fails the gate.
# Adding an entry here is a claim that the identifier is not meant to be called.
NON_TOOL_IDENTIFIERS = {
    "fivebucks_api_key",  # plugin.json userConfig entry
}


def scan_gateway(gateway_root: Path) -> list[str]:
    tools_dir = gateway_root / "lib" / "tools"
    if not tools_dir.is_dir():
        sys.exit(f"error: no lib/tools directory under {gateway_root}")

    found: set[str] = set()
    for path in sorted(tools_dir.glob("*.ts")):
        found.update(REGISTER_RE.findall(path.read_text(encoding="utf-8")))

    if not found:
        sys.exit(f"error: found no registerTool() calls under {tools_dir}")
    return sorted(found)


def load_inventory() -> set[str]:
    if not INVENTORY.exists():
        sys.exit(
            f"error: {INVENTORY.name} is missing. Regenerate it with:\n"
            f"  python {Path(__file__).name} --update --gateway ../../fiveagents-gateway"
        )
    return set(json.loads(INVENTORY.read_text(encoding="utf-8"))["tools"])


def docs_to_check() -> list[Path]:
    paths = sorted(SKILLS_DIR.glob("*/SKILL.md"))
    if AGENT_DOC.exists():
        paths.append(AGENT_DOC)
    return paths


def check() -> int:
    known = load_inventory()
    failures: list[str] = []

    for doc in docs_to_check():
        text = doc.read_text(encoding="utf-8")
        referenced = set(REFERENCE_RE.findall(text)) - NON_TOOL_IDENTIFIERS
        unknown = sorted(referenced - known)
        for tool in unknown:
            rel = doc.relative_to(PLUGIN_ROOT)
            # Word-boundary match — a plain `in` test reports the line of a
            # longer tool that merely contains this one as a prefix
            # (fivebucks_research_top_ranking vs ..._rankings), pointing the
            # reader at the wrong line.
            word = re.compile(rf"\b{re.escape(tool)}\b")
            line = next(
                (i for i, l in enumerate(text.splitlines(), 1) if word.search(l)), 0
            )
            failures.append(f"  {rel}:{line}  references unknown tool `{tool}`")

    if failures:
        print("Skills reference fivebucks tools that do not exist in the gateway:\n")
        print("\n".join(failures))
        print(
            "\nEither the tool name is wrong, or the gateway shipped a rename and "
            f"{INVENTORY.name} needs regenerating:\n"
            f"  python plugins/link-skills/scripts/{Path(__file__).name} "
            "--update --gateway ../../fiveagents-gateway"
        )
        return 1

    print(f"OK — every fivebucks_* reference across {len(docs_to_check())} docs exists in the gateway.")
    return 0


def update(gateway_root: Path) -> int:
    tools = scan_gateway(gateway_root)
    INVENTORY.write_text(
        json.dumps(
            {
                "_comment": (
                    "Vendored inventory of fivebucks_* tools exposed by "
                    "fiveagents-gateway. Regenerate with scripts/"
                    f"{Path(__file__).name} --update. Do not hand-edit."
                ),
                "tools": tools,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {INVENTORY.relative_to(PLUGIN_ROOT)} with {len(tools)} tools.")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true", help="validate skills (CI mode)")
    ap.add_argument("--update", action="store_true", help="regenerate the inventory")
    ap.add_argument(
        "--gateway",
        type=Path,
        default=Path("../fiveagents-gateway"),
        help="path to a fiveagents-gateway checkout (with --update)",
    )
    args = ap.parse_args()

    if args.update:
        return update(args.gateway.resolve())
    return check()


if __name__ == "__main__":
    raise SystemExit(main())
