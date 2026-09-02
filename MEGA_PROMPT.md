# Kujo Ability Universal Plugin and Enterprise Platform Implementation

## Role

You are the primary implementation agent responsible for taking Kujo Ability from its current v1.0.1 host-integration baseline to a production-ready, enterprise-grade, broadly distributable plugin and capability platform.

This is a multi-repository Kujo ecosystem project. Do not treat it as a single MCP adapter change. Inspect the repositories, preserve existing contracts, implement the work in reviewable phases, verify every material claim, and leave durable documentation and evidence.

Do not stop after producing another roadmap. Implement the approved work that can be completed locally, prepare external-release artifacts that require later approval, and record only genuine blockers that require credentials, marketplace review, infrastructure authority, legal decisions, or other unavailable external state.

## Product Objective

Create the experience that makes developers say:

> “Holy shit, Kujo has a plugin for everything.”

The target experience is:

1. A user finds Kujo Ability in Codex, Cursor, VS Code/GitHub Copilot, or another supported host.
2. The user installs it with one click or one command.
3. The user signs in through a browser or connects a local/customer-hosted gateway.
4. The host immediately discovers only the Abilities that principal may use.
5. The user can run useful CMS, SSG, and Kujo ecosystem workflows.
6. Sensitive effects receive clear, request-bound approval.
7. Every invocation returns a canonical, verifiable receipt.
8. Additional Ability Packs can be installed without rewriting host integrations.
9. The same Ability retains its meaning, safety properties, and receipt semantics across hosts.
10. Organizations can centrally govern identity, policy, plugins, Abilities, auditing, retention, and revocation.

## Current Verified Baseline

Begin by verifying this baseline against the current repositories and tests. Correct this document if repository evidence has changed.

- `kujolang/ability` owns the portable `kujo.ability/v1` definition contract and canonical runtime semantics.
- Kujo CMS is the current reference application gateway and owns bindings, authentication, authorization, approval policy, idempotency persistence, auditing, and application data.
- Kujo MCP contains:
  - canonical Ability-to-MCP projection;
  - explicit effect gating;
  - executable gateway helpers;
  - a tested STDIO bridge under `integrations/kujo-ability`;
  - current Codex plugin metadata;
  - Cursor, VS Code, and generic MCP configurations;
  - canonical receipt preservation;
  - adapter controls for invocation ID, idempotency key, and approval ID.
- The current v1.0.1 executable topology is:

```text
agent host
  -> local STDIO Kujo Ability bridge
  -> local or HTTPS application-owned Ability gateway
  -> application policy and handler
  -> canonical Ability receipt
```

- Current support proves connector-level operation. It does not yet prove:
  - one-click public installation;
  - full native UX in every host;
  - a Kujo-managed privileged execution service;
  - OAuth-based onboarding;
  - complete enterprise administration;
  - a broad catalog of independently versioned Ability Packs;
  - current-version end-to-end certification across every named host.
- `mcp.kujolang.ai` is a public, read-only ecosystem catalog. It must not receive customer credentials or become the privileged mutating gateway.

## Critical Architectural Decision

Do not build separate semantic implementations for every host.

The architecture must be:

```text
Canonical Kujo Ability contract and runtime
                  |
Application-owned handlers and policy
                  |
Universal local/remote execution plane
                  |
Portable Agent Plugin and MCP projection
                  |
Thin host-native experience layers
                  |
Independently versioned Ability Packs
```

Use three distinct parity goals:

1. **Semantic parity:** identical Ability ID, version, schemas, effects, idempotency contract, policy boundary, and receipt meaning everywhere.
2. **Protocol parity:** every certified host can discover, invoke, approve, cancel, retry, and inspect receipts through its supported transport.
3. **Experience parity:** each host receives the best installation, commands, prompts, skills, agents, rules, hooks, secret inputs, and approval experience its APIs support.

Host-specific packages are additive projections. They must never fork the canonical Ability definition or weaken server-side enforcement.

## Compatibility Model

Create and document three public support levels:

- **Certified native plugin:** marketplace distribution, host-specific UX, automated end-to-end certification, and supported lifecycle.
- **Certified MCP integration:** tested configuration and end-to-end MCP conformance without a richer native plugin.
- **Community-compatible MCP integration:** standards-compatible configuration that is not included in the maintained certification matrix.

Never claim universal native parity when a host supports only generic MCP. Never claim certification without current automated evidence.

## Repositories and Scope

Inspect the actual workspace before editing. Expected repositories may include:

