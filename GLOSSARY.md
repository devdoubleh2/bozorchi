# Glossary

Canonical vocabulary for people and access. Use these terms in UI copy, API
docs, and code naming. Do not use "user" for a person's job in the shop.

- **Owner** — the user referenced by the organization's owner link (exactly
  one per company). Holds billing and subscription power. Recognized
  everywhere via the owner link, never via the membership role column.
- **Admin** — a membership with the admin role. Manages staff, inventory, and
  settings. Owner and Admin are distinct concepts that coincide in a
  one-person shop.
- **Cashier** — a membership with the user role, pinned to one store with POS
  access. Joins via a store invite, starts pending, and becomes active only
  after an Owner or Admin approves them.
