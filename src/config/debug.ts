/**
 * Debug Configuration
 * 
 * Set these flags to control verification and upload requirements
 * during development.
 */

export const DEBUG_CONFIG = {
  /**
   * When false, document uploads are NOT required for profile completion
   * When true, all documents must be uploaded
   */
  REQUIRE_DOCUMENTS: true,

  /**
   * When false, profile picture upload is NOT required
   * When true, profile picture must be uploaded
   */
  REQUIRE_PROFILE_PICTURE: true,

  /**
   * When false, doctor verification workflow is bypassed
   * When true, doctors must wait for admin verification
   */
  ENABLE_DOCTOR_VERIFICATION: true,

  /**
   * When false, NMC number is NOT required
   * When true, NMC number must be provided
   */
  REQUIRE_NMC_NUMBER: true,

  /**
   * When true, shows debug information in console
   */
  SHOW_DEBUG_LOGS: true,
};

/**
 * Helper function to log debug messages
 */
export function debugLog(message: string, data?: any) {
  if (DEBUG_CONFIG.SHOW_DEBUG_LOGS) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}

/**
 * Check if profile is complete based on debug flags
 */
export function isProfileComplete(data: {
  hasProfilePicture: boolean;
  hasRequiredFields: boolean;
  hasDocuments: boolean;
  hasNmcNumber?: boolean;
}): boolean {
  const checks = [
    data.hasRequiredFields, // Always required
  ];

  if (DEBUG_CONFIG.REQUIRE_PROFILE_PICTURE) {
    checks.push(data.hasProfilePicture);
  }

  if (DEBUG_CONFIG.REQUIRE_DOCUMENTS) {
    checks.push(data.hasDocuments);
  }

  if (DEBUG_CONFIG.REQUIRE_NMC_NUMBER && data.hasNmcNumber !== undefined) {
    checks.push(data.hasNmcNumber);
  }

  const isComplete = checks.every(check => check === true);
  
  debugLog('Profile completion check', {
    hasProfilePicture: data.hasProfilePicture,
    hasRequiredFields: data.hasRequiredFields,
    hasDocuments: data.hasDocuments,
    hasNmcNumber: data.hasNmcNumber,
    isComplete,
    activeFlags: {
      REQUIRE_PROFILE_PICTURE: DEBUG_CONFIG.REQUIRE_PROFILE_PICTURE,
      REQUIRE_DOCUMENTS: DEBUG_CONFIG.REQUIRE_DOCUMENTS,
      REQUIRE_NMC_NUMBER: DEBUG_CONFIG.REQUIRE_NMC_NUMBER,
    }
  });

  return isComplete;
}
