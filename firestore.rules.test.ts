export interface SecurityTestCase {
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'ALLOW' | 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_SECURITY_TESTS: SecurityTestCase[] = [
  {
    name: '1. Unauthenticated write to products',
    collectionPath: 'products/prod_test',
    operation: 'create',
    auth: null,
    payload: { id: 'prod_test', name: 'Hack' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '2. Unverified admin email spoof on site_settings',
    collectionPath: 'site_settings/public',
    operation: 'update',
    auth: { uid: 'uid_spoof', email: 'bisnessweb24@gmail.com', email_verified: false },
    payload: { general: { siteName: 'Spoof' } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. Non-admin creating admin record',
    collectionPath: 'admins/uid_visitor',
    operation: 'create',
    auth: { uid: 'uid_visitor', email: 'user@example.com', email_verified: true },
    payload: { id: 'uid_visitor', email: 'user@example.com', role: 'Super Administrateur' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. Shadow field injection on testimonial create',
    collectionPath: 'testimonials/test_1',
    operation: 'create',
    auth: { uid: 'uid_visitor', email: 'user@example.com', email_verified: true },
    payload: { id: 'test_1', authorName: 'Alice', rating: 5, content: 'Super', status: 'En attente', featured: false, visitorId: 'uid_visitor', ghostField: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '5. Testimonial pre-approval spoof by non-admin',
    collectionPath: 'testimonials/test_2',
    operation: 'create',
    auth: { uid: 'uid_visitor', email: 'user@example.com', email_verified: true },
    payload: { id: 'test_2', authorName: 'Alice', rating: 5, content: 'Super', status: 'Publié', featured: true, visitorId: 'uid_visitor' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '6. Cross-user PII read on customers',
    collectionPath: 'customers/cust_1',
    operation: 'get',
    auth: { uid: 'uid_visitor', email: 'user@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '7. Blanket list scrape on orders by unauthenticated client',
    collectionPath: 'orders',
    operation: 'list',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '8. Order identity spoofing for another visitorId',
    collectionPath: 'orders/ord_spoof',
    operation: 'create',
    auth: { uid: 'uid_visitor_a', email: 'a@example.com', email_verified: true },
    payload: { id: 'ord_spoof', visitorId: 'uid_visitor_b', status: 'Nouvelle' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '9. Order state shortcutting by visitor',
    collectionPath: 'orders/ord_1',
    operation: 'update',
    auth: { uid: 'uid_visitor_a', email: 'a@example.com', email_verified: true },
    payload: { status: 'Terminée' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Oversized document ID poisoning (>128 chars)',
    collectionPath: `media/${'a'.repeat(140)}`,
    operation: 'create',
    auth: { uid: 'uid_admin', email: 'bisnessweb24@gmail.com', email_verified: true },
    payload: { id: 'a'.repeat(140), name: 'Oversized' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Client timestamp forgery on visitor create',
    collectionPath: 'visitors/uid_visitor_a',
    operation: 'create',
    auth: { uid: 'uid_visitor_a', email: 'a@example.com', email_verified: true },
    payload: { id: 'uid_visitor_a', createdAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Inactive product read attempt by public user',
    collectionPath: 'products/prod_inactive',
    operation: 'get',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
];
