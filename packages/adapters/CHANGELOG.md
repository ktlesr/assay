# @ktlsr/assay-adapters

## 0.1.0

First published release.

The Claude Code adapter. Each attempt runs in an isolated `CLAUDE_CONFIG_DIR` with an allowlisted environment, and the host's own success report is cross-checked before a session counts as complete.

Part of [Assay](https://github.com/ktlesr/assay), a CI test runner for Agent
Skills. The four packages share a version number: they are components of one
SDK and are only tested together.
