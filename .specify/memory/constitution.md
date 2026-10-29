<!--
Sync Impact Report
Version change: uninitialized scaffold -> 1.0.0
Modified principles: PRINCIPLE_1_NAME (scaffold) -> I. Java 21 Runtime;
PRINCIPLE_2_NAME (scaffold) -> II. Maven Build; PRINCIPLE_3_NAME (scaffold) ->
III. Swing User Interface; PRINCIPLE_4_NAME (scaffold) -> IV. JUnit 5 Verification;
PRINCIPLE_5_NAME (scaffold) ->
V. PlantUML Architecture; five additional principles were added for object-oriented design,
GUI/business separation, monetary arithmetic, requirement traceability, and human review of AI.
Added sections: Customer Requirements and Implementation Constraints; Development Workflow.
Removed sections: None.
Follow-up TODOs: Confirm the original ratification date.
-->
# SplitSmart Constitution

## Core Principles

### I. Java 21 Runtime
Production and development code MUST target Java 21. Builds and automated checks MUST use a
Java 21 toolchain so runtime behavior is consistent and verifiable.

### II. Maven Build
Maven MUST define the project's dependency management, build lifecycle, and repeatable
verification commands. A change is not complete unless it builds and its applicable checks
pass through the project Maven configuration.

### III. Swing User Interface
Desktop GUI functionality MUST use Java Swing. Swing event handlers MUST remain responsive
and delegate application work to the business layer rather than performing business operations
directly.

### IV. JUnit 5 Verification
Automated Java tests MUST use JUnit 5. Business rules, expense calculations, and balance
changes MUST have focused tests; defects MUST receive regression coverage where practical.

### V. PlantUML Architecture
PlantUML MUST be used for architecture or interaction diagrams when a change introduces or
materially alters a non-trivial component boundary or workflow. Diagrams MUST be updated with
the affected design and reviewed alongside the change.

### VI. Object-Oriented Design
Code MUST use cohesive types, encapsulated state, and explicit responsibilities. Abstractions
MUST serve identifiable domain or application needs; unnecessary inheritance and speculative
generalization MUST be avoided.

### VII. GUI and Business Logic Separation
GUI code MUST be separated from business rules and persistence responsibilities. Business
behavior MUST be callable and testable without constructing or displaying Swing components.

### VIII. Exact Monetary Arithmetic
Money and monetary calculations MUST use `BigDecimal`, with explicit scale and rounding rules
where applicable. Binary floating-point types MUST NOT represent or calculate monetary values.

### IX. Requirement Traceability
Each implemented customer requirement MUST be traceable from the unchanged `UserRequirement.md`
to its specification or acceptance criteria and relevant verification evidence. Changes that
cannot be reconciled with a customer requirement MUST be identified as implementation decisions
or open questions, not presented as customer-requested behavior.

### X. Human Review of AI Output
AI-generated requirements analysis, designs, code, tests, and documentation MUST be reviewed by
a human before acceptance. Reviewers MUST verify correctness, requirement alignment, and test
evidence; AI output MUST NOT approve itself or replace accountable human decisions.

## Customer Requirements and Implementation Constraints

`UserRequirement.md` is the original customer request and MUST remain unchanged. Its requested
product capabilities include accounts, groups, expenses, notifications, approval, balance and
payment tracking, reporting, and web, Android, and iOS availability.

Java 21, Maven, Java Swing, JUnit 5, PlantUML, and the design rules in this constitution are
implementation decisions and project constraints, not additional customer requirements.
Java Swing alone does not satisfy the requested web, Android, or iOS availability. Any
incompatibility between the selected implementation and a customer requirement MUST be recorded
and resolved explicitly; implementation choices MUST NOT silently narrow or rewrite the customer
request.

## Development Workflow

Changes MUST include requirement links and verification evidence appropriate to their scope.
Review MUST check applicable JUnit 5 tests, monetary arithmetic, GUI/business-layer boundaries,
and affected PlantUML diagrams. AI-assisted changes MUST receive human review before acceptance.
Unresolved conflicts between customer requirements and implementation constraints MUST be
documented before claiming the affected requirement is delivered.

## Governance

This constitution governs engineering decisions and does not amend the customer source. An
amendment MUST include its rationale, scope and compatibility impact, approval by the accountable
project owner, and an updated version and amendment date. Reviews MUST check changes for
compliance with these principles and require evidence for applicable tests and requirement
traceability. Any exception MUST be documented, justified, and approved by the project owner.

The version uses MAJOR.MINOR.PATCH: MAJOR for incompatible governance or principle changes,
MINOR for added principles or materially expanded requirements, and PATCH for clarifications
that do not change governance intent.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown |
**Last Amended**: 2026-10-29
