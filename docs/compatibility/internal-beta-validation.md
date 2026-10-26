# Internal beta usability validation (SC-003)

**Protocol status:** Prepared in the repository for publication before recruitment. No participant
sessions have been recorded yet; this document does not claim an SC-003 result.

## Objective and pass criterion

Measure whether internal developers can register and trust the reference repository, receive an
actionable diagnostic result, and prepare a ready first workspace within five minutes, without
editing a configuration file. SC-003 passes only when at least 16 of 20 eligible participants
complete all three outcomes within five minutes with no configuration edit. Retain all started
attempts in the denominator, including failures, timeouts, and withdrawals after start.

## Eligibility and exclusions

Recruit at least 20 internal developers with routine terminal and Git experience who have not
previously completed this study. Each participant must begin with fresh user-private SpecTide
state and use the same documented compatible reference repository and preinstalled M0 tools.
Verify eligibility and environment readiness before timing starts.

An attempt may be excluded only before the participant invokes the first SpecTide command, and
only for an independently verified test-hardware or reference-repository provisioning failure
that prevents the study, or a participant withdrawal before starting. Record the evidence and
verification owner for every exclusion. Do not exclude a started attempt for a product, tool,
network, or user error.

## Procedure

1. Provision the documented reference repository, pinned SpecTide build, and required M0 tools.
2. Create fresh user-private SpecTide state and confirm the participant has routine terminal and
   Git experience and has not taken part before.
3. Give the participant the standard task: register/trust the repository, obtain an actionable
   diagnostic result, and prepare a ready first workspace. Do not coach or edit configuration.
4. Start timing when the participant invokes their first SpecTide command. Stop when the CLI
   reports the first workspace ready, or at five minutes if it has not.
5. Record whether any configuration file was edited, elapsed time, outcome, and sanitized
   environment metadata. Retain the full started attempt record even when the participant stops
   early.
6. After the cohort is complete, calculate completion rate as qualifying completions divided by
   all started attempts. Report excluded pre-start provisioning failures and withdrawals
   separately with evidence; do not include them in the denominator.

## Data handling

Use pseudonymous participant IDs. Do not collect source code, credentials, full environment
variables, browser data, or conversation transcripts. Sanitize tool and OS version metadata to
product-relevant versions. Store the record with the feature's validation evidence and restrict
access to the internal study team.

## Required attempt record

Record one row per eligible participant who starts, plus one exclusion row for each permitted
pre-start exclusion:

| Field                          | Value                                                      |
| ------------------------------ | ---------------------------------------------------------- |
| Participant ID                 | `P-001` (pseudonymous, unique)                             |
| Eligibility verified           | Yes/No, with verifier                                      |
| Started at                     | ISO 8601 timestamp with timezone                           |
| Ended at                       | ISO 8601 timestamp with timezone                           |
| Outcome                        | Completed / timed out / failed / withdrew after start      |
| Elapsed seconds                | Integer, measured from first command                       |
| Configuration edited           | Yes/No/Unknown                                             |
| Register and trust completed   | Yes/No                                                     |
| Actionable diagnostic received | Yes/No                                                     |
| Ready workspace prepared       | Yes/No                                                     |
| Sanitized environment          | OS, architecture, Node, pnpm, Git, SpecTide build          |
| Exclusion                      | None, or permitted pre-start reason and evidence reference |

## Results

Recruitment and sessions have not started. Completion rate: **not calculated**. SC-003 status:
**pending**. Append the dated cohort results, all started attempt rows, pre-start exclusion
evidence, numerator, denominator, and calculation here after the study; do not replace the
protocol or omit unsuccessful starts.