- `ability`
- `mcp`
- `cms`
- `ssg`
- `agents-sdk`
- `pi`
- `kujo`
- `kennel`
- relevant Kujo ecosystem product repositories
- `kujolang.ai`
- `kujo-skills`

Determine ownership before adding code. Do not copy canonical schemas or runtime logic between repositories. Use pinned dependencies and conformance tests.

## Required Workstreams

### 1. Architecture, Inventory, and Contract Freeze

- Inventory the current Ability contract, runtime, CMS integration, MCP projection, bridge, host packages, tests, release state, and website claims.
- Create or update an architecture decision record covering:
  - canonical ownership;
  - local, customer-hosted, and Kujo-managed topologies;
  - portable plugin versus host-native overlays;
  - Ability Pack boundaries;
  - identity, approval, idempotency, and receipt ownership;
  - compatibility tiers;
  - version negotiation and deprecation.
- Define the exact compatibility window for Ability schema versions, MCP protocol versions, host package versions, gateway versions, and Ability Pack versions.
- Add drift checks so copied or divergent contracts cannot silently reappear.
- Preserve backward compatibility unless a breaking release is explicitly approved and documented.

Acceptance gates:

- One documented source of truth exists for each contract.
- Every consumer pins or negotiates the contract intentionally.
- Existing CMS, MCP, and Agents SDK conformance tests continue to pass.
- The support matrix distinguishes verified facts from planned support.

### 2. Portable Universal Agent Plugin

Create a canonical portable Agent Plugins 1.0 package, using the current official specification rather than assumptions from stale documentation.

It must include, where supported by the standard:

- a valid root plugin manifest;
- portable skills;
- MCP server configuration;
- packaged bridge/runtime entrypoint or supported remote MCP connection;
- plugin-root-safe paths;
- environment and secret input declarations;
- setup and diagnostics guidance;
- canonical prompts for discovery, safe reads, approvals, and receipt inspection;
- upgrade and compatibility metadata;
- license, changelog, security contact, and support links;
- deterministic package validation.

Package and distribution targets:

- versioned release archive;
- npm package supporting an `npx` workflow;
- optional container image for controlled customer deployments;
- checksums and signed provenance;
- SBOM;
- reproducible packaging in CI.

The intended generic onboarding command is:

```bash
npx kujo-ability connect
```

Implement an equivalent command only after verifying naming and package availability. It should detect supported hosts, configure selected scopes, test the gateway, and report available Abilities without printing secrets.

Acceptance gates:

- Package validates against the current Agent Plugins specification.
- No absolute developer-machine paths appear in release artifacts.
- Install, upgrade, disable, and uninstall are tested.
- Secrets are obtained from environment, secure host input, OS keychain, or approved secret manager—not committed configuration.
- The same portable package loads successfully in every host that claims Agent Plugins compatibility.

### 3. Codex Native Integration

Create and certify the best supported Codex package for the current Codex desktop app, CLI, and IDE extension.

Required work:

- validate and complete `.codex-plugin/plugin.json`;
- bundle the Ability skill and MCP server configuration;
- add clear starter prompts and discovery workflows;
- add diagnostics and health guidance;
- support user and project installation scopes;
- document organization/managed installation where current Codex controls permit it;
- ensure local STDIO and supported remote MCP modes work;
- define Codex tool approval defaults without treating host approval as server authorization;
- test environment forwarding, timeouts, cancellation, restart, upgrade, and uninstall;
- prepare marketplace or public directory submission artifacts;
- publish only when explicit external authorization and credentials are available.

Acceptance gates:

- Fresh-install tests pass in Codex desktop, CLI, and IDE extension.
- `/mcp` or the current equivalent reports a healthy connection.
- Principal-visible discovery is correct.
- Read execution, approval-required execution, approved write execution, denial, replay rejection, and receipt rendering pass end to end.
- Documentation makes clear that the plugin exposes application Abilities; it does not grant access to Codex internals.

### 4. Cursor Native Integration

Implement both the portable Agent Plugin path and a thin Cursor-native overlay where that materially improves the experience.

Include as supported by current Cursor documentation:

- Cursor plugin manifest;
- skills;
- MCP server configuration;
- Cursor rules;
- custom agents;
- commands;
- hooks only when deterministic lifecycle behavior is justified;
- variables and secure inputs;
- team marketplace configuration;
- enterprise distribution guidance;
- marketplace submission package.

Do not use rules or hooks to replace application policy. Hooks must not leak raw prompts, credentials, private content, or receipt payloads.

