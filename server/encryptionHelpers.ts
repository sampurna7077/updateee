import { encryptionService, EncryptedData } from './encryption';

/**
 * Helper functions for handling encrypted PII fields in database operations
 */

interface EncryptionContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Safely encrypt a PII field if it exists and is not already encrypted
 */
export async function encryptField(
  value: string | null | undefined,
  fieldType: string,
  context?: EncryptionContext
): Promise<EncryptedData | null> {
  if (!value || typeof value !== 'string') {
    return null;
  }
  
  return await encryptionService.encryptPII(value, fieldType, context);
}

/**
 * Safely decrypt a PII field if it exists
 */
export async function decryptField(
  encryptedData: EncryptedData | null | undefined,
  fieldType: string,
  context?: EncryptionContext
): Promise<string | null> {
  if (!encryptedData) {
    return null;
  }
  
  try {
    return await encryptionService.decryptPII(encryptedData, fieldType, context);
  } catch (error) {
    console.error(`Failed to decrypt field ${fieldType}:`, error);
    return null;
  }
}

/**
 * Prepare user data for storage with encryption
 */
export async function prepareUserForStorage(
  userData: any,
  context?: EncryptionContext
) {
  const encrypted = {
    ...userData,
    // Keep original fields for backward compatibility during transition
    encryptedEmail: await encryptField(userData.email, 'user_email', context),
    encryptedFirstName: await encryptField(userData.firstName, 'user_first_name', context),
    encryptedLastName: await encryptField(userData.lastName, 'user_last_name', context),
  };

  return encrypted;
}

/**
 * Prepare job application data for storage with encryption
 */
export async function prepareJobApplicationForStorage(
  applicationData: any,
  context?: EncryptionContext
) {
  const encrypted = {
    ...applicationData,
    // Keep original fields for backward compatibility during transition
    encryptedFirstName: await encryptField(applicationData.firstName, 'application_first_name', context),
    encryptedLastName: await encryptField(applicationData.lastName, 'application_last_name', context),
    encryptedEmail: await encryptField(applicationData.email, 'application_email', context),
    encryptedPhone: await encryptField(applicationData.phone, 'application_phone', context),
  };

  return encrypted;
}

/**
 * Prepare testimonial data for storage with encryption
 */
export async function prepareTestimonialForStorage(
  testimonialData: any,
  context?: EncryptionContext
) {
  const encrypted = {
    ...testimonialData,
    // Keep original fields for backward compatibility during transition
    encryptedName: await encryptField(testimonialData.name, 'testimonial_name', context),
    encryptedEmail: await encryptField(testimonialData.email, 'testimonial_email', context),
  };

  return encrypted;
}

/**
 * Prepare form submission data for storage with encryption
 */
export async function prepareFormSubmissionForStorage(
  submissionData: any,
  context?: EncryptionContext
) {
  // Encrypt sensitive data within the form data JSON
  let encryptedDataJson = null;
  if (submissionData.data && typeof submissionData.data === 'object') {
    const sensitiveDataStr = JSON.stringify(submissionData.data);
    encryptedDataJson = await encryptField(sensitiveDataStr, 'form_submission_data', context);
  }

  const encrypted = {
    ...submissionData,
    // Keep original fields for backward compatibility during transition
    encryptedData: encryptedDataJson,
    encryptedFirstName: await encryptField(submissionData.firstName, 'submission_first_name', context),
    encryptedLastName: await encryptField(submissionData.lastName, 'submission_last_name', context),
    encryptedEmail: await encryptField(submissionData.email, 'submission_email', context),
    encryptedPhone: await encryptField(submissionData.phone, 'submission_phone', context),
  };

  return encrypted;
}

/**
 * Decrypt user data for display
 */
export async function decryptUserForDisplay(
  userData: any,
  context?: EncryptionContext
) {
  const decrypted = { ...userData };

  // Try to decrypt new encrypted fields, fall back to legacy unencrypted fields
  if (userData.encryptedEmail) {
    const decryptedEmail = await decryptField(userData.encryptedEmail, 'user_email', context);
    if (decryptedEmail) decrypted.email = decryptedEmail;
  }

  if (userData.encryptedFirstName) {
    const decryptedFirstName = await decryptField(userData.encryptedFirstName, 'user_first_name', context);
    if (decryptedFirstName) decrypted.firstName = decryptedFirstName;
  }

  if (userData.encryptedLastName) {
    const decryptedLastName = await decryptField(userData.encryptedLastName, 'user_last_name', context);
    if (decryptedLastName) decrypted.lastName = decryptedLastName;
  }

  // Remove encrypted fields from display
  delete decrypted.encryptedEmail;
  delete decrypted.encryptedFirstName;
  delete decrypted.encryptedLastName;

  return decrypted;
}

