# Agent Instance

This is a new agent instance based on the 3-layer architecture defined in `AGENTE.MD`.

## Directory Structure
- `directives/`: Markdown SOPs (Layer 1).
- `execution/`: Python scripts (Layer 3).
- `.tmp/`: Intermediate files.

## Getting Started
1.  Copy `.env.template` to `.env` and fill in your API keys.
2.  Review the example directive in `directives/analyze_data.md`.
3.  Run the example script: `python execution/analyze_csv.py input.csv output.txt` (requires `input.csv` in the current directory).

## Adding New Capabilities
1.  Create a new directive in `directives/`.
2.  Write a Python script in `execution/` to perform the task.
3.  Test and iterate.
