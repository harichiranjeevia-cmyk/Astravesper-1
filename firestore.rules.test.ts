/**
 * Astra Vesper — Dirty Dozen Firestore Rules Security Test Specification
 * Run with @firebase/rules-unit-testing against Firestore Emulator.
 */

export const DIRTY_DOZEN_CASES = [
  { name: '01_shadow_role_escalation_on_user_create', collection: 'users', action: 'create', expected: 'PERMISSION_DENIED' },
  { name: '02_ghost_field_injection_on_user_update', collection: 'users', action: 'update', expected: 'PERMISSION_DENIED' },
  { name: '03_cross_user_pii_read', collection: 'users', action: 'get', expected: 'PERMISSION_DENIED' },
  { name: '04_unverified_email_write', collection: 'users', action: 'create', expected: 'PERMISSION_DENIED' },
  { name: '05_membership_list_scraping', collection: 'memberships', action: 'list', expected: 'PERMISSION_DENIED' },
  { name: '06_unauthorized_admin_grant', collection: 'admins', action: 'create', expected: 'PERMISSION_DENIED' },
  { name: '07_unpublished_product_read', collection: 'products', action: 'get', expected: 'PERMISSION_DENIED' },
  { name: '08_oversized_document_id', collection: 'products', action: 'create', expected: 'PERMISSION_DENIED' },
  { name: '09_oversized_description_poisoning', collection: 'products', action: 'create', expected: 'PERMISSION_DENIED' },
  { name: '10_audit_log_mutation_attempt', collection: 'auditLogs', action: 'update', expected: 'PERMISSION_DENIED' },
  { name: '11_forged_client_timestamp', collection: 'users/uid/activity', action: 'create', expected: 'PERMISSION_DENIED' },
  { name: '12_orphaned_subcollection_write', collection: 'users/missing/activity', action: 'create', expected: 'PERMISSION_DENIED' },
];
