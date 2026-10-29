# Feature Specification: SplitSmart Requirements

**Feature Branch**: `001-splitsmart-requirements`

**Created**: 2026-10-29

**Status**: Draft

**Input**: Authoritative customer request in `UserRequirement.md`: develop SplitSmart for sharing expenses between people and groups, including accounts, group management, expenses and receipts, notifications, approvals, balances, payments, reports, and web, Android, and iOS availability.

## Clarifications

### Session 2026-10-29

- Q: Can the expense payer be a group member who is not among the expense participants, and should one or multiple payers be allowed? → A: One payer, and the payer must also be an expense participant.
- Q: How should a person sign in and become a member of a SplitSmart group? → A: Email and password; group owner invites an account and the invitee accepts.
- Q: What rules should expense entry apply to nonpositive amounts, percentage totals other than 100%, and leftover currency units when a split requires rounding? → A: Require a positive amount and percentages totaling exactly 100%; allocate leftover smallest currency units by largest fractional remainder, breaking ties by participant selection order.
- Q: Through which channels should SplitSmart notify group members when another member submits an expense? → A: In-app notifications only.
- Q: Should SplitSmart show and settle only direct balances between each pair of members, or simplify all group debts into fewer payments between members? → A: Show net balance for each pair; a payment settles only that pair's balance.

## User Scenarios & Testing *(mandatory)*

### Actors

- **Account holder**: A person who signs in and views their own expenses and balances.
- **Group owner**: An account holder who creates and manages a shared group.
- **Expense submitter**: A group member who records an expense and identifies its payer and participants.
- **Reviewer**: A group member authorized to review submitted expenses.
- **Group member**: A participant who receives group expense notifications and may owe or be owed money.
- **Report viewer**: An account holder who views expense, balance, and payment summaries.

One person may act in several roles. A user may access group information only while authorized as a group member.

### User Story 1 - Set up an account and group (Priority: P1)

As a person sharing expenses, I want my own account and a group for the people I share expenses with, so that group activity and my personal balances are associated with the right people.

**Why this priority**: Accounts and groups establish the people and boundaries required by every shared-expense workflow.

**Independent Test**: Create two accounts, create a group with one account, invite the other account, accept the invitation, and verify that both members can access the group while an unrelated account cannot.

**Acceptance Scenarios**:

1. **Given** a person has no account, **When** they register with a unique email address and password and sign in, **Then** they can access their own account and expense and balance information.
2. **Given** a signed-in account holder and another registered account, **When** the owner invites that account and the invitee accepts, **Then** both members can access the group and its activity.
3. **Given** an account that is not a member of a group, **When** it attempts to view that group's expenses or balances, **Then** the information is not disclosed.

### User Story 2 - Record and submit a shared expense (Priority: P1)

As a group member, I want to record an expense, its payer, participants, split, and optional receipt, so that the group can review a complete and accurate expense.

**Why this priority**: Expense submission is the primary way to capture the shared costs that SplitSmart tracks.

**Independent Test**: In a group with at least two members, submit one equally split expense and one percentage split expense; verify the saved details and pending approval status.

**Acceptance Scenarios**:

1. **Given** a group member and an active group, **When** they submit a positive-amount expense with a date, description, payer, participants, and equal split, **Then** the expense is recorded as pending review with equal participant shares.
2. **Given** a group member and an active group, **When** they submit an expense with valid percentage shares totaling 100%, **Then** the expense is recorded as pending review with each participant's corresponding share.
3. **Given** a submitted expense, **When** the submitter attaches a receipt image, **Then** the receipt is associated with that expense and available to authorized group members.

### User Story 3 - Review expenses and notify the group (Priority: P1)

As a reviewer, I want to approve or reject submitted expenses, while group members are notified of new submissions, so that only reviewed expenses change balances.

**Why this priority**: Review protects the accuracy of balances, and notifications make group activity visible.

**Independent Test**: Submit an expense in a group with an assigned reviewer; verify member notification, approve one submission and reject another, and compare resulting balances.

**Acceptance Scenarios**:

1. **Given** a member submits an expense, **When** the submission is recorded, **Then** the other group members receive an expense notification.
2. **Given** a pending expense and an authorized reviewer, **When** the reviewer approves it, **Then** it becomes approved and its shares are included in balances.
3. **Given** a pending expense and an authorized reviewer, **When** the reviewer rejects it with a reason, **Then** it is marked rejected, the submitter can see the reason, and it does not change balances.
4. **Given** a reviewer is not authorized for the group, **When** they attempt to approve or reject an expense, **Then** the expense remains pending and no balance changes.
5. **Given** a group configured with multiple review levels, **When** only some required reviewers approve an expense, **Then** it remains pending and does not change balances until all required approvals are recorded.

### User Story 4 - Check balances and record payments (Priority: P2)

As a group member, I want to see what I owe each other member and record payments, so that outstanding amounts reflect both approved expenses and settlements.

**Why this priority**: The product's central value is helping people understand and settle shared obligations.

**Independent Test**: Approve an expense paid by one group member and shared by two others; verify each pairwise amount owed, record a partial payment, and verify the remaining amount.

**Acceptance Scenarios**:

1. **Given** an approved expense with a payer and participant shares, **When** a group member views balances, **Then** the system shows the amount owed between each relevant pair of members.
2. **Given** an outstanding balance, **When** the owing member records a valid partial payment to the receiving member, **Then** the payment is recorded and the outstanding balance decreases by that amount.
3. **Given** an expense that is pending or rejected, **When** a member views balances, **Then** that expense has no effect on the displayed balances.
4. **Given** a payment amount greater than the outstanding amount between the selected pair, **When** the member submits it, **Then** the payment is rejected with a clear explanation and the balance is unchanged.

### User Story 5 - Review expense, balance, and payment reports (Priority: P2)

As a report viewer, I want summaries and reports for a selected period, so that I can understand group and personal spending and settlements.

**Why this priority**: Reports make recorded activity useful for reconciliation and planning.

**Independent Test**: Record approved expenses and payments on dates inside and outside a selected period; verify report totals, balances, and included records.

**Acceptance Scenarios**:

1. **Given** a group with expenses and payments, **When** a member views a report for a date range, **Then** the report includes only authorized records in that range and summarizes expenses, balances, and payments.
2. **Given** a report with no matching records, **When** a member requests it, **Then** the report clearly shows no matching activity and zero totals.
3. **Given** a member without access to a group, **When** they request a report for that group, **Then** no group data is returned.

### User Story 6 - Use SplitSmart on supported platforms (Priority: P3)

As an account holder, I want to access my SplitSmart account and shared-expense information on the supported web and mobile platforms, so that the service is available on the devices named in the customer request.

**Why this priority**: The customer expressly requests a web-based primary application and Android and iOS apps; the initial desktop MVP is not a substitute for these deliverables.

**Independent Test**: Sign in to each supported product client and confirm that authorized account, group, expense, balance, payment, and report data is available consistently.

**Acceptance Scenarios**:

1. **Given** an account holder with an active account, **When** they use the web product, **Then** they can access the supported SplitSmart features for which they are authorized.
2. **Given** an account holder with an active account, **When** they use the Android or iOS app, **Then** they can access the supported SplitSmart features for which they are authorized.
3. **Given** an approved expense or recorded payment, **When** the same account holder views the affected data in another supported client, **Then** the clients show the same current expense and balance data.

### Edge Cases

- An account submits an expense with a zero or negative amount, missing description, invalid date, or no participants; the expense is rejected with an actionable explanation.
- A percentage split has shares totaling less than or greater than 100%; it is rejected and creates no balance change.
- A split cannot be represented as exact fractions of the currency's smallest unit; the allocated shares must follow one documented rounding rule and sum exactly to the expense total.
- The selected payer or a participant is not an active member of the group; the expense is rejected.
- A group member is removed while pending or approved expenses exist; historical records and their balance effects remain available to authorized reviewers, and removal does not silently rewrite past shares.
- The selected payer is not among the expense participants; the expense is rejected.
- An expense is edited after submission or approval; edits to a pending expense return it to review, and changes to an approved expense do not alter balances until reviewed again.
- Two reviewers act on the same pending expense; only the first valid decision changes its status, and a later decision cannot apply a second balance change.
- A payment is partial, duplicated, invalid, or exceeds the outstanding amount; accepted payments reduce the balance only once and invalid or excessive payments leave it unchanged.
- A report range has a start date after its end date; the request is rejected with an explanation.
- A notification recipient is no longer a group member; they cannot use the notification to access group data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow each person to create an individual account using a unique email address and password, sign in, and access that account's own expense and balance information.
- **FR-002**: The system MUST allow authorized account holders to create and manage groups, invite registered accounts, and add an invitee to group membership only after that invitee accepts.
- **FR-003**: The system MUST allow an authorized group member to submit an expense containing a positive amount, date, description, split method, and optional receipt image.
- **FR-004**: The system MUST allow the submitter to identify the group members involved in an expense and exactly one payer; the payer MUST be one of the selected participants. The submitter is the default payer when they are a participant.
- **FR-005**: The system MUST support equal and percentage-based allocation among the selected participants; percentage shares MUST total exactly 100%. It MUST convert each exact share to the currency's smallest unit by rounding down, then distribute remaining units one at a time to the largest fractional remainders, breaking ties by participant selection order, so allocated shares sum exactly to the expense total.
- **FR-006**: The system MUST provide an in-app notification to other group members when a new expense is submitted and provide authorized recipients access to its review status.
- **FR-007**: The system MUST support expense review before an expense changes balances, permit an authorized reviewer to approve or reject it, retain the decision and any rejection reason, and exclude pending or rejected expenses from balances. A group MUST support at least one reviewer; multiple review levels MAY be configured.
- **FR-008**: The system MUST track the net amount owed between each pair of group members based only on their approved expense shares and payments between that pair; it MUST NOT offset balances through other group members.
- **FR-009**: The system MUST allow users to record a payment from an owing member to the member they owe, including amount and date, and MUST reflect accepted payments only in that pair's balance.
- **FR-010**: The system MUST provide authorized users with expense, balance, and payment summaries and reports, including reports filtered by a user-selected date range.
- **FR-011**: The complete product MUST provide its primary application through the web and provide apps that run on Android and iOS, as requested by the customer. Authorized users MUST be able to access their applicable account and shared-expense information through each delivered product client.