Acceptance gates:

- Local plugin installation works from a clean Cursor profile.
- Marketplace package passes the current Cursor review checklist locally where possible.
- Team installation and user installation paths are documented.
- Native commands and agents call the same canonical MCP tools and preserve receipts.
- Disable and uninstall stop the packaged MCP process and remove its tools cleanly.

### 5. VS Code and GitHub Copilot Integration

Implement the portable Agent Plugin plus supported `com.github.copilot` extensions.

Include as supported by current official documentation:

- Agent Plugins 1.0 package;
- MCP server configuration;
- Copilot custom agents;
- commands or prompt files;
- rules/instructions;
- carefully justified hooks;
- workspace recommendations;
- user and workspace installation;
- Agent Host-compatible configuration;
- GitHub Copilot CLI compatibility where available;
- enterprise policy and marketplace guidance.

Acceptance gates:

- Clean-profile installation succeeds.
- Tools appear in the MCP/tool configuration UI.
- Local and Agent Host execution paths are tested separately.
- Interactive secret inputs are not assumed to work in environments that cannot forward them.
- The same canonical receipts and policy results are preserved across local and hosted harnesses.

### 6. Other Hosts and SDK Projections

Build or certify integrations in this priority order, adjusting only when current evidence justifies a different order:

1. Kujo Pi native typed tools.
2. Kujo Agents SDK native tool projection.
3. Generic STDIO MCP clients.
4. Generic Streamable HTTP MCP clients.
5. Claude Code.
6. GitHub Copilot CLI if not covered above.
7. Windsurf.
8. Cline and Roo Code.
9. Continue.
10. Zed.
11. JetBrains-compatible AI hosts.

For each host:

- inspect current first-party documentation;
- classify it as certified native, certified MCP, or community-compatible;
- provide install/configuration artifacts;
- document unsupported host features honestly;
- add the host to automated testing only when repeatable execution is available;
- preserve canonical definitions and receipts.

### 7. Local, Customer-Hosted, and Managed Gateway

Maintain three supported deployment profiles.

#### Local

- loopback-only HTTP allowed;
- zero- or low-friction developer setup;
- clear process lifecycle;
- secure local secret storage;
- fixture mode for offline tests;
- diagnostics and cleanup.

#### Customer-hosted

- HTTPS required;
- documented reverse proxy and ingress requirements;
- customer identity provider integration;
- secret-manager integration;
- per-user and per-workload credentials;
- deployment templates;
- backup, restore, key rotation, upgrades, and rollback;
- observable health and audit export.

#### Kujo-managed

Design and implement a separate privileged service origin. Do not reuse `mcp.kujolang.ai`.

Required managed capabilities:

- OAuth 2.1 authorization-code flow with PKCE;
- protected-resource metadata;
- audience validation;
- short-lived tokens and refresh strategy;
- revocation;
- tenant-scoped catalog discovery;
- per-subject authorization;
- Streamable HTTP MCP where currently standardized and supported;
- approval service;
- idempotency store;
- canonical receipt and audit store;
- quotas and budgets;
- separate discovery and execution rate limits;
- regional and retention controls;
- webhook/event delivery where justified;
- operator support boundary;
- incident response, backup, restore, tenant export, tenant deletion, and disaster recovery.

Do not deploy public infrastructure, choose production domains, incur cloud charges, or publish credentials without explicit authorization. Produce deployable code, infrastructure templates, threat model, runbooks, and release gates locally when external authority is unavailable.

### 8. Authentication and Enterprise Control Plane

Implement the controls required before enterprise claims are permitted:

- OIDC and, where required, SAML SSO;
- SCIM provisioning and deprovisioning;
- RBAC and ABAC;
- organization, tenant, project, environment, human, and workload identities;
- central plugin and Ability allowlists;
- per-effect approval policies;
- token rotation and emergency revocation;
- tenant-scoped approvals, idempotency, receipts, quotas, and audit queries;
- encryption in transit and at rest;
- key-management integration;
- data retention and deletion;
- regional data residency controls;
- DLP/redaction boundaries;
- filesystem, network-egress, subprocess, and provider restrictions;
- central audit export and SIEM integration;
- operational dashboards and alerting;
- abuse prevention and anomaly detection;
- signed packages, dependency provenance, and SBOMs;
- vulnerability disclosure and patch policy;
- availability, recovery, and support objectives.

Create a threat model and obtain independent security review before declaring the managed service enterprise-ready.

