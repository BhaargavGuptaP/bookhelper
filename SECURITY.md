# Security Policy

We take the security of **BookHelper** seriously. Because the product is
designed to hold a user's personal library of documents, highlights, and
(eventually) AI-derived knowledge, a vulnerability here is not just a code
bug — it is a breach of trust. This document describes how to report
vulnerabilities, what is in scope, what to expect from us, and our
coordinated-disclosure policy.

---

## Supported versions

BookHelper is pre-`1.0` and ships from `main`. Security fixes are applied
to:

| Version | Status          | Security fixes |
| ------- | --------------- | -------------- |
| `0.1.x` | **Current**     | ✅ Yes         |
| `< 0.1` | Pre-release dev | ❌ No          |
| `main`  | Rolling         | ✅ Yes         |

Once `1.0` ships, this table will switch to the standard "current minor + N
previous minors" model, formalized in `GOVERNANCE.md`.

---

## Reporting a vulnerability

> **Please do not open a public GitHub issue, pull request, or discussion
> for security vulnerabilities.**

There are two preferred private channels:

1. **GitHub Private Vulnerability Reporting** _(recommended)._
   Open
   [`Security → Report a vulnerability`](https://github.com/BhaargavGuptaP/bookhelper/security/advisories/new)
   on the repository. This creates a private advisory only visible to
   maintainers and you.

2. **Email.** Send a report to **security@bookhelper.dev**. If that
   address is not yet active, you may DM the repository owner via their
   GitHub profile to request a current contact.

If your report is sensitive, you may PGP-encrypt the email. A public key,
once published, will be linked from this file under `Encryption`.

### What to include

Please include as much of the following as you can — the more we have, the
faster we can triage and fix:

- A clear description of the vulnerability and its impact.
- The affected component(s): `apps/web`, `apps/core-api`, one of the
  `packages/*`, infra, CI, dependencies, documentation, etc.
- The affected version, commit SHA, or tag.
- Reproduction steps, proof-of-concept code, or a minimal failing test
  case.
- Any logs, stack traces, or screenshots (with secrets redacted).
- Your assessment of severity (CVSS v3.1 vector welcome but not required).
- Whether the vulnerability is already public elsewhere.

You may report anonymously. If you’d like credit, tell us how you want to
be acknowledged in the advisory.

---

## Scope

### In scope

- Source code in this repository: `apps/`, `packages/`, root config.
- Build/CI pipeline in `.github/workflows/`.
- Default deployment topology described in
  [`ARCHITECTURE.md`](./ARCHITECTURE.md) when run with the configurations
  shipped here.
- Dependencies pinned in `pnpm-lock.yaml` (we will coordinate with
  upstream where appropriate).

### Out of scope

- Vulnerabilities in third-party hosting providers, browsers, or operating
  systems beyond our reasonable control.
- Issues that require an attacker to already have privileged local access
  to a victim’s machine.
- Social-engineering attacks against maintainers, contributors, or
  end-users.
- Volumetric DoS without an underlying vulnerability.
- Findings only present in user-modified forks of the project.
- Best-practice recommendations without a demonstrable security impact
  (please open a regular issue instead).

---

## Our response & disclosure process

We follow **coordinated disclosure**.

| Phase           | Target SLA (business days)                                       | What happens                                                                                                                                                                                           |
| --------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Acknowledge** | within **3** days                                                | We confirm receipt and start triage.                                                                                                                                                                   |
| **Triage**      | within **7** days                                                | We validate, classify severity, and assign an owner.                                                                                                                                                   |
| **Fix**         | within **30** days for High/Critical; **90** days for Medium/Low | We develop and review the fix in a private branch or security advisory.                                                                                                                                |
| **Release**     | as soon as the fix is verified                                   | We ship a patched release and (where appropriate) a backport.                                                                                                                                          |
| **Disclose**    | typically within **7 days** of the patched release               | We publish a [GitHub Security Advisory](https://github.com/BhaargavGuptaP/bookhelper/security/advisories) with a CVE if applicable, credit reporters who wish to be named, and link the fixing commit. |

We will keep you informed at each phase. If a fix is going to take longer
than the targets above, we will explain why and agree on a revised
timeline with you.

We will not take legal action against researchers who:

- Make a good-faith effort to comply with this policy.
- Report promptly and privately.
- Avoid privacy violations, destruction of data, and degradation of
  service while researching.
- Give us reasonable time to remediate before public disclosure.

---

## Hardening guidance for operators

If you self-host BookHelper, please also follow these baseline practices —
they are not vulnerabilities in BookHelper itself but failing to do them
will make your deployment unsafe:

- Run the latest patched minor version.
- Keep secrets out of source control. Use the `.env.example` template; do
  not commit real `.env` files.
- Terminate TLS at a hardened reverse proxy or load balancer.
- Configure the OIDC issuer and JWT audience explicitly. Reject tokens
  signed by anything else.
- Use object storage with bucket-level encryption-at-rest and least-
  privilege IAM. The local MinIO setup in `docker-compose.yml` is for
  development only.
- Enable database backups and verify restores.
- Rotate signing keys and database credentials regularly.

---

## Encryption

PGP key for `security@bookhelper.dev`: _to be published_ — until then,
plaintext email is acceptable. If you need stronger transport, use the
GitHub Private Vulnerability Reporting channel above.

---

## Credit

We are grateful to security researchers and the broader community for
their efforts in keeping BookHelper safe. Reporters who follow this policy
and whose reports lead to a fix will be acknowledged in the resulting
GitHub Security Advisory unless they request otherwise.

Thank you for helping keep BookHelper, and the people who use it, safe.
