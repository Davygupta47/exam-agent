// ===================================================================
// ELECTIVE ALLOCATION CONFIG — Testing vs Production
// ===================================================================
// Currently set to TESTING values. To switch to production:
//   - WINDOW_DURATION_MS: change to days (e.g. 7 * 24 * 60 * 60 * 1000)
//   - PE_CAPACITY: change to 26
//   - OE_CAPACITY: change to 50
// ===================================================================

export const ELECTIVE_CONFIG = {
  /** How long the elective preference window stays open (ms) */
  WINDOW_DURATION_MS: 5 * 60 * 1000,  // 5 minutes for testing

  /** Max students per Professional Elective subject */
  PE_CAPACITY: 3,                      // Production: 26

  /** Max students per Open Elective subject */
  OE_CAPACITY: 3,                      // Production: 50
} as const;