### 9. Ability Developer Platform

Make third-party Ability development safe and repeatable.

Required deliverables:

- Kujo SDK improvements as needed;
- TypeScript SDK;
- Python SDK;
- evaluate Go only when demand or gateway architecture justifies it;
- `kujo ability init` or an evidence-backed equivalent;
- local development server;
- schema and definition validation;
- handler adapter interfaces;
- effect and permission review;
- fixture and offline mode;
- approval simulator;
- idempotency conflict tests;
- receipt validator;
- conformance test kit;
- documentation generator;
- package signing;
- publishing workflow;
- private registry support;
- public registry design;
- version, compatibility, deprecation, and revocation policy;
- complete example packs.

The intended developer experience is:

```bash
kujo ability init my-company.deploy
kujo ability test
kujo ability publish
```

Do not add these exact commands until the Kujo CLI ownership and command contracts are confirmed.

### 10. CMS Ability Pack

Preserve and certify the six current core capabilities:

- site inspection;
- content listing;
- SEO audit summary;
- single-entry SEO update;
- bulk SEO update;
- AI integration inspection.

Then design and implement bounded Abilities for high-value CMS workflows, subject to product and security review:

- content draft creation;
- content updating;
- preview and publication workflows;
- media inspection and management;
- redirects;
- taxonomy;
- plugin-contributed operations;
- search-index operations;
- migration workflows;
- backup and restore operations;
- analytics and reporting;
- user/role administration only with especially strict policy and approval boundaries.

Requirements for every CMS Ability:

- canonical definition;
- strict closed input/output schemas;
- explicit effects;
- justified idempotency mode;
- CMS-owned permission;
- bounded handler;
- principal-visible discovery;
- request-bound approval when required;
- canonical receipt;
- positive and negative end-to-end tests;
- documentation and examples.

### 11. SSG Ability Pack

The SSG is a first-class Ability consumer and provider. Implement a certified pack for:

- inspect site configuration;
- list routes and source content;
- validate content;
- build the site;
- build selected routes or shards;
- preview output;
- inspect broken links;
- inspect generated metadata;
- generate or validate sitemap, feeds, robots, and `llms.txt`;
- compare build output;
- run deployment readiness;
- export build artifacts;
- perform approval-controlled publication through a separate deployment binding;
- return build receipts and artifact manifests.

Keep deterministic local builds separate from external publication effects. Builds, file writes, network access, and deployment must declare different effects and policies where appropriate.

### 12. Kujo Ecosystem Ability Packs

Create a prioritized pack program rather than exposing every CLI command automatically.

Evaluate and implement bounded Abilities for:

- Howl;
- Lens;
- ShipCheck;
- Fence;
- Eval;
- Spec;
- Dispatch;
- Watchdog;
- RunLedger;
- RAG;
- Scent;
- Casefile;
- Kennel;
- MCP.

For each product:

- identify semantic workflows, not raw command passthrough;
- classify read, write, delete, and external effects;
- block arbitrary shell input;
- define policy and approval ownership;
- define artifacts and canonical receipts;
- provide offline fixtures;
- add cross-host examples;
- version the pack independently;
- document dependencies and compatibility.

Start with a small, convincing launch catalog. Do not lower quality to maximize pack count.

### 13. Registry, Discovery, and Trust

Build a registry model that supports:

- public and private Ability Packs;
- publisher identity;
- signed packages;
- checksums and provenance;
- version resolution;
- compatibility metadata;
- dependency metadata;
- permission/effect summaries before installation;
- trust status;
- deprecation and revocation;
- vulnerability advisories;
- organization allowlists;
- staged rollout and rollback;
- reproducible package retrieval;
- discoverability without exposing private tenant catalogs.

The registry must distinguish package discovery from principal-visible runtime Ability discovery.

### 14. Automated Host Certification

Create a repeatable certification harness and public evidence model.

Every certified release must test:

- clean installation;
- initialization and protocol negotiation;
- authentication;
- tenant- and principal-visible discovery;
- read execution;
- approval-required response;
- explicit approval issuance where supported;
- approved write execution;
- keyed idempotency;
- idempotency conflict rejection;
- approval replay rejection;
- denial behavior;
- timeout;
- cancellation;
- bounded response handling;
- secret redaction;
- receipt preservation;
- tenant isolation;
- upgrade;
- disable;
- uninstall;
- incompatible-version behavior.

Maintain current-version test targets for:

- Codex desktop;
- Codex CLI;
- Codex IDE extension;
- Cursor;
- VS Code/GitHub Copilot;
- Kujo Pi;
- Kujo Agents SDK;
- one generic STDIO MCP inspector;
- one generic Streamable HTTP MCP client.

Use fixtures or controlled test tenants. Never place production secrets or customer content in CI.

Publish a generated compatibility matrix whose badges are backed by test artifacts and timestamps.

### 15. Documentation, Website, and Launch Package

Update documentation only after behavior is implemented and verified.

Required documentation:

- top-of-page install instructions;
- local, customer-hosted, and managed quick starts;
- Codex installation and usage;
- Cursor installation and usage;
- VS Code/Copilot installation and usage;
- generic MCP installation;
- Kujo Pi and Agents SDK usage;
- Ability Pack authoring;
- approval and receipt concepts;
- security model;
- enterprise deployment;
- upgrade, rollback, disable, and uninstall;
- troubleshooting and diagnostics;
- compatibility matrix;
- changelogs and migration guides;
- MIT license consistency where applicable.

Update `kujolang.ai` with:

- the Ability product page;
- accurate host integration pages or sections;
- CMS and SSG integration sections;
- reciprocal ecosystem links;
- Ability Pack catalog or launch catalog;
- installation calls to action;
- architecture explanation;
- compatibility evidence;
- security and enterprise positioning;
- structured data, metadata, internal links, sitemap, feeds, `llms.txt`, and AI-search discoverability;
- Kujo-style generated dither hero assets;
- Howl social/showcase assets and captions.

Do not modify the separate writing-section content campaign unless explicitly authorized. Do not claim marketplace availability, managed service availability, certification, or enterprise readiness before the corresponding gate passes.

### 16. Release Engineering and Operations

Implement:

- independent semantic versioning for the contract, bridge, host plugins, gateway, and Ability Packs;
- automated changelogs;
- release notes;
- compatibility checks;
- signed artifacts;
- checksums;
- SBOMs;
- provenance attestations;
- dependency and vulnerability scanning;
- rollback instructions;
- canary and staged rollout where applicable;
- telemetry that excludes secrets and raw private content;
- support and incident runbooks;
- lifecycle and deprecation policy.

Marketplace publication, domain creation, production infrastructure changes, paid services, and public announcements require explicit authority. Prepare submission-ready artifacts and report the exact external action still needed.

## Security and Safety Invariants

These are non-negotiable:

- MCP clients and models are untrusted.
- Discovery permission is not execution permission.
- The server authorizes every invocation.
- Host confirmation is not a substitute for application authorization.
- Approval is bound to the exact Ability ID, version, definition digest, invocation ID, principal, tenant, and normalized input.
- One-time approvals cannot be replayed.
- Idempotency keys are scoped and cannot be reused with different input.
- Canonical input and output schemas fail closed.
- Arbitrary shell input is not exposed as an Ability.
- Filesystem, network, provider, and subprocess access are bounded at the handler layer.
- Tokens, prompts, raw customer content, handler secrets, and private outputs do not appear in descriptors, logs, telemetry, or public receipts.
- Every mutating or external effect is explicit.
- Public read-only catalogs and privileged execution planes remain separate.
- Tenant isolation is verified, not assumed.
- Remote non-loopback traffic uses HTTPS.
- Package installation does not silently grant broad privileges.

## Implementation Method

1. Inspect repository instructions and current worktree state before editing.
2. Preserve unrelated user changes.
3. Establish an immutable baseline of current tests, manifests, docs, and live claims.
4. Write or update a concrete implementation checklist with repository ownership and dependencies.
5. Work in small vertical slices that produce demonstrable value.
6. Prefer portable core behavior plus thin host overlays.
7. Add tests with each behavior change.
8. Keep fixtures offline and deterministic where possible.
9. Use current first-party host and protocol documentation; host plugin APIs change over time.
10. Run focused tests continuously and full release gates before claiming a milestone.
11. Use small, meaningful commits.
12. Push completed commits and leave every touched repository clean and synchronized.
13. Record blockers with evidence and the exact authority or external state needed.

Do not make one enormous cross-repository commit. Keep contract, adapter, gateway, pack, host, website, and release work reviewable.

## Recommended Release Sequence

### Release A: Universal Plugin Preview

Deliver:

- portable Agent Plugins 1.0 package;
- npm/`npx` installer or equivalent validated distribution;
- Codex package;
- Cursor package;
- VS Code/Copilot package;
- generic MCP configuration;
- CMS pack certification;
- initial SSG pack;
- automated host smoke tests;
- complete install and uninstall documentation.

