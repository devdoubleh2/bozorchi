# Glossary

Canonical vocabulary for people and access. Use these terms in UI copy, API
docs, and code naming. Do not use "user" for a person's job in the shop.

- **Owner** — the user referenced by the organization's owner link (exactly
  one per company). Holds billing and subscription power. Recognized
  everywhere via the owner link, never via the membership role column. Holds
  implicit all-access; switches freely between stores.
- **Cashier** — the membership role, pinned to one store with POS access.
  Joins via a store invite, starts pending, and becomes active only after an
  Owner approves them. Gains extra product/inventory/analytics abilities only
  when the Owner explicitly grants permissions.