/**
 * Decrypt job application data for display
 */
export async function decryptJobApplicationForDisplay(
  applicationData: any,
  context?: EncryptionContext
) {
  const decrypted = { ...applicationData };

  // Try to decrypt new encrypted fields, fall back to legacy unencrypted fields
  if (applicationData.encryptedFirstName) {
    const decryptedFirstName = await decryptField(applicationData.encryptedFirstName, 'application_first_name', context);
    if (decryptedFirstName) decrypted.firstName = decryptedFirstName;
  }

  if (applicationData.encryptedLastName) {
    const decryptedLastName = await decryptField(applicationData.encryptedLastName, 'application_last_name', context);
    if (decryptedLastName) decrypted.lastName = decryptedLastName;
  }

  if (applicationData.encryptedEmail) {
    const decryptedEmail = await decryptField(applicationData.encryptedEmail, 'application_email', context);
    if (decryptedEmail) decrypted.email = decryptedEmail;
  }

  if (applicationData.encryptedPhone) {
    const decryptedPhone = await decryptField(applicationData.encryptedPhone, 'application_phone', context);
    if (decryptedPhone) decrypted.phone = decryptedPhone;
  }

  // Remove encrypted fields from display
  delete decrypted.encryptedFirstName;
  delete decrypted.encryptedLastName;
  delete decrypted.encryptedEmail;
  delete decrypted.encryptedPhone;

  return decrypted;
}

/**
 * Decrypt testimonial data for display
 */
export async function decryptTestimonialForDisplay(
  testimonialData: any,
  context?: EncryptionContext
) {
  const decrypted = { ...testimonialData };

  // Try to decrypt new encrypted fields, fall back to legacy unencrypted fields
  if (testimonialData.encryptedName) {
    const decryptedName = await decryptField(testimonialData.encryptedName, 'testimonial_name', context);
    if (decryptedName) decrypted.name = decryptedName;
  }

  if (testimonialData.encryptedEmail) {
    const decryptedEmail = await decryptField(testimonialData.encryptedEmail, 'testimonial_email', context);
    if (decryptedEmail) decrypted.email = decryptedEmail;
  }

  // Remove encrypted fields from display
  delete decrypted.encryptedName;
  delete decrypted.encryptedEmail;

  return decrypted;
}

/**
 * Decrypt form submission data for display
 */
export async function decryptFormSubmissionForDisplay(
  submissionData: any,
  context?: EncryptionContext
) {
  const decrypted = { ...submissionData };

  // Try to decrypt sensitive form data
  if (submissionData.encryptedData) {
    const decryptedDataStr = await decryptField(submissionData.encryptedData, 'form_submission_data', context);
    if (decryptedDataStr) {
      try {
        decrypted.data = JSON.parse(decryptedDataStr);
      } catch (error) {
        console.error('Failed to parse decrypted form data:', error);
      }
    }
  }

  // Try to decrypt other encrypted fields, fall back to legacy unencrypted fields
  if (submissionData.encryptedFirstName) {
    const decryptedFirstName = await decryptField(submissionData.encryptedFirstName, 'submission_first_name', context);
    if (decryptedFirstName) decrypted.firstName = decryptedFirstName;
  }

  if (submissionData.encryptedLastName) {
    const decryptedLastName = await decryptField(submissionData.encryptedLastName, 'submission_last_name', context);
    if (decryptedLastName) decrypted.lastName = decryptedLastName;
  }

  if (submissionData.encryptedEmail) {
    const decryptedEmail = await decryptField(submissionData.encryptedEmail, 'submission_email', context);
    if (decryptedEmail) decrypted.email = decryptedEmail;
  }

  if (submissionData.encryptedPhone) {
    const decryptedPhone = await decryptField(submissionData.encryptedPhone, 'submission_phone', context);
    if (decryptedPhone) decrypted.phone = decryptedPhone;
  }

  // Remove encrypted fields from display
  delete decrypted.encryptedData;
  delete decrypted.encryptedFirstName;
  delete decrypted.encryptedLastName;
  delete decrypted.encryptedEmail;
  delete decrypted.encryptedPhone;

  return decrypted;
}

/**
 * Extract encryption context from request
 */
export function getEncryptionContext(req: any): EncryptionContext {
  return {
    userId: req.user?.claims?.sub || req.user?.id,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
  };
}