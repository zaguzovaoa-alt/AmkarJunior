# Amkar Junior CRM Security Specification (Zero-Trust ABAC)

This security specification defines the access control constraints, data structures, and validation rules for our Firestore database, preventing unauthorized privilege escalation, identity spoofing, and dirty-write state shortcutting.

## 1. Data Invariants

- **Clients**: A registered client must possess a valid ID, standard statuses (`active`, `trial`, `paused`, `completed`), and session allocations bounded carefully.
- **Leads**: Leads must belong to known funnels and contain descriptive parent/child fields.
- **Finances**: Any record transaction must have `type == 'income'` or `type == 'expense'`. Amounts must be strictly positive numbers.
- **Tasks**: Tasks must have standard statuses (`new`, `pending`, `completed`, `overdue`) and be assigned to proper roles (`manager`, `trainer`, `director`).
- **Coaches / Groups / Messages**: Roster lists and internal chats must be securely read and written.

## 2. The "Dirty Dozen" Payloads (Aesthetic Penetration Testing)

Below are the 12 malicious or dirty payloads we MUST reject:

1. **Self-Assigned Role Privilege Escalation**: Non-existent admin inserting themselves manually into the `admins` collection. (REJECTED)
2. **Ghost Client Creation**: Attempting to write a `Client` document missing required keys like `status` or `childName`. (REJECTED)
3. **Negative Financial Records**: Submitting an expense of `-50000 ₽` to artificially inflate revenues or hide theft. (REJECTED)
4. **Incorrect Status Shortcut**: Directly writing a Task status as something unknown (e.g. `status: 'deleted_forever'`). (REJECTED)
5. **ID Poisoning Attack**: Saving a document with a 1.5MB junk-character ID string to corrupt filesystem lookups and exhaust quotas. (REJECTED)
6. **Spoof Email Verification**: Attempting writes using an unverified third-party email context. (REJECTED)
7. **PII Leakage Query**: Unrestricted client query scraping emails and phones of all parents. (REJECTED)
8. **Malicious Empty Message**: Inserting empty messages into the group chat without roles. (REJECTED)
9. **Tampering with Immortal Fields**: Modifying initial client `createdAt` timestamps. (REJECTED)
10. **Shadow Field Injection**: Writing an un-whitelisted parameter `isVipStatus: true` inside a standard Lead document. (REJECTED)
11. **Future Inbound Manipulation**: Submitting client training attendance rates exceeding 100%. (REJECTED)
12. **Orphaned Sibling Write**: Attempting to register a client with a non-existent group ID or coach ID reference without verifying integrity. (REJECTED)

## 3. Security Rules Draft Code

We draft the `DRAFT_firestore.rules` which we will test and run prior to active deployment.