### Customer Requirements Inventory

This inventory preserves the original customer-requested scope. The requirements reference `UserRequirement.md` without modifying it.

| Original customer feature | Requirement IDs | Scope coverage |
|---|---|---|
| Individual user accounts, login, and access to own expense and balance information | FR-001 | Full product and MVP |
| Create and manage groups of people | FR-002 | Full product and MVP |
| Create expenses | FR-003 | Full product and MVP |
| Expense amount, date, description, equal or percentage split, and optional receipt image | FR-003, FR-005 | Full product and MVP |
| Specify users involved in an expense and adjust balances accordingly | FR-004, FR-008 | Full product and MVP |
| Notify users when other group members create expenses | FR-006 | Full product and MVP |
| Review and approve expenses before balance adjustment; single or multiple review levels | FR-007 | Full product and MVP; one review level is the default |
| Track amounts owed by each user to every other user, considering entered expenses | FR-008 | Full product and MVP; only approved expenses affect balances |
| Record payments and update balances | FR-009 | Full product and MVP |
| Expense, balance, and payment summaries and custom date-range reports | FR-010 | Full product and MVP |
| Primary web application and Android and iOS apps | FR-011 | Full product; not included in the Java Swing MVP |

### Java Swing MVP Subset (Implementation Scope)

This is an implementation scope decision, not a customer requirement. The initial MVP is a Java Swing desktop client covering FR-001 through FR-010: accounts, groups, expense entry and receipts, both split methods, notifications, expense review, pairwise balances, payment recording, and summaries/date-range reports. Its group data must be usable by multiple account holders for the shared workflows above. The MVP does not deliver the web application or Android/iOS apps in FR-011; those remain in the full-product requirements and MUST NOT be represented as satisfied by the desktop MVP.

### Non-Functional Requirements

- **NFR-001**: The system MUST prevent a user from viewing another account's private information or group data unless that user is authorized for the relevant group.
- **NFR-002**: Monetary shares and balances MUST be represented to the smallest supported currency unit using the deterministic largest-fractional-remainder rule in FR-005; the sum of participant shares MUST equal the recorded expense total.
- **NFR-003**: Under a test load of 100 concurrent active users, at least 95% of account, group, expense, balance, payment, and report actions MUST present a result or actionable feedback within 2 seconds.
- **NFR-004**: The same account and group records MUST show consistent approved expenses and recorded payments across supported clients within 10 seconds of a successful change.
- **NFR-005**: Users MUST be able to complete account access, group expense entry, approval, balance review, payment recording, and report review using keyboard navigation and assistive technology supported by each delivered client.

### Acceptance Criteria

