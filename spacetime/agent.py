#!/usr/bin/env python3
"""
Confidex AI Agent — SpacetimeDB AI Agent Client

This agent connects to a SpacetimeDB instance, subscribes to pending
AnalysisRequest records, performs AI analysis (simulated GLM-4),
and submits results back via the submit_analysis reducer.

Usage:
    python agent.py [--host HOST] [--interval SECONDS]

Environment variables:
    SPACETIMEDB_HOST   — SpacetimeDB HTTP API host (default: http://localhost:3000)
    POLL_INTERVAL      — Poll interval in seconds (default: 5)
    AGENT_ID           — This agent's identity string (default: ai-agent-001)

In production, replace the simulated GLM-4 call with a real AI inference
pipeline (e.g., GLM-4 API, OpenAI, local model).
"""

import json
import logging
import os
import time
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
logger = logging.getLogger("confidex-agent")


# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

@dataclass
class Config:
    host: str = os.environ.get("SPACETIMEDB_HOST", "http://localhost:3000")
    poll_interval: int = int(os.environ.get("POLL_INTERVAL", "5"))
    agent_id: str = os.environ.get("AGENT_ID", "ai-agent-001")
    database: str = os.environ.get("SPACETIMEDB_DATABASE", "confidex")


# ──────────────────────────────────────────────
# SpacetimeDB HTTP Client
# ──────────────────────────────────────────────

class SpacetimeDBClient:
    """Minimal HTTP client for SpacetimeDB reducer calls and table queries."""

    def __init__(self, config: Config):
        self.config = config
        self.base_url = f"{config.host}/v1/database/{config.database}"
        self.client = httpx.Client(timeout=30.0)

    def _reducer_url(self, reducer_name: str) -> str:
        return f"{self.base_url}/reducers/{reducer_name}"

    def _table_url(self, table_name: str) -> str:
        return f"{self.base_url}/tables/{table_name}/rows"

    def call_reducer(self, name: str, args: list[Any]) -> dict:
        """Call a SpacetimeDB reducer with positional args."""
        payload = {"args": args}
        url = self._reducer_url(name)
        logger.debug("Calling reducer %s with %s", name, payload)
        resp = self.client.post(url, json=payload)
        resp.raise_for_status()
        return resp.json()

    def query_table(self, table: str, filter_expr: Optional[dict] = None) -> list[dict]:
        """Query rows from a table with optional filter."""
        url = self._table_url(table)
        params = {}
        if filter_expr:
            params["filter"] = json.dumps(filter_expr)
        resp = self.client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        # SpacetimeDB may return {"rows": [...]} or a plain list
        if isinstance(data, dict):
            return data.get("rows", [])
        return data

    def subscribe(self, query: str) -> list[dict]:
        """
        Execute a SQL-like subscription query.
        SpacetimeDB v2 uses the /v1/database/{db}/sql endpoint.
        """
        url = f"{self.base_url}/sql"
        resp = self.client.post(url, params={"query": query})
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            return data.get("rows", [])
        return data

    def close(self):
        self.client.close()


# ──────────────────────────────────────────────
# Simulated AI Analysis (GLM-4 stand-in)
# ──────────────────────────────────────────────

class AnalysisEngine:
    """
    Simulated AI analysis engine.

    In production, replace analyze() with a call to a real model:
    - GLM-4 API via zhipu.ai
    - OpenAI GPT-4
    - Local model via Ollama/Llama.cpp
    """

    ANALYSIS_PROMPTS = {
        "DueDiligence": {
            "summary": "Financial and legal due diligence completed. No material discrepancies found in the reported figures.",
            "risk_score": 0.15,
            "confidence": 0.88,
        },
        "Valuation": {
            "summary": "Valuation analysis based on DCF and comparable company analysis. Estimated fair value within acceptable range.",
            "risk_score": 0.25,
            "confidence": 0.82,
        },
        "RiskAssessment": {
            "summary": "Risk assessment identified moderate counterparty risk and standard market volatility exposure.",
            "risk_score": 0.45,
            "confidence": 0.75,
        },
    }

    def analyze(self, analysis_type: str, doc_metadata: dict) -> dict:
        """
        Perform analysis on the given document metadata.
        Returns analysis result with summary, risk_score, confidence, and findings.

        Replace this method with a real AI call:
            response = openai.ChatCompletion.create(
                model="glm-4",
                messages=[...],
            )
        """
        base = self.ANALYSIS_PROMPTS.get(
            analysis_type,
            self.ANALYSIS_PROMPTS["RiskAssessment"],
        )

        # Add some entropy so each analysis is slightly different
        jitter = (hash(str(time.time_ns())) % 100) / 1000.0

        findings = {
            "analysis_type": analysis_type,
            "document": doc_metadata.get("name", "unknown"),
            "doc_type": doc_metadata.get("doc_type", "unknown"),
            "key_findings": [
                "Verified document integrity via content hash",
                f"Analyzed {analysis_type.lower()} indicators",
                "No anomalies detected in structure",
            ],
            "recommendations": [
                "Proceed with standard due diligence workflow",
                "Flag for manual review if risk_score > 0.7",
            ],
            "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
        }

        return {
            "summary": base["summary"],
            "risk_score": min(1.0, max(0.0, base["risk_score"] + jitter)),
            "confidence": min(1.0, max(0.0, base["confidence"] - jitter * 0.5)),
            "findings": json.dumps(findings, indent=2),
        }


