# Data Classification

[Documentation index](../README.md) · [Validation availability](../validation.md)

## Read for this change

- [Classification Levels](#classification-levels)
- [Classification Summary](#classification-summary)
- [Data Categories](#data-categories)
- [Mechanical Enforcement](#mechanical-enforcement)
- [Initial Classification Rules](#initial-classification-rules)

## Purpose

This document defines the data-classification model used by Orion.

Its goals are to provide a consistent basis for deciding:

- who may access data;
- where data may be stored;
- whether data may appear in logs or telemetry;
- whether data may be provided to AI agents;
- whether data may be used in development or testing;
- how data should be transmitted;
- how data should be retained;
- how data should be redacted;
- how incidents involving the data should be handled.

Data classification is a security and privacy responsibility.

Data must not be treated as harmless merely because it is technically accessible.

---

## Core Principle

Data handling must follow the sensitivity of the data rather than the convenience of the implementation.

The default principle is:

```text
collect the minimum necessary data
        ↓
classify it
        ↓
restrict access appropriately
        ↓
retain it only as long as justified
```

Data should not be copied, logged, exported, or exposed merely because doing so may be useful later.

---

## Classification Levels

Orion defines four primary data-classification levels:

```text
PUBLIC
INTERNAL
CONFIDENTIAL
RESTRICTED
```

Every important data category should eventually have an explicit classification.

When classification is unclear, use the more restrictive reasonable classification until the data is reviewed.

---

## PUBLIC

`PUBLIC` data is intentionally approved for unrestricted disclosure.

Examples may include:

```text
public documentation
published API documentation
public website content
public product information
public release notes
open-source code when applicable
```

Public classification must be intentional.

The absence of a secret does not automatically make information public.

---

### PUBLIC Handling

Public data may generally be:

- displayed publicly;
- indexed;
- cached;
- included in public documentation;
- shared externally.

Normal integrity protections still apply.

Public data may still require protection against unauthorized modification.

---

## INTERNAL

`INTERNAL` data is intended for use within the project or organization but is not particularly sensitive if accidentally disclosed.

Examples may include:

```text
internal architecture documentation
development conventions
non-sensitive operational documentation
internal repository metadata
non-sensitive feature configuration
internal package structure
```

Internal data should not be published deliberately unless reviewed.

---

### INTERNAL Handling

Internal data may generally be accessible to authorized project contributors and development tooling.

It may be included in:

```text
internal documentation
development environments
CI output
AI-agent context
```

when doing so is appropriate.

It should not automatically be treated as public information.

---

## CONFIDENTIAL

`CONFIDENTIAL` data could cause privacy, security, commercial, or operational harm if disclosed improperly.

Examples may include:

```text
personal information
private customer information
non-public business information
private source repositories
internal incident details
private infrastructure information
non-public configuration
user-generated private content
```

Confidential data requires explicit access control and careful handling.

---

### CONFIDENTIAL Handling

Confidential data should:

- be accessible only when required;
- be encrypted in transit;
- be encrypted at rest where appropriate;
- be excluded from public output;
- be minimized in telemetry;
- be redacted where full values are unnecessary;
- not be copied into development environments without justification;
- follow defined retention requirements.

AI-agent access to confidential data must be intentional and governed by the same access principles applied to humans.

---

## RESTRICTED

`RESTRICTED` data represents the highest sensitivity level.

Disclosure or misuse could create significant security, privacy, financial, legal, or operational risk.

Examples include:

```text
passwords
authentication secrets
session tokens
API keys
private cryptographic keys
database credentials
payment credentials
recovery codes
secret signing material
highly sensitive personal data
```

Restricted data requires the strongest available protections.

---

### RESTRICTED Handling

Restricted data must:

- use strict least-privilege access;
- never be committed to source control;
- never be intentionally logged;
- never appear in traces;
- never appear in metrics labels;
- never appear in error messages;
- never appear in generated documentation;
- never be included in screenshots or support artifacts;
- never be copied into test fixtures;
- never be provided to AI agents unless an explicitly approved workflow requires it and appropriate controls exist.

Restricted data should normally be stored only in systems specifically designed to manage it.

---

## Classification Summary

| Classification | Disclosure Impact | Typical Access                            |
| -------------- | ----------------- | ----------------------------------------- |
| `PUBLIC`       | Minimal           | Unrestricted                              |
| `INTERNAL`     | Low               | Project contributors and approved tooling |
| `CONFIDENTIAL` | Moderate to high  | Need-to-know                              |
| `RESTRICTED`   | Severe            | Strict least privilege                    |

Classification determines the minimum required protection.

More restrictive handling may always be applied when justified.

---

## Data Categories

Classification level and data category are related but separate concepts.

A category explains what data represents.

A classification defines how carefully it must be handled.

For example:

```text
email address
    category: personal data
    classification: CONFIDENTIAL
```

Potential categories include:

```text
personal data
authentication data
authorization data
financial data
payment data
health data
user content
business data
operational data
security data
telemetry
secrets
```

---

## Personal Data

Personal data is information related to an identifiable individual.

Examples may include:

```text
name
email address
phone number
physical address
IP address
account identifier
device identifier
profile information
location information
```

Personal data should normally be treated as at least `CONFIDENTIAL` unless it is intentionally and lawfully public.

Whether a specific identifier constitutes personal data depends on context.

---

## Sensitive Personal Data

Some personal data requires stronger protection because disclosure may create greater harm or because applicable law gives it special treatment.

Examples may include data concerning:

```text
health
biometric identity
government identifiers
financial circumstances
religion
political beliefs
sexual life or orientation
race or ethnicity
```

Where such data exists, its classification should normally be `RESTRICTED` or subject to equivalent specialized controls.

The exact legal definition depends on applicable law and product jurisdiction.

---

## Authentication Data

Authentication data includes information used to establish identity.

Examples:

```text
password hashes
session tokens
refresh tokens
authentication cookies
one-time codes
recovery codes
authentication secrets
```

Authentication secrets are `RESTRICTED`.

Authentication-related metadata that does not grant access may have a lower classification depending on its content.

---

## Passwords

Plaintext passwords are `RESTRICTED`.

They must never be:

```text
logged
stored in plaintext
included in telemetry
included in error reports
included in support data
included in AI prompts
```

Applications should minimize the amount of time plaintext passwords exist in memory.

---

## Password Hashes

Password hashes are also `RESTRICTED`.

Although they are not plaintext credentials, disclosure may enable offline attacks.

They must not be treated as ordinary database fields.

---

## Session and Access Tokens

Session tokens, access tokens, refresh tokens, bearer tokens, and equivalent credentials are `RESTRICTED`.

They must never appear intentionally in:

```text
logs
traces
error reports
metrics
analytics
generated documentation
support tickets
```

Telemetry infrastructure should actively redact common credential locations.

---

## API Keys and Secrets

Private API keys and application secrets are `RESTRICTED`.

Examples include:

```text
provider API keys
database passwords
OAuth client secrets
webhook secrets
signing secrets
encryption keys
```

They must be provided through approved secret-management mechanisms.

They must never be committed to the repository.

---

## Public Keys and Public Identifiers

The word `key` does not automatically imply restricted data.

For example:

```text
public cryptographic key
public client identifier
publishable provider key
```

may be intentionally public.

Classification depends on whether possession of the value grants sensitive capability.

Naming should make this distinction clear.

---

## Authorization Data

Authorization data may include:

```text
roles
permissions
policy assignments
tenant membership
resource ownership
```

Such data is generally `CONFIDENTIAL`.

Authorization policy itself may be `INTERNAL` or `CONFIDENTIAL` depending on whether its disclosure would create security risk.

---

## Financial Data

Financial information may include:

```text
account balances
transaction history
banking details
billing records
invoices
financial identifiers
```

Such data should generally be treated as at least `CONFIDENTIAL`.

Some financial credentials or payment information may be `RESTRICTED`.

---

## Payment Data

Payment data requires particular care.

Applications should avoid storing sensitive payment credentials whenever a specialized provider can retain them instead.

Examples of highly sensitive payment data may include:

```text
full payment card numbers
security codes
bank authentication credentials
payment-provider secrets
```

Such data should be considered `RESTRICTED`.

Provider-generated non-sensitive references may have a lower classification.

---

## User-Generated Content

User-generated content must not automatically be considered harmless.

It may contain:

```text
personal data
credentials
confidential documents
health information
financial information
arbitrary secrets
```

Therefore arbitrary user content should generally be treated as `CONFIDENTIAL` unless a product feature intentionally makes it public.

---

## Files and Attachments

Uploaded files inherit classification from their content and intended use.

The system must not assume that:

```text
image
PDF
text file
archive
```

is safe merely because the file type itself is ordinary.

File storage, telemetry, scanning, preview generation, and AI processing must respect the classification of the underlying content.

---

## Business Data

Non-public business information may include:

```text
pricing strategy
internal forecasts
private contracts
customer agreements
internal reports
operational plans
```

Such data is generally `CONFIDENTIAL`.

Publicly released business information may be `PUBLIC`.

---

## Operational Data

Operational data includes:

```text
service names
environment names
deployment metadata
health state
performance measurements
runtime configuration
```

This data may be `INTERNAL` or `CONFIDENTIAL` depending on its sensitivity.

Detailed infrastructure topology may require stronger classification than ordinary application health metrics.

---

## Security Data

Security-related data may include:

```text
security findings
vulnerability details
incident investigations
attack indicators
access-control configuration
security logs
```

Classification depends on the information.

Unresolved vulnerability details and sensitive incident information should generally be `CONFIDENTIAL` or `RESTRICTED`.

---

## Telemetry Data

Telemetry inherits the classification of the data it contains.

A log event is not automatically `INTERNAL` merely because it is a log.

For example:

```text
log containing orderId
```

may be `CONFIDENTIAL`.

A log containing:

```text
accessToken
```

would contain `RESTRICTED` data and represent a security defect.

Telemetry design must therefore control the fields being collected.

---

## Derived Data

Derived data may remain sensitive even when the original value is not directly present.

Examples include:

```text
behavior profiles
risk scores
analytics segments
aggregated user characteristics
inferences about individuals
```

Classification must consider what can be inferred from the derived information.

---

## Identifiers

Identifiers require classification based on what they reveal.

Examples:

```text
requestId
traceId
internal userId
email address
government ID
payment provider customer ID
```

These values have different risks.

Do not treat all identifiers as interchangeable.

---

### Internal Entity IDs

Internal identifiers such as:

```text
userId
orderId
tenantId
```

may generally be used in controlled telemetry when operationally necessary.

They should normally be treated as `CONFIDENTIAL` when they can be linked to private account information.

---

### Correlation IDs

Values such as:

```text
requestId
traceId
errorId
jobId
```

should be generated so that they do not encode sensitive information.

They may often be safely shown to users as support references.

---

## Data Classification and Logs

Logging policy must follow classification.

General guidance:

```text
PUBLIC
    → may be logged

INTERNAL
    → may usually be logged

CONFIDENTIAL
    → log only when justified and minimized

RESTRICTED
    → must not be logged
```

Structured fields should make it possible to control, review, and redact sensitive data.

---

## Data Classification and Traces

Trace attributes are production data.

The same classification rules apply to tracing as to logs.

Avoid attaching:

```text
request bodies
response bodies
authorization headers
tokens
user-generated content
```

to traces by default.

Prefer explicit safe attributes.

---

## Data Classification and Metrics

Metrics should generally contain aggregated information.

Metric labels must not contain `RESTRICTED` data.

Confidential high-cardinality values such as:

```text
userId
email
orderId
traceId
```

should normally not be used as metric dimensions.

---

## Data Classification and Error Reporting

Error-reporting systems may capture:

```text
stack traces
breadcrumbs
request metadata
user context
local variables
HTTP context
```

Automatic capture must be reviewed carefully.

Default SDK behavior must not be assumed to satisfy Orion's privacy policy.

Sensitive fields must be explicitly removed or prevented from being collected.

---

## Data Classification and AI Agents

AI agents are consumers of data.

They must follow the same classification and authorization principles as other tooling.

The fact that an agent could use data to improve debugging does not automatically justify providing that data.

---

### AI and PUBLIC Data

Public data may generally be provided to approved AI tooling.

---

### AI and INTERNAL Data

Internal project information may generally be provided to approved project AI agents when consistent with repository and organizational policy.

Examples include:

```text
source code
architecture documentation
tests
internal development conventions
```

when the corresponding repository is authorized for agent access.

---

### AI and CONFIDENTIAL Data

Confidential data should be provided to AI agents only when required for an authorized task and when the AI environment is approved to handle that data.

Prefer minimized context.

For example:

```text
userId
error code
trace information
```

may be preferable to supplying an entire customer record.

---

### AI and RESTRICTED Data

Restricted data must not be provided to AI agents by default.

Examples include:

```text
passwords
private API keys
session tokens
private cryptographic keys
payment credentials
```

If an exceptional workflow ever requires agent interaction with restricted information, it must be explicitly designed and approved.

It must not emerge accidentally through logs, files, environment dumps, or debugging output.

---

## Production Data

Production data must not be copied into development or test environments by default.

If production-derived data is required for debugging, prefer:

```text
synthetic reproduction
minimal extracted data
anonymized data
pseudonymized data
redacted samples
```

before copying raw production data.

Any exception requires explicit justification.

---

## Development Data

Development environments should use synthetic or purpose-created data whenever practical.

Developers should not require access to real customer information to perform routine development.

Fixtures and seed data must not contain real credentials or personal data copied from production.

---

## Test Data

Automated tests should use synthetic data.

Test fixtures must never intentionally contain:

```text
real passwords
real API keys
real access tokens
real customer records
real payment credentials
```

A test-secret value should be obviously non-production and incapable of granting access to real systems.

---

## Demo and Sample Data

Sample data included in the repository must be safe for public exposure unless the repository's classification explicitly allows otherwise.

Even in private repositories, sample data should normally be synthetic.

This reduces the risk of accidental publication later.

---

## Local Development

Local machines should not become uncontrolled replicas of production data.

Applications should minimize locally stored confidential information.

Local caches, database dumps, downloaded logs, and debugging artifacts must follow the same classification principles.

---

## Temporary Files

Temporary storage does not remove security requirements.

Sensitive temporary files must:

- have controlled access;
- be deleted when no longer needed;
- not be committed accidentally;
- not persist indefinitely through tooling caches.

---

## Clipboard and Screenshots

Copying data into a clipboard, screenshot, chat, issue, or support system creates another copy.

Restricted information must not be shared through such mechanisms.

Confidential information should be minimized and redacted when screenshots or support evidence are required.

---

## Source Control

Source control is not a secret-management system.

The repository must never intentionally contain `RESTRICTED` secrets.

This includes historical commits.

Examples:

```text
.env with credentials
private keys
provider secrets
database passwords
access tokens
```

If a secret is committed accidentally, deleting the current file is not sufficient.

The secret must be considered exposed and rotated according to incident procedures.

---

## Configuration Files

Configuration templates may contain placeholders.

Example:

```text
DATABASE_URL=<required>
```

They must not contain real restricted values.

Configuration documentation should describe where a value comes from without exposing the value itself.

---

## Environment Variables

Environment variables may carry secrets, but they are not automatically secure merely because they are environment variables.

Restricted environment values must not be:

```text
printed during startup
dumped during debugging
returned through diagnostics
included in telemetry
included in build output
```

Applications should access only the configuration they require.

---

## CI and Build Systems

CI systems may have access to credentials.

Secrets should be scoped narrowly and provided only to jobs that require them.

Build output must not echo secret values.

Pull requests from less-trusted contexts must not automatically gain access to privileged credentials.

---

## Generated Artifacts

Generated files inherit the classification of their source data.

Generated documentation must not accidentally expose:

```text
secrets
private configuration
production records
sensitive schema comments
private infrastructure information
```

Generation pipelines must apply classification rules intentionally.

---

## Database Schemas

Database structure itself is generally `INTERNAL` or `CONFIDENTIAL`.

Database documentation must not contain actual restricted values.

Schema comments should describe semantics rather than real data examples when examples could expose personal or sensitive information.

---

## Database Rows

Classification belongs to data semantics, not merely the containing table.

One table may contain fields with different classifications.

For example:

```text
users
├── id                 CONFIDENTIAL
├── display_name       CONFIDENTIAL
├── email              CONFIDENTIAL
├── password_hash      RESTRICTED
└── created_at         INTERNAL / CONFIDENTIAL depending on context
```

Field-level classification may therefore be necessary.

---

## Database Metadata

As Orion evolves, database schema metadata should eventually make sensitive fields machine-discoverable where practical.

A future schema may support metadata such as:

```text
classification
containsPersonalData
telemetryAllowed
redactionPolicy
```

The exact implementation depends on the selected database tooling.

---

## Data in Transit

Confidential and restricted information must use protected transport across untrusted networks.

Encryption requirements should follow modern platform standards and applicable security policy.

Sensitive protocols must not silently downgrade to unprotected transport.

---

## Data at Rest

Confidential and restricted data should use appropriate storage protections.

This may include:

```text
storage encryption
database encryption
encrypted backups
encrypted device storage
field-level encryption where justified
```

The required level depends on the data and threat model.

Encryption does not replace access control.

---

## Application-Level Encryption

Application-level or field-level encryption should be introduced when it provides meaningful protection beyond infrastructure encryption.

It should not be added indiscriminately.

Such encryption introduces concerns including:

```text
key management
rotation
search limitations
migration complexity
backup recovery
operational access
```

A significant encryption strategy should be documented through an ADR.

---

## Access Control

Data access should follow least privilege.

A user, service, developer, support operator, or AI agent should receive only the access required for its responsibility.

Physical availability of data does not imply authorization.

---

## Service Access

Backend applications should not automatically receive access to all organizational data.

As application boundaries mature, services and modules should receive only the data access required by their responsibilities.

---

## Administrative Access

Administrative access to production data should be exceptional, authenticated, authorized, and auditable.

Routine application development should not depend on unrestricted production database access.

---

## Database Administration

Database administrators may require broad technical access.

Such access should still be:

```text
controlled
auditable
limited to authorized operators
```

Broad access does not remove data-classification obligations.

---

## Data Minimization

Applications should collect only data that has a concrete product, operational, security, or legal purpose.

Before introducing a new stored field, ask:

1. Why do we need this data?
2. Who owns it?
3. What is its classification?
4. Who needs access?
5. How long must it exist?
6. Can a less sensitive representation satisfy the requirement?
7. May it appear in telemetry?
8. Does its collection introduce additional compliance obligations?

Unnecessary data creates unnecessary risk.

---

## Purpose Limitation

Data collected for one purpose should not automatically be reused for unrelated purposes.

For example:

```text
billing information
```

should not automatically become:

```text
analytics profile data
```

merely because the information is available.

New uses of sensitive data should be deliberate.

---

## Retention

Data should not be retained indefinitely by default.

Retention must eventually be defined according to:

```text
product requirements
legal requirements
security requirements
operational needs
privacy expectations
cost
```

Different data categories may require different retention periods.

---

## Telemetry Retention

Telemetry retention deserves separate consideration because telemetry can contain confidential information.

Potential categories include:

```text
application logs
security logs
traces
error reports
metrics
audit logs
```

Retention policies should be defined once the observability platform is selected.

---

## Data Deletion

Systems that store personal or confidential data should be designed so data can be deleted when policy or product requirements require it.

Deletion semantics may differ between:

```text
primary storage
cache
search index
object storage
backups
telemetry
analytics
```

Deletion requirements should be understood before promising behavior externally.

---

## Soft Delete

Soft deletion does not necessarily mean data has been deleted from a privacy perspective.

A record marked:

```text
deleted = true
```

still exists.

Soft delete should be used for business semantics where justified, not as a substitute for actual data-removal capabilities.

---

## Backups

Backups inherit the classification of the source data.

Backup systems must protect confidential and restricted data accordingly.

Backups may complicate deletion and retention requirements.

Backup policy should therefore be considered part of data lifecycle design.

---

## Data Export

Exporting data creates a new copy and potentially a new security boundary.

Exports containing confidential or restricted information should:

- require authorization;
- contain only required fields;
- use secure delivery mechanisms;
- avoid unnecessary persistence;
- be auditable where appropriate.

---

## Bulk Access

Bulk access to data creates greater risk than individual-record access.

Operations such as:

```text
full database export
customer list export
telemetry export
data warehouse copy
```

should receive additional scrutiny.

---

## Analytics

Analytics systems should receive only data required for their purpose.

Prefer:

```text
event name
internal anonymous or pseudonymous identifier
bounded properties
```

over:

```text
entire application records
request payloads
user-generated content
```

when detailed content is unnecessary.

---

## Data Warehouses

If analytical data stores are introduced, data classification still applies.

Moving data from the application database to a warehouse does not reduce its sensitivity.

Access, retention, and deletion policies must remain explicit.

---

## Caches

Cached data retains the classification of the original data.

Confidential values stored in:

```text
memory caches
distributed caches
browser caches
local mobile storage
desktop storage
```

require appropriate protection.

Cache expiration is not a replacement for authorization.

---

## Client Storage

Client devices are untrusted environments.

Sensitive data stored locally should be minimized.

Examples include:

```text
browser storage
mobile application storage
desktop configuration
local databases
```

Restricted credentials must use platform-appropriate secure storage where client-side possession is necessary.

---

## Browser Storage

Do not place restricted secrets in browser storage merely for convenience.

Browser storage mechanisms have different security characteristics.

The selected authentication architecture should define where credentials may safely exist.

---

## Mobile and Desktop Storage

Mobile and desktop applications may have access to operating-system secure-storage mechanisms.

Sensitive values should use appropriate platform facilities when local storage is required.

The existence of secure storage does not justify storing unnecessary secrets.

---

## Search Indexes

Search indexes contain copies of application data.

Indexed data retains its original classification.

Before indexing a field, consider:

```text
search necessity
access enforcement
retention
deletion propagation
provider exposure
```

---

## External Providers

Sending data to an external provider creates a new data-processing boundary.

Before transmitting confidential or restricted data, determine:

```text
what data is required
why it is required
provider security expectations
data retention
data residency where relevant
deletion behavior
subprocessor implications where relevant
```

Do not send entire application objects when only a small subset is needed.

---

## Webhooks

Webhook payloads should contain the minimum information required by the recipient.

Secrets used to authenticate webhooks are `RESTRICTED`.

Webhook bodies may contain confidential information and must be protected accordingly.

---

## Email

Email should not be treated as a secure channel for arbitrary restricted information.

Transactional emails should contain only information required for their user-facing purpose.

Sensitive account operations should prefer secure links or authenticated application flows rather than embedding excessive sensitive information directly in email.

---

## Notifications

Push notifications may appear on lock screens or shared devices.

Do not include highly sensitive information in notification content unless explicitly required and appropriately designed.

---

## Error Messages

Public error messages must not reveal confidential or restricted implementation or user data unnecessarily.

Avoid responses such as:

```text
Database connection failed for user admin at internal-db-01.
```

Prefer safe public errors with correlation identifiers.

---

## Audit Logs

Audit logs record security- or compliance-relevant actions.

Potential audit events may include:

```text
permission changes
administrative actions
sensitive data exports
authentication changes
security configuration changes
```

Audit logs differ from ordinary application logs.

They may require stronger integrity, access, and retention guarantees.

---

## Audit Log Content

Audit logs should capture enough information to answer:

```text
who
performed what action
on which resource
when
with what result
```

without unnecessarily storing sensitive payloads.

---

## Security Incidents

Exposure of confidential or restricted data may constitute a security incident.

Incident response should consider:

```text
data classification
scope
affected systems
affected users
duration
access history
containment
credential rotation
notification obligations where applicable
```

Detailed incident-response procedures will be documented separately.

---

## Secret Exposure

If a restricted credential may have been disclosed, assume compromise until evaluated.

Typical response includes:

```text
revoke or rotate
contain access
investigate usage
remove the exposed value
review how exposure occurred
prevent recurrence
```

Deleting a leaked secret from a repository or log does not restore the secrecy of the original value.

---

## Classification Inheritance

Derived artifacts inherit at least the sensitivity required by their content.

Examples:

```text
database dump
    inherits database data classification

screenshot
    inherits visible data classification

log export
    inherits contained log data classification

CSV export
    inherits exported field classifications

AI prompt
    inherits included context classification
```

Changing representation does not reduce sensitivity automatically.

---

## Aggregation

Combining individually low-risk data may create higher-risk information.

For example:

```text
timestamp
+ location
+ account identifier
+ behavior history
```

may reveal significantly more than any individual field.

Classification should consider aggregation risk.

---

## Pseudonymization

Replacing direct identifiers with alternate identifiers may reduce exposure risk.

It does not automatically make data anonymous.

If the data can reasonably be linked back to an individual, it should still be treated as personal data.

---

## Anonymization

Data should be considered anonymous only when re-identification is not reasonably possible in the relevant context.

Simply removing a name or email address does not necessarily anonymize a dataset.

---

## Redaction

Redaction removes or masks sensitive portions of data before exposure.

Examples:

```text
Authorization: [REDACTED]

email:
j***@example.com

card:
**** **** **** 1234
```

Redaction behavior must reflect the actual sensitivity and use case.

Partial masking is not appropriate for every secret.

Authentication tokens should normally be removed entirely.

---

## Hashing

Hashing does not automatically make data non-sensitive.

Hashing predictable personal identifiers may still allow correlation or recovery through enumeration.

Classification must consider whether the original information can reasonably be inferred.

---

## Encryption

Encrypted data retains the classification of the plaintext.

Encryption is a protection mechanism.

It is not a change in data classification.

---

## Data Classification Metadata

As Orion evolves, classification should become machine-readable where practical.

Potential metadata may eventually exist in:

```text
database schema definitions
API schemas
event schemas
configuration schemas
telemetry definitions
```

Example conceptual metadata:

```text
field: email
classification: CONFIDENTIAL
category: PERSONAL
telemetry: prohibited
```

The exact format will depend on the selected stack.

---

## Mechanical Enforcement

Future tooling may validate rules such as:

```text
RESTRICTED fields cannot be logged

secret fields cannot appear in generated documentation

client-safe packages cannot import secret configuration

sensitive fields require explicit serialization decisions

telemetry schemas reject prohibited fields

production data fixtures are prohibited
```

Machine-readable classification increases the number of rules that can be enforced automatically.

---

## Naming Sensitive Fields

Sensitive fields should use clear names.

Prefer:

```text
passwordHash
accessToken
refreshToken
apiSecret
privateKey
```

over vague names such as:

```text
value
data
key
info
```

when the field has security significance.

Clear naming improves review and automated detection.

---

## Classification Review

Classification should be reviewed when:

```text
a new data type is introduced;
a field changes meaning;
data begins crossing a new boundary;
a new external provider receives data;
telemetry begins capturing new context;
AI-agent access changes;
retention requirements change.
```

Classification is part of schema and architecture evolution.

---

## Ownership

Every important data set should have an identifiable owner.

Ownership should answer:

```text
who defines the semantics?
who may change the schema?
who decides access policy?
who defines retention?
who responds to misuse or exposure?
```

Data without ownership tends to accumulate uncontrolled access and retention.

---

## Unknown Data

If data cannot be classified confidently, do not assume it is safe.

Use a conservative classification until ownership and semantics are understood.

This is particularly important for:

```text
legacy fields
external provider payloads
arbitrary metadata
user-uploaded content
free-form JSON
```

---

## Free-Form Metadata

Free-form metadata fields require special caution.

For example:

```text
metadata: Record<string, unknown>
```

allows callers to place arbitrary sensitive information into a field.

Such structures should not automatically be:

```text
logged
indexed
forwarded to providers
included in traces
```

without explicit controls.

---

## JSON and Arbitrary Payloads

Generic JSON columns or payloads obscure classification.

Use them only when their flexibility has concrete value.

Important known data should prefer explicit schemas where practical.

Explicit schemas improve:

```text
validation
documentation
classification
redaction
migration
AI reasoning
```

---

## Data Classification in APIs

Public and internal API schemas should make sensitive fields explicit.

An API should return only fields the consumer requires.

Avoid:

```text
load full database object
    ↓
serialize everything
```

Prefer deliberate response schemas.

---

## Data Classification in Events

Events should contain the minimum information consumers require.

Do not publish entire entities merely because event infrastructure makes doing so convenient.

Event data may be retained or copied across many systems.

Smaller contracts reduce exposure.

---

## Data Classification in SDKs

Generated SDKs should expose only fields present in supported contracts.

Server-only restricted data must never appear in client SDK schemas.

---

## Data Classification in Documentation

Documentation should use synthetic values in examples.

Avoid examples containing actual:

```text
customer names
email addresses
credentials
tokens
production identifiers
production infrastructure addresses
```

Use clearly fictional examples.

---

## Data Classification in Support Workflows

Support workflows may require customer context.

Provide the minimum data required to resolve the issue.

Support access should not automatically imply unrestricted access to production records or telemetry.

---

## Data Classification in AI-Assisted Debugging

A preferred AI-assisted debugging flow is:

```text
errorId
    ↓
sanitized error metadata
    ↓
trace
    ↓
redacted structured logs
    ↓
relevant source code
```

rather than:

```text
full user account
+ raw request payload
+ environment dump
+ database record
```

The debugging workflow should be designed around minimal necessary evidence.

---

## Security Review Triggers

Additional security review should be considered when a change introduces:

```text
RESTRICTED data
new personal-data collection
new external data processor
new bulk export capability
new authentication credentials
new encryption strategy
new production data access path
new AI access to confidential data
```

The exact review process will be defined later.

---

## Initial Classification Rules

Until more specific policies exist, Orion adopts the following rules:

1. Data must be classified according to its sensitivity.
2. Unknown data must not be assumed safe.
3. Secrets and authentication credentials are `RESTRICTED`.
4. Personal and private user data are normally at least `CONFIDENTIAL`.
5. Restricted data must never be intentionally logged.
6. Production data must not be copied into development environments by default.
7. Test data should be synthetic.
8. Telemetry inherits the classification of the data it contains.
9. AI agents follow the same data-access principles as human tooling.
10. Sensitive data collection must be minimized.
11. Encryption does not reduce classification.
12. Derived and aggregated data may remain sensitive.
13. External providers receive only the minimum data required.
14. Generated artifacts must not expose restricted information.
15. Classification should become machine-readable where practical.

---

## Future Documentation

This document should eventually be complemented by:

```text
docs/security/telemetry-redaction.md
docs/security/secrets-management.md
docs/security/authentication.md
docs/security/authorization.md
docs/security/data-retention.md
docs/security/encryption.md
docs/security/incident-response.md
docs/security/production-access.md
```

The exact set of documents should grow according to real system requirements.

---

## Future Machine-Readable Model

As Orion's schema and tooling become concrete, data classification should ideally become part of canonical machine-readable definitions.

For example:

```text
User.email
    classification: CONFIDENTIAL
    category: PERSONAL
    loggable: false

User.passwordHash
    classification: RESTRICTED
    category: AUTHENTICATION
    loggable: false
    exportable: false
```

From such metadata, Orion could eventually derive or validate:

```text
database documentation
telemetry redaction
API exposure
data inventories
security checks
documentation
```

This should be introduced only when the selected technology stack supports it cleanly.

---

## Summary

Orion uses four primary data classifications:

```text
PUBLIC
INTERNAL
CONFIDENTIAL
RESTRICTED
```

The classification determines the minimum protection required.

The central rules are:

```text
collect less
expose less
retain less
grant less access
```

while preserving enough information for the system to function and remain diagnosable.

Sensitive data must not leak through secondary systems such as:

```text
logs
traces
error reports
metrics
analytics
AI prompts
documentation
test fixtures
```

Security is not achieved solely by protecting the primary database.

Every copy of data creates another security responsibility.

Orion should therefore make data classification explicit, discoverable, and eventually mechanically enforceable.
