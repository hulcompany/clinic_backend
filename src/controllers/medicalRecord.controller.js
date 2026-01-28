const { medicalRecordService } = require('../services/index');
const AppError = require('../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../utils/responseHandler');
const { User, Admin, MedicalRecord } = require('../models');
const { hasPermission } = require('../config/roles');

// Helper function to validate admin/doctor permissions
const validateAdminDoctorPermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor';
};

// Helper function to validate medical record permissions
const validateMedicalRecordPermission = (user, recordDoctorId) => {
  if (user.role === 'doctor') {
    // Doctors can only access their own records
    return user.user_id === recordDoctorId;
  } else if (user.role === 'admin' || user.role === 'super_admin') {
    // Admins and super admins can access all records
    return true;
  }
  return false;
};

/**
 * Helper function to validate doctor permissions
 * @param {number} doctorId - Doctor ID from token
 * @param {number} recordDoctorId - Doctor ID from medical record
 * @returns {Promise<boolean>} Validation result
 */
const validateDoctorPermissions = async (doctorId, recordDoctorId) => {
  if (doctorId !== recordDoctorId) {
    throw new Error('Not authorized to access this medical record');
  }
  return true;
};

/**
 * Helper function to validate secretary permissions
 * @param {Object} user - Authenticated user object
 * @param {number} recordDoctorId - Doctor ID from medical record
 * @param {number} recordUserId - User ID from medical record
 * @returns {Promise<boolean>} Validation result
 */
const validateSecretaryPermissions = async (user, recordDoctorId, recordUserId) => {
  // Check if the secretary is supervised by the doctor of this record
  if (user.supervisor_id !== recordDoctorId) {
    throw new Error('Not authorized to access this medical record');
  }

  // Check if the user is restricted (secretaries can't see restricted users)
  const recordUser = await User.findByPk(recordUserId, {
    attributes: ['is_restricted']
  });
  
  if (recordUser && recordUser.is_restricted) {
    throw new Error('Not authorized to access this restricted user medical record');
  }

  return true;
};

/**
 * @desc    Create a new medical record
 * @route   POST /api/v1/medical-records
 * @access  Private (Doctor only)
 */