# ──────────────────────────────────────────────
# Agent Main Loop
# ──────────────────────────────────────────────

class ConfidexAgent:
    """Main agent that polls for pending analysis requests and processes them."""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config()
        self.client = SpacetimeDBClient(self.config)
        self.engine = AnalysisEngine()
        self._running = False
        logger.info(
            "Confidex AI Agent starting — host=%s agent=%s",
            self.config.host,
            self.config.agent_id,
        )

    def run_forever(self):
        """Main polling loop."""
        self._running = True
        logger.info("Agent polling every %ds for pending analysis requests", self.config.poll_interval)

        while self._running:
            try:
                self._poll_cycle()
            except Exception as e:
                logger.error("Poll cycle error: %s", e, exc_info=True)

            time.sleep(self.config.poll_interval)

    def stop(self):
        """Gracefully stop the agent."""
        self._running = False
        self.client.close()
        logger.info("Agent stopped")

    def _poll_cycle(self):
        """One poll cycle: fetch pending requests, process them."""
        pending = self._fetch_pending_requests()
        if pending:
            logger.info("Found %d pending analysis request(s)", len(pending))

        for req in pending:
            try:
                self._process_request(req)
            except Exception as e:
                logger.error("Failed to process request %s: %s", req.get("request_id"), e)
                self._fail_request(req)

    def _fetch_pending_requests(self) -> list[dict]:
        """
        Fetch all pending AnalysisRequest rows assigned to this agent.
        Uses SQL subscription query via SpacetimeDB HTTP API.
        """
        try:
            query = (
                f"SELECT * FROM AnalysisRequest "
                f"WHERE status = 'Pending' AND agent_id = '{self.config.agent_id}'"
            )
            rows = self.client.subscribe(query)
            return rows or []
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                # The database might not be published yet
                logger.debug("Database not found (yet) — skipping cycle")
                return []
            raise

    def _process_request(self, req: dict):
        """Process a single analysis request."""
        request_id = req["request_id"]
        doc_id = req["doc_id"]
        analysis_type = req["analysis_type"]
        deal_id = req["deal_id"]

        logger.info(
            "Processing request %s — doc=%s deal=%s type=%s",
            request_id, doc_id, deal_id, analysis_type,
        )

        # Fetch document metadata for context
        doc_metadata = self._fetch_doc_metadata(doc_id)
        if not doc_metadata:
            logger.warning("Document %s not found, failing request", doc_id)
            self._fail_request(req)
            return

        # Run analysis (simulated AI)
        logger.info("Running %s analysis on document '%s'...", analysis_type, doc_metadata.get("name"))
        result = self.engine.analyze(analysis_type, doc_metadata)

        # Submit result back to SpacetimeDB
        logger.info("Submitting analysis result for request %s", request_id)
        self.client.call_reducer("submit_analysis", [
            {"u64": request_id},
            {"string": result["summary"]},
            {"f64": result["risk_score"]},
            {"f64": result["confidence"]},
            {"string": result["findings"]},
        ])

        logger.info(
            "Request %s completed — risk=%.3f confidence=%.3f",
            request_id, result["risk_score"], result["confidence"],
        )

    def _fetch_doc_metadata(self, doc_id: int) -> Optional[dict]:
        """Fetch document metadata for context."""
        try:
            rows = self.client.subscribe(
                f"SELECT * FROM Document WHERE doc_id = {doc_id}"
            )
            if rows:
                return rows[0]
        except Exception as e:
            logger.debug("Could not fetch doc %s metadata: %s", doc_id, e)
        return None

    def _fail_request(self, req: dict):
        """Mark an analysis request as failed."""
        request_id = req["request_id"]
        logger.warning("Failing request %s", request_id)
        try:
            self.client.call_reducer("submit_analysis", [
                {"u64": request_id},
                {"string": "AI analysis failed due to processing error"},
                {"f64": 0.0},
                {"f64": 0.0},
                {"string": json.dumps({"error": "processing_failed", "request_id": request_id})},
            ])
        except Exception as e:
            logger.error("Failed to mark request %s as failed: %s", request_id, e)


# ──────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Confidex AI SpacetimeDB Agent")
    parser.add_argument("--host", default=None, help="SpacetimeDB HTTP API host")
    parser.add_argument("--interval", type=int, default=None, help="Poll interval seconds")
    parser.add_argument("--once", action="store_true", help="Run one poll cycle and exit")
    args = parser.parse_args()

    config = Config()
    if args.host:
        config.host = args.host
    if args.interval:
        config.poll_interval = args.interval

    agent = ConfidexAgent(config)

    try:
        if args.once:
            agent._poll_cycle()
            logger.info("Single cycle complete")
        else:
            agent.run_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        agent.stop()


if __name__ == "__main__":
    main()
