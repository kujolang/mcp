# Operational Deployment Guide

This guide describes operational guidance for remote deployments of the MCP server.
It is a deployment baseline, not a claim that hosted production deployment has been fully certified in this repository.

## 1. Start From the Deployment Baseline

- Use `mcp-server.production.example.json` as a baseline.
- Copy it to your runtime config location as `mcp-server.json`.
- Replace `auth.token` with a long random secret before startup.

## 2. Network and TLS

- Run the MCP service on a private network.
- Put a reverse proxy or ingress in front of it.
- Terminate TLS at the proxy so clients only use HTTPS.
- Allow public access only to the proxy layer.

## 3. Authentication

- Keep `auth.enabled` set to `true` for remote deployments.
- Rotate the token periodically.
- Do not store real secrets in source control.

## 4. Request Guardrails

- Keep `http.max_request_body_bytes` enabled and bounded.
- Keep `http.rate_limit_enabled` set to `true`.
- Tune `http.rate_limit_per_minute` to your expected client volume.

## 5. Multi-Instance Deployments

The built-in limiter is process-local.

For multiple service instances, enforce throttling at your gateway or load balancer so limits are shared across all instances.

## 6. Filesystem Scope

- Keep `permissions.allowed_directories` as narrow as possible.
- Use dedicated service data paths instead of broad system paths.
- Maintain deny-first `read_only_patterns` coverage for sensitive file classes.

## 7. Verification

Run the full suite after changing security or deployment controls:

```bash
bash tests/run_all_tests.sh
```
