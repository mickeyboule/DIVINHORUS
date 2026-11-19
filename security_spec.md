# Security Specification & Payload-First TDD (`firestore.rules`)

## 1. Data Invariants
1. **Master Admin Isolation**: Only verified administrators (`isAdmin()`, requiring `request.auth.token.email_verified == true` and either a bootstrapped admin email `bisnessweb24@gmail.com` / `coeurdouce2401@gmail.com` or an active `/admins/{uid}` record) can mutate catalog (`categories`, `products`), editorial (`articles`, `article_categories`, `videos`, `site_content`, `site_settings`, `media`), or CRM records (`customers`, `contact_messages`, `activities`).
2. **PII Isolation**: `customers` and `contact_messages` are strictly readable and writable only by verified admins; `visitors/{visitorId}` and `orders/{orderId}` are strictly restricted to owner or verified admin.
3. **Order Status Privacy**: `/order_tracking/{orderNumber}` exposes status and history only (no products, no invoice).
4. **Temporal & Structural Integrity**: `createdAt == request.time` on create, immutable on update; `updatedAt == request.time` on create and update; all strings and arrays are strictly bounded.