const createMedicalRecord = async (req, res, next) => {
  try {
    const { 
      user_id, 
      age, 
      gender, 
      height, 
      weight, 
      chronic_diseases, 
      allergies, 
      previous_surgeries, 
      notes,
      consultation_id
    } = req.body;

    // Validate required fields
    if (!user_id) {
      return failureResponse(res, 'User ID is required', 400);
    }

    // Ensure doctor_id comes from authenticated user
    const doctor_id = req.user.user_id;

    // Validate that the authenticated user is a doctor
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Only doctors, admins, or super admins can create medical records', 403);
    }

    // Check if medical attachments are provided AFTER middleware processing
    const hasAttachments = req.files?.medical_attachments || req.processedFiles?.medical_attachments;
    if (!hasAttachments) {
      return failureResponse(res, 'Medical attachments (images) are required to create a medical record', 400);
    }

    // Prepare medical record data
    const medicalRecordData = {
      user_id,
      doctor_id,
      age: age || null,
      gender: gender || null,
      height: height || null,
      weight: weight || null,
      chronic_diseases: chronic_diseases || null,
      allergies: allergies || null,
      previous_surgeries: previous_surgeries || null,
      notes: notes || null,
      consultation_id: consultation_id || null,
      medical_attachments: req.processedFiles?.medical_attachments || 
        (req.files?.medical_attachments ? 
          JSON.stringify(Array.isArray(req.files.medical_attachments) ? 
            req.files.medical_attachments.map(file => ({
              filename: file.filename,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size
            })) : 
            [{
              filename: req.files.medical_attachments.filename,
              originalname: req.files.medical_attachments.originalname,
              mimetype: req.files.medical_attachments.mimetype,
              size: req.files.medical_attachments.size
            }]
          ) : null)
    };

    // Create medical record
    const createdMedicalRecord = await medicalRecordService.createMedicalRecord(medicalRecordData);

    // If consultation_id is provided, update the consultation with medical record ID
    if (consultation_id) {
      try {
        const { Consultation } = require('../models');
        await Consultation.update(
          { medical_record_id: createdMedicalRecord.id },
          { where: { id: consultation_id } }
        );
      } catch (updateError) {
        console.error('Failed to update consultation with medical record ID:', updateError);
        // Don't fail the medical record creation if consultation update fails
      }
    }

    // Handle file uploads if present in request
    console.log('req.files:', req.files);
    console.log('req.files type:', typeof req.files);
    
    let medical_attachments = null;
    
    // Check if req.files is an array (as shown in debug logs)
    if (req.files && Array.isArray(req.files)) {
      // Filter files by fieldname 'medical_attachments' (plural)
      const medicalAttachmentFiles = req.files.filter(file => file.fieldname === 'medical_attachments');
      console.log('Filtered medical attachment files:', medicalAttachmentFiles);
      
      if (medicalAttachmentFiles.length > 0) {
        medical_attachments = medicalAttachmentFiles.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        }));
        console.log('Processed medical_attachments:', medical_attachments);
      } else {
        console.log('No files with fieldname medical_attachments found');
      }
    } else if (req.files && req.files['medical_attachments']) {
      // Traditional Multer format
      const uploadedFiles = req.files['medical_attachments'];
      console.log('Traditional format - Found uploaded files:', uploadedFiles);
      medical_attachments = Array.isArray(uploadedFiles) ? 
        uploadedFiles.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        })) :
        [{
          filename: uploadedFiles.filename,
          originalname: uploadedFiles.originalname,
          mimetype: uploadedFiles.mimetype,
          size: uploadedFiles.size
        }];
      console.log('Processed medical_attachments:', medical_attachments);
    } else {
      console.log('No medical_attachment files found in req.files');
    }
    
    // Add medical attachments to the record data
    const recordData = {
      ...medicalRecordData,
      medical_attachments: medical_attachments
    };
    
    const medicalRecord = await medicalRecordService.createMedicalRecord(recordData);

    // Format response to include allFiles like messages
    const response = {
      id: medicalRecord.id,
      user: medicalRecord.user ? {
        user_id: medicalRecord.user.user_id,
        full_name: medicalRecord.user.full_name,
        email: medicalRecord.user.email,
        phone: medicalRecord.user.phone,
        is_restricted: medicalRecord.user.is_restricted
      } : null,
      doctor: medicalRecord.admin ? {
        user_id: medicalRecord.admin.user_id,
        full_name: medicalRecord.admin.full_name,
        email: medicalRecord.admin.email,
        phone: medicalRecord.admin.phone,
        role: medicalRecord.admin.role
      } : null,
      consultation: medicalRecord.consultation ? {
                id: medicalRecord.consultation.id,
                initial_issue: medicalRecord.consultation.initial_issue,
                status: medicalRecord.consultation.status,
                createdAt: medicalRecord.consultation.createdAt,
                updatedAt: medicalRecord.consultation.updatedAt
              } : null,
      age: medicalRecord.age,
      gender: medicalRecord.gender,
      height: medicalRecord.height,
      weight: medicalRecord.weight,
      chronic_diseases: medicalRecord.chronic_diseases,
      allergies: medicalRecord.allergies,
      previous_surgeries: medicalRecord.previous_surgeries,
      notes: medicalRecord.notes,
      createdAt: medicalRecord.created_at,
      updatedAt: medicalRecord.updated_at,
      allFiles: (medicalRecord.medical_attachments && Array.isArray(medicalRecord.medical_attachments)) ? 
        medicalRecord.medical_attachments.map(attachment => {
          // Handle both string filenames and complete file objects
          if (typeof attachment === 'string') {
            // If it's just a filename string, return basic info
            return {
              filename: attachment,
              originalname: attachment, // Using filename as originalname for now
              mimetype: 'application/octet-stream' // Default mimetype
            };
          } else {
            // If it's a full attachment object
            return {
              filename: attachment.filename,
              originalname: attachment.originalname,
              mimetype: attachment.mimetype || 'application/octet-stream'
            };
          }
        }) : []
    };
    
    successResponse(res, response, 'Medical record created successfully');
  } catch (error) {
    if (error.message === 'File upload failed') {
      return failureResponse(res, error.message, 400);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get medical record by ID
 * @route   GET /api/v1/medical-records/:id
 * @access  Private (Doctor, Secretary with proper permissions)
 */
const getMedicalRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const medicalRecord = await medicalRecordService.getMedicalRecordById(id);

    // Check permissions based on user role and permissions
    if (req.user.role === 'doctor' || req.user.role === 'admin' || req.user.role === 'super_admin') {
      // Doctors, admins, and super admins can access records they created
      await validateDoctorPermissions(req.user.user_id, medicalRecord.doctor_id);
    } else if (req.user.role === 'secretary') {
      // Secretaries can only access records of their supervised doctor's patients (excluding restricted users)
      // Check if the secretary has the required permission
      if (!hasPermission(req.user.role, 'view_medical_records')) {
        return failureResponse(res, 'Not authorized to access medical records', 403);
      }
      await validateSecretaryPermissions(req.user, medicalRecord.doctor_id, medicalRecord.user_id);
    } else {
      return failureResponse(res, 'Not authorized to access this medical record', 403);
    }

    // Format response to include allFiles like messages
    const response = {
      id: medicalRecord.id,
      user: medicalRecord.user ? {
        user_id: medicalRecord.user.user_id,
        full_name: medicalRecord.user.full_name,
        email: medicalRecord.user.email,
        phone: medicalRecord.user.phone,
        is_restricted: medicalRecord.user.is_restricted
      } : null,
      doctor: medicalRecord.admin ? {
        user_id: medicalRecord.admin.user_id,
        full_name: medicalRecord.admin.full_name,
        email: medicalRecord.admin.email,
        phone: medicalRecord.admin.phone,
        role: medicalRecord.admin.role
      } : null,
      consultation: medicalRecord.consultation ? {
                id: medicalRecord.consultation.id,
                initial_issue: medicalRecord.consultation.initial_issue,
                status: medicalRecord.consultation.status,
                createdAt: medicalRecord.consultation.createdAt,
                updatedAt: medicalRecord.consultation.updatedAt
              } : null,
      age: medicalRecord.age,
      gender: medicalRecord.gender,
      height: medicalRecord.height,
      weight: medicalRecord.weight,
      chronic_diseases: medicalRecord.chronic_diseases,
      allergies: medicalRecord.allergies,
      previous_surgeries: medicalRecord.previous_surgeries,
      notes: medicalRecord.notes,
      createdAt: medicalRecord.created_at,
      updatedAt: medicalRecord.updated_at,
      allFiles: (medicalRecord.medical_attachments && Array.isArray(medicalRecord.medical_attachments)) ? 
        medicalRecord.medical_attachments.map(attachment => {
          // Handle both string filenames and complete file objects
          if (typeof attachment === 'string') {
            // If it's just a filename string, return basic info
            return {
              filename: attachment,
              originalname: attachment, // Using filename as originalname for now
              mimetype: 'application/octet-stream' // Default mimetype
            };
          } else {
            // If it's a full attachment object
            return {
              filename: attachment.filename,
              originalname: attachment.originalname,
              mimetype: attachment.mimetype || 'application/octet-stream'
            };
          }
        }) : []
    };
    
    successResponse(res, response, 'Medical record retrieved successfully');
  } catch (error) {
    if (error.message === 'Medical record not found' || 
        error.message === 'Not authorized to access this medical record') {
      return failureResponse(res, error.message, 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
}

/**
 * @desc    Get all medical records (for doctors/admins)
 * @route   GET /api/v1/medical-records
 * @access  Private (Doctor, Admin, Super Admin)
 */
const getAllMedicalRecords = async (req, res, next) => {
  try {
    // Check permissions
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to view all medical records', 403);
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let result;
      
    if (req.user.role === 'doctor') {
      // Doctors can only see their own records
      result = await medicalRecordService.getMedicalRecordsByDoctorId(req.user.user_id, page, limit);
    } else {
      // Admins and super admins can see all records
      result = await medicalRecordService.getAllMedicalRecords(page, limit);
    }

    // Format messages to match the sendMessage response format
    const formattedRecords = result.records.map(record => {
      return {
        id: record.id,
        user: record.user ? {
          user_id: record.user.user_id,
          full_name: record.user.full_name,
          email: record.user.email,
          phone: record.user.phone,
          is_restricted: record.user.is_restricted
        } : null,
        doctor: record.admin ? {
          user_id: record.admin.user_id,
          full_name: record.admin.full_name,
          email: record.admin.email,
          phone: record.admin.phone,
          role: record.admin.role
        } : null,
        consultation: record.consultation ? {
                  id: record.consultation.id,
                  initial_issue: record.consultation.initial_issue,
                  status: record.consultation.status,
                  createdAt: record.consultation.createdAt,
                  updatedAt: record.consultation.updatedAt
                } : null,
        age: record.age,
        gender: record.gender,
        height: record.height,
        weight: record.weight,
        chronic_diseases: record.chronic_diseases,
        allergies: record.allergies,
        previous_surgeries: record.previous_surgeries,
        notes: record.notes,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        allFiles: (record.medical_attachments && Array.isArray(record.medical_attachments)) ? 
          record.medical_attachments.map(attachment => ({
            filename: attachment.filename,
            originalname: attachment.originalname,
            mimetype: attachment.mimetype || 'application/octet-stream'
          })) : []
      };
    });

    successResponse(res, {
      records: formattedRecords,
      pagination: result.pagination
    }, 'Medical records retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
}

/**
 * @desc    Get medical records by user ID
 * @route   GET /api/v1/medical-records/user/:userId
 * @access  Private (Doctor, Secretary with proper permissions)
 */
const getMedicalRecordsByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check permissions based on user role and permissions
    if (validateAdminDoctorPermission(req.user)) {
      // Doctors, admins, and super admins can access records
    } else if (req.user.role === 'secretary') {
      // Secretaries need to be supervised by the doctor who created the records
      // and must have the required permission
      if (!hasPermission(req.user.role, 'view_medical_records')) {
        return failureResponse(res, 'Not authorized to access medical records', 403);
      }
      // We'll validate this when fetching records
    } else {
      return failureResponse(res, 'Not authorized to access medical records', 403);
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let result;
      
    if (req.user.role === 'secretary') {
      // Secretaries can only access records for their supervised doctor's patients (excluding restricted users)
      const doctor = await Admin.findByPk(req.user.supervisor_id);
      if (!doctor) {
        return failureResponse(res, 'Supervisor not found', 404);
      }
      result = await medicalRecordService.getMedicalRecordsByDoctorIdExcludingRestricted(doctor.user_id, page, limit);
    } else if (req.user.role === 'doctor') {
      // Doctors can access their own records for the specified user
      result = await medicalRecordService.getMedicalRecordsByUserId(userId, page, limit);
    } else {
      // Admins and super admins can access records
      result = await medicalRecordService.getMedicalRecordsByUserId(userId, page, limit);
    }

    // Format messages to match the sendMessage response format
    const formattedRecords = result.records.map(record => {
      return {
        id: record.id,
        user: record.user ? {
          user_id: record.user.user_id,
          full_name: record.user.full_name,
          email: record.user.email,
          phone: record.user.phone,
          is_restricted: record.user.is_restricted
        } : null,
        doctor: record.admin ? {
          user_id: record.admin.user_id,
          full_name: record.admin.full_name,
          email: record.admin.email,
          phone: record.admin.phone,
          role: record.admin.role
        } : null,
        consultation: record.consultation ? {
                  id: record.consultation.id,
                  initial_issue: record.consultation.initial_issue,
                  status: record.consultation.status,
                  createdAt: record.consultation.createdAt,
                  updatedAt: record.consultation.updatedAt
                } : null,
        age: record.age,
        gender: record.gender,
        height: record.height,
        weight: record.weight,
        chronic_diseases: record.chronic_diseases,
        allergies: record.allergies,
        previous_surgeries: record.previous_surgeries,
        notes: record.notes,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        allFiles: (record.medical_attachments && Array.isArray(record.medical_attachments)) ? 
          record.medical_attachments.map(attachment => ({
            filename: attachment.filename,
            originalname: attachment.originalname,
            mimetype: attachment.mimetype || 'application/octet-stream'
          })) : []
      };
    });

    successResponse(res, {
      records: formattedRecords,
      pagination: result.pagination
    }, 'Medical records retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get medical records by doctor ID (only for the doctor themselves)
 * @route   GET /api/v1/medical-records/doctor/:doctorId
 * @access  Private (Doctor, Admin, Super Admin)
 */
const getMedicalRecordsByDoctorId = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    // Check permissions based on user role and permissions
    if (validateAdminDoctorPermission(req.user)) {
      // Doctors, admins, and super admins can access records
      // Doctors can only access their own records
      if (req.user.role === 'doctor' && req.user.user_id !== parseInt(doctorId)) {
        return failureResponse(res, 'Not authorized to access other doctors\' medical records', 403);
      }
    } else if (req.user.role === 'secretary') {
      // Secretaries can access records for their supervisor doctor
      if (!hasPermission(req.user.role, 'view_medical_records')) {
        return failureResponse(res, 'Not authorized to access medical records', 403);
      }
      // For secretary, doctorId should match their supervisor_id
      if (req.user.supervisor_id !== parseInt(doctorId)) {
        return failureResponse(res, 'Not authorized to access other doctors\' medical records', 403);
      }
    } else {
      return failureResponse(res, 'Not authorized to access medical records', 403);
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let result;
    
    if (req.user.role === 'secretary') {
      // For secretaries, use the supervisor ID instead of the requested doctorId
      // The permission check already validated that the requested doctorId matches supervisor_id
      result = await medicalRecordService.getMedicalRecordsBySecretarySupervisor(req.user.supervisor_id, page, limit);
    } else {
      // For doctors, admins, and super admins, use the requested doctorId
      result = await medicalRecordService.getMedicalRecordsByDoctorId(doctorId, page, limit);
    }

    // Format messages to match the sendMessage response format
    const formattedRecords = result.records.map(record => {
      return {
        id: record.id,
        user: record.user ? {
          user_id: record.user.user_id,
          full_name: record.user.full_name,
          email: record.user.email,
          phone: record.user.phone,
          is_restricted: record.user.is_restricted
        } : null,
        doctor: record.admin ? {
          user_id: record.admin.user_id,
          full_name: record.admin.full_name,
          email: record.admin.email,
          phone: record.admin.phone,
          role: record.admin.role
        } : null,
        consultation: record.consultation ? {
                  id: record.consultation.id,
                  initial_issue: record.consultation.initial_issue,
                  status: record.consultation.status,
                  createdAt: record.consultation.createdAt,
                  updatedAt: record.consultation.updatedAt
                } : null,
        age: record.age,
        gender: record.gender,
        height: record.height,
        weight: record.weight,
        chronic_diseases: record.chronic_diseases,
        allergies: record.allergies,
        previous_surgeries: record.previous_surgeries,
        notes: record.notes,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        allFiles: (record.medical_attachments && Array.isArray(record.medical_attachments)) ? 
          record.medical_attachments.map(attachment => ({
            filename: attachment.filename,
            originalname: attachment.originalname,
            mimetype: attachment.mimetype || 'application/octet-stream'
          })) : []
      };
    });

    successResponse(res, {
      records: formattedRecords,
      pagination: result.pagination
    }, 'Medical records retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Update medical record by ID
 * @route   PUT /api/v1/medical-records/:id
 * @access  Private (Doctor only)
 */
const updateMedicalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      age, 
      gender, 
      height, 
      weight, 
      chronic_diseases, 
      allergies, 
      previous_surgeries, 
      notes,
      consultation_id
    } = req.body;

    // Validate that the authenticated user is a doctor
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Only doctors, admins, or super admins can update medical records', 403);
    }

    // Get the current medical record to check permissions
    const currentRecord = await medicalRecordService.getMedicalRecordById(id);
    if (!currentRecord) {
      return failureResponse(res, 'Medical record not found', 404);
    }

    // Validate permissions for updating
    if (!validateMedicalRecordPermission(req.user, currentRecord.doctor_id)) {
      return failureResponse(res, 'Not authorized to update this medical record', 403);
    }

    // Prepare update data
    const updateData = {};
    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (height !== undefined) updateData.height = height;
    if (weight !== undefined) updateData.weight = weight;
    if (chronic_diseases !== undefined) updateData.chronic_diseases = chronic_diseases;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (previous_surgeries !== undefined) updateData.previous_surgeries = previous_surgeries;
    if (notes !== undefined) updateData.notes = notes;
    if (consultation_id !== undefined) updateData.consultation_id = consultation_id;

    // Handle file uploads if present in request
    let medical_attachments = currentRecord.medical_attachments; // Keep existing attachments by default
    
    // Check for files in the format provided by mediaUpdate middleware
    let uploadedFiles = [];
    
    // Check if req.files is an array (as provided by the mediaUpdate middleware)
    if (req.files && Array.isArray(req.files)) {
      // Filter files by fieldname 'medical_attachments'
      uploadedFiles = req.files.filter(file => file.fieldname === 'medical_attachments');
      console.log('Found uploaded files from middleware:', uploadedFiles);
    } else if (req.files && req.files['medical_attachments']) {
      // Traditional Multer format
      uploadedFiles = req.files['medical_attachments'];
      console.log('Found uploaded files in traditional format:', uploadedFiles);
    }
    
    const hasMedicalAttachmentFiles = uploadedFiles.length > 0;
    const hasPreserveAttachments = req.body.preserveAttachments;
    
    if (hasMedicalAttachmentFiles || hasPreserveAttachments) {
      medical_attachments = [];
      
      // Check if we need to preserve specific attachments
      if (hasPreserveAttachments) {
        try {
          const preserveList = typeof req.body.preserveAttachments === 'string' 
            ? JSON.parse(req.body.preserveAttachments) 
            : req.body.preserveAttachments;
          
          if (Array.isArray(preserveList)) {
            // Filter existing attachments to keep only those in preserve list
            medical_attachments = (Array.isArray(currentRecord.medical_attachments) ? 
              currentRecord.medical_attachments : []).filter(attachment => 
              preserveList.includes(typeof attachment === 'string' ? attachment : attachment.filename)
            );
          }
        } catch (parseError) {
          console.warn('Could not parse preserveAttachments:', parseError.message);
          // Don't preserve anything if parsing fails
          medical_attachments = [];
        }
      }
      
      // Handle new file uploads
      if (hasMedicalAttachmentFiles) {
        const newFiles = uploadedFiles.map(file => file.filename); // Store only filename in database
        
        // Add new files to the attachments
        medical_attachments = [...medical_attachments, ...newFiles];
      }
    }
    
    // Add updated medical attachments to the update data
    const updateRecordData = {
      ...updateData,
      medical_attachments: medical_attachments
    };
    
    const updatedRecord = await medicalRecordService.updateMedicalRecord(id, updateRecordData);

    // Format response to include allFiles like messages
    const response = {
      id: updatedRecord.id,
      user: updatedRecord.user ? {
        user_id: updatedRecord.user.user_id,
        full_name: updatedRecord.user.full_name,
        email: updatedRecord.user.email,
        phone: updatedRecord.user.phone,
        is_restricted: updatedRecord.user.is_restricted
      } : null,
      doctor: updatedRecord.admin ? {
        user_id: updatedRecord.admin.user_id,
        full_name: updatedRecord.admin.full_name,
        email: updatedRecord.admin.email,
        phone: updatedRecord.admin.phone,
        role: updatedRecord.admin.role
      } : null,
      consultation: updatedRecord.consultation ? {
                id: updatedRecord.consultation.id,
                initial_issue: updatedRecord.consultation.initial_issue,
                status: updatedRecord.consultation.status,
                createdAt: updatedRecord.consultation.createdAt,
                updatedAt: updatedRecord.consultation.updatedAt
              } : null,
      age: updatedRecord.age,
      gender: updatedRecord.gender,
      height: updatedRecord.height,
      weight: updatedRecord.weight,
      chronic_diseases: updatedRecord.chronic_diseases,
      allergies: updatedRecord.allergies,
      previous_surgeries: updatedRecord.previous_surgeries,
      notes: updatedRecord.notes,
      createdAt: updatedRecord.created_at,
      updatedAt: updatedRecord.updated_at,
      allFiles: (updatedRecord.medical_attachments && Array.isArray(updatedRecord.medical_attachments)) ? 
        updatedRecord.medical_attachments.map(attachment => {
          // Handle both string filenames and complete file objects
          if (typeof attachment === 'string') {
            // If it's just a filename string, return basic info
            return {
              filename: attachment,
              originalname: attachment, // Using filename as originalname for now
              mimetype: 'application/octet-stream' // Default mimetype
            };
          } else {
            // If it's a full attachment object
            return {
              filename: attachment.filename,
              originalname: attachment.originalname,
              mimetype: attachment.mimetype || 'application/octet-stream'
            };
          }
        }) : []
    };
    
    successResponse(res, response, 'Medical record updated successfully');
  } catch (error) {
    if (error.message === 'Medical record not found' || 
        error.message === 'Not authorized to update this medical record' ||
        error.message === 'File upload/update failed') {
      return failureResponse(res, error.message, 400);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Delete medical record by ID
 * @route   DELETE /api/v1/medical-records/:id
 * @access  Private (Doctor only)
 */
const deleteMedicalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate that the authenticated user is a doctor
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Only doctors, admins, or super admins can delete medical records', 403);
    }

    // Get the current medical record to check permissions
    const currentRecord = await medicalRecordService.getMedicalRecordById(id);
    if (!currentRecord) {
      return failureResponse(res, 'Medical record not found', 404);
    }

    // Doctors can only delete their own records
    if (req.user.role === 'doctor' && req.user.user_id !== currentRecord.doctor_id) {
      return failureResponse(res, 'Not authorized to delete this medical record', 403);
    }

    const deleted = await medicalRecordService.deleteMedicalRecord(id);

    if (deleted) {
      successResponse(res, null, 'Medical record deleted successfully');
    } else {
      failureResponse(res, 'Medical record not found', 404);
    }
  } catch (error) {
    if (error.message === 'Medical record not found' || 
        error.message === 'Not authorized to delete this medical record') {
      return failureResponse(res, error.message, 400);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  createMedicalRecord,
  getMedicalRecordById,
  getAllMedicalRecords,
  getMedicalRecordsByUserId,
  getMedicalRecordsByDoctorId,
  updateMedicalRecord,
  deleteMedicalRecord
};
