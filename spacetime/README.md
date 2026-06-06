# Confidex AI — SpacetimeDB Real-Time Deal Room Backend

A [SpacetimeDB](https://spacetimedb.com/) v2.4.1 module providing the real-time backend for the
Confidex AI deal room platform. Includes a Rust module with 7 tables and 6 reducers,
plus a standalone Python AI agent client.

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│  Frontend / Client  │────▶│  SpacetimeDB Module  │
│  (React, Python…)   │     │  (Rust → WASM)       │
└─────────────────────┘     └──────────┬──────────┘
                                       │
                                       │ subscribes
                                       ▼
                              ┌─────────────────────┐
                              │  AI Agent (Python)   │
                              │  Polls AnalysisReq-  │
                              │  uest, runs GLM-4    │
                              │  (simulated), sub-   │
                              │  mits results        │
                              └─────────────────────┘
```

## Module Structure

```
spacetime/
├── Cargo.toml          # Rust module manifest
├── src/lib.rs          # Tables + Reducers
├── agent.py            # Python AI agent client
├── requirements.txt    # Python dependencies
├── README.md           # This file
└── spacetime.json      # SpacetimeDB project config
```

## Tables (7)

| Table | Key | Description |
|---|---|---|
| `DealRoom` | `deal_id` | Top-level deal container with state machine |
| `DealParticipant` | `participant_id` | Deal participants with roles and access control |
| `Document` | `doc_id` | Document registry with content hashes and encrypted CIDs |
| `AnalysisRequest` | `request_id` | AI analysis task queue |
| `AnalysisResult` | `result_id` | AI analysis output with risk scores |
| `AccessLog` | `log_id` | Immutable audit trail for all access events |
| `AuditorAssignment` | `assignment_id` | Time-bound auditor document access grants |

## Reducers (6)

| Reducer | Purpose |
|---|---|
| `create_deal_room` | Create a new deal with participants |
| `upload_document` | Register a document in a deal room |
| `request_analysis` | Queue an AI analysis task |
| `submit_analysis` | Submit AI analysis results |
| `grant_access` | Grant time-bound access to an auditor |
| `log_access` | Record an immutable audit trail entry |

## Building

```bash
cd spacetime

# Build the Rust module (produces WASM)
spacetime build

# Publish to SpacetimeDB
spacetime publish confidex
```

## Running the AI Agent

```bash
pip install -r requirements.txt

# Run as a daemon
python agent.py

# Run a single poll cycle
python agent.py --once

# Custom host and interval
python agent.py --host http://localhost:3000 --interval 10
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SPACETIMEDB_HOST` | `http://localhost:3000` | SpacetimeDB HTTP API base URL |
| `SPACETIMEDB_DATABASE` | `confidex` | Target database name |
| `AGENT_ID` | `ai-agent-001` | Agent identity for request assignment |
| `POLL_INTERVAL` | `5` | Seconds between poll cycles |

## API Client Example

```python
# Example: Python client calling reducers
import httpx

BASE = "http://localhost:3000/v1/database/confidex"

# Create a deal room
httpx.post(f"{BASE}/reducers/create_deal_room", json={
    "args": [
        {"string": "Acme Corp Acquisition"},
        {"string": "owner-001"},
        {"string": '["buyer-001", "auditor-001"]'},
        {"u64": 2}
    ]
})

# Upload a document
httpx.post(f"{BASE}/reducers/upload_document", json={
    "args": [
        {"u64": 1},
        {"string": "financials_2025_q4.pdf"},
        {"string": "sha256:abc123..."},
        {"string": "ipfs://QmX..."},
        {"string": "Financial"}
    ]
})

# Request AI analysis
httpx.post(f"{BASE}/reducers/request_analysis", json={
    "args": [
        {"u64": 1},
        {"u64": 1},
        {"string": "ai-agent-001"},
        {"string": "DueDiligence"}
    ]
})
```

## Development

- **Rust edition**: 2024
- **SpacetimeDB**: 2.4.1
- **Build target**: `wasm32-unknown-unknown`