- **AC-001 (FR-001)**: A person can register using an email address not already assigned to an account, sign in with their email and password, and view their own expenses and balances; another account cannot access that private account data.
- **AC-002 (FR-002)**: An authorized account holder can create a group and invite a registered account; the invitee gains membership only after accepting, and only members can access shared records.
- **AC-003 (FR-003)**: A valid expense can be submitted with the required details and optional receipt, and an invalid or incomplete expense is not accepted.
- **AC-004 (FR-004)**: The submitted expense identifies exactly one payer who is an active group participant; the submitter is the default payer when they are a participant, and a payer outside the participant list is rejected.
- **AC-005 (FR-005)**: Equal and valid percentage splits produce participant shares summing exactly to the expense total using largest-fractional-remainder allocation, with ties resolved by participant selection order; percentage totals other than exactly 100% are rejected.
- **AC-006 (FR-006)**: Submitting an expense creates an in-app notification for the other group members; a recipient outside the group cannot access the expense through its notification.
- **AC-007 (FR-007)**: Only an authorized review decision can approve or reject a pending expense; only an approved expense changes balances, and a rejected expense retains its reason.
- **AC-008 (FR-008)**: Each pair's net balance reflects only their approved expense shares and payments between that pair; balances are not offset through third members, and pending or rejected expenses have no balance effect.
- **AC-009 (FR-009)**: A valid full or partial payment from an owing member to the member they owe is recorded with its payer, recipient, amount, and date and reduces only that pair's outstanding balance once.
- **AC-010 (FR-010)**: A member can retrieve expense, balance, and payment summaries for a selected date range, and the result excludes out-of-range and unauthorized records.
- **AC-011 (FR-011)**: The complete product provides a web client and Android and iOS apps with authorized access to the applicable shared product information.

### Key Entities

- **Account**: A person's individual sign-in identity and private expense and balance view.
- **Group**: A shared expense context created and managed by authorized account holders.
- **Membership**: The association between an account, a group, and its permissions or review role; an invitation must be accepted before membership is active.
- **Expense**: A submitted shared cost, including amount, date, description, payer, split method, participants, receipt if provided, and review status.
- **Expense share**: One participant's allocated responsibility for an expense.
- **Review decision**: An authorized approval or rejection, including reviewer, decision, time, and optional rejection reason.
- **Notification**: An alert that a group expense was submitted or changed in review status.
- **Payment**: A user-recorded settlement amount between a payer and recipient, with date.
- **Balance**: The current amount owed between two group members after approved expenses and accepted payments.
- **Report**: A summary or filtered view of authorized expense, balance, and payment records.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of first-time participants in a usability test can create an account and join or create a group without assistance in 3 minutes.
- **SC-002**: At least 90% of first-time participants can submit a valid shared expense, including selecting participants and a split, in 2 minutes.
- **SC-003**: In all verification cases, approved expense shares sum exactly to the expense total at the supported currency precision, and pending or rejected expenses cause zero balance change.
- **SC-004**: In all verification cases, accepted full and partial payments reduce the selected outstanding balance by exactly the recorded amount and are applied only once.
- **SC-005**: At least 95% of the defined user actions complete or show actionable feedback within 2 seconds under the NFR-003 test load.
- **SC-006**: At least 90% of tested users can produce a date-range report containing the expected expenses, balances, and payments on their first attempt.
- **SC-007**: The full product passes an access and consistency test on web, Android, and iOS; the Java Swing MVP is reported separately and is not counted as satisfying any of those platform targets.

## Assumptions

- Each group uses one currency. Supporting multiple currencies or conversion rates is not assumed.
- The expense creator is the default payer only when they are among the expense participants; otherwise, another selected participant must be the payer.
- Accounts use an individual email address and password; an invited account holder must accept before group membership becomes active.
- A valid expense has a positive amount, a valid date, a non-empty description, and at least one active group participant.
- Percentage shares must total exactly 100%. For equal and percentage splits, exact shares are rounded down to the currency's smallest unit; leftover units go to the largest fractional remainders, with ties resolved by participant selection order.
- A group has one review step by default. It may be configured for multiple review levels; the group's authorized reviewer role determines who can decide.
- Notifications are in-app only. Email, SMS, and push delivery are out of scope.
- Payments are records of settlements users say they made; the product does not initiate or verify external money transfers.
- Balances are netted only between the two members involved; SplitSmart does not simplify group-wide debts into payments between different pairs.
- Partial payments are supported. A payment exceeding the selected pair's outstanding amount is rejected.
- Removing a member does not delete historical expenses, decisions, payments, or their balance effects.
- MVP scope means the Java Swing desktop client and FR-001 through FR-010; the full product still includes the web, Android, and iOS targets in FR-011.
- Test targets in NFR-003 and the success criteria are initial acceptance thresholds and may be revised only through explicit product-owner approval.

## Open Questions

1. Should the Swing MVP's account and group records be shared with the later web and mobile product, or may the MVP use a separate dataset?
2. Should multi-level approval be configurable per group, and what decision rules apply when several reviewers are required?
3. Which currencies must be supported at launch?