Exit criteria:

- clean setup works without developer-specific paths;
- all three primary hosts discover and execute the same read-only Ability;
- one approval-gated write succeeds safely in controlled end-to-end tests;
- receipts match canonical semantics;
- packages validate and can be reproduced.

### Release B: Kujo Ability Managed Beta

Deliver:

- separate managed gateway service;
- browser-based OAuth onboarding;
- tenant control plane;
- remote MCP transport;
- approval and receipt services;
- organization/project selection;
- quotas, auditing, revocation, and operator runbooks;
- controlled beta deployment.

Exit criteria:

- tenant isolation and security gates pass;
- credentials can be revoked;
- no manual bearer-token copying is required for the supported managed flow;
- customer-hosted mode remains supported;
- incident, backup, restore, export, and deletion procedures are tested.

### Release C: Marketplace General Availability

Deliver:

- approved public distribution for targeted hosts;
- native commands, agents, rules, prompts, and justified hooks;
- signed release artifacts;
- generated public compatibility matrix;
- launch documentation, examples, dither heroes, Howl assets, and social package;
- initial high-quality Ability Pack catalog.

Exit criteria:

- marketplace installs pass on clean profiles;
- upgrade, disable, and uninstall pass;
- support and vulnerability channels are live;
- website claims match tested availability exactly.

### Release D: Enterprise General Availability

Deliver:

- SSO and SCIM;
- central policy administration;
- organization plugin/Ability controls;
- audit and SIEM export;
- regional and retention controls;
- reliability and disaster-recovery evidence;
- completed independent security assessment and remediations;
- documented availability and support objectives;
- expanded certified Ability Pack catalog.

Exit criteria:

- enterprise checklist passes with evidence;
- no unresolved critical/high security findings remain;
- restore and regional failure exercises pass;
- tenant lifecycle is proven from provisioning through deletion;
- enterprise claims receive explicit release approval.

## Required Verification

Use repository-specific test commands discovered from current instructions. At minimum, preserve and expand:

- canonical Ability schema and runtime tests;
- MCP projection and gateway tests;
- MCP full test suite;
- CMS contract and end-to-end tests;
- SSG build and validation tests;
- Agents SDK native projection tests;
- host package validators;
- authenticated end-to-end host tests;
- security regression suites;
- approval replay and idempotency conflict tests;
- timeout, cancellation, redaction, and tenant-isolation tests;
- package install/upgrade/uninstall tests;
- website build, link, accessibility, visual, SEO, and structured-data checks.

For every release claim, preserve:

- command or workflow used;
- timestamp;
- host and version;
- package and gateway versions;
- pass/fail result;
- artifact or report path;
- known limitations.

## Definition of Done

The full objective is complete only when:

- Kujo Ability has a validated portable package.
- Codex, Cursor, and VS Code/Copilot have certified installation paths and native experience layers.
- Generic MCP and Kujo-native SDK paths remain supported.
- Local, customer-hosted, and managed deployment profiles are implemented and documented at their claimed readiness levels.
- CMS and SSG have certified Ability Packs.
- A meaningful initial Kujo ecosystem pack catalog exists.
- Third-party developers have a supported SDK, conformance kit, and publishing path.
- Identity, authorization, approvals, idempotency, receipts, auditing, isolation, revocation, and retention meet the enterprise gates.
- Automated host certification produces a current public compatibility matrix.
- Install, sign-in, use, approve, receipt, upgrade, disable, and uninstall journeys pass from clean environments.
- Website and launch claims are supported by evidence.
- All touched repositories are tested, committed in small meaningful commits, pushed, synchronized, and clean.

Absolute feature equality across all hosts is not required when host APIs differ. The requirement is canonical semantic parity, certified protocol behavior, and the best safe native experience each host supports.

## Required Final Handoff

At the end of each implementation milestone, report:

1. What is now operational.
2. Which repositories and commits changed.
3. Exact verification run and results.
4. Which hosts are certified and at what support level.
5. Which Ability Packs are implemented and certified.
6. Security and enterprise gates completed.
7. External publication/deployment actions still awaiting authorization.
8. Known limitations and blockers with evidence.
9. The next smallest vertical slice.
10. Confirmation that touched worktrees are clean and pushed.

Do not report a planned artifact as shipped. Do not report configuration compatibility as native integration. Do not report a successful unit test as full host certification. Do not report enterprise readiness until the complete enterprise gate has passed.
