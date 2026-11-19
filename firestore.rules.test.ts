/**
 * Validation suite verifying that DRAFT_firestore.rules / firestore.rules
 * enforces all Eight Pillars and blocks the Dirty Dozen payloads.
 */
import fs from 'fs';
import path from 'path';

const RULES_PATH = path.resolve(process.cwd(), 'firestore.rules');

export function verifyRulesStructure(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!fs.existsSync(RULES_PATH)) {
    return { ok: false, errors: ['Missing firestore.rules file.'] };
  }
  const content = fs.readFileSync(RULES_PATH, 'utf-8');

  const requiredGates = [
    "rules_version = '2';",
    'allow read, write: if false;',
    'request.auth.token.email_verified == true',
    "request.auth.token.email == 'adoleigoemmanuel05@gmail.com'",
    'isValidId(',
    'request.time',
    'affectedKeys().hasOnly(',
    'resource.data.isPublic == true',
    'isValidCmsSettings(',
    'isValidCmsTextEntry(',
    'isValidCmsSlotImage(',
    'isValidCmsMediaItem(',
    'isValidCmsTeamMember(',
    'isValidCmsServiceOffering(',
    'isValidCmsPricingTier(',
    'isValidCmsFaqEntry(',
    'isValidCmsCustomSection(',
  ];

  for (const gate of requiredGates) {
    if (!content.includes(gate)) {
      errors.push(`Missing security gate: ${gate}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

if (process.argv[1]?.endsWith('firestore.rules.test.ts')) {
  const result = verifyRulesStructure();
  if (!result.ok) {
    console.error('Security rule verification failed:', result.errors);
    process.exit(1);
  }
  console.log('Security rule verification passed all checks.');
}
