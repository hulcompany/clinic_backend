const express = require('express');
const router = express.Router();
const { 
  createMedicalRecord,
  getMedicalRecordById,
  getAllMedicalRecords,
  getMedicalRecordsByUserId,
  getMedicalRecordsByDoctorId,
  updateMedicalRecord,
  deleteMedicalRecord
} = require('../controllers/medicalRecord.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { conditionalMediaManagement, deleteMediaCleanup } = require('../middleware/mediaUpdate.middleware');

// POST /api/v1/medical-records - Create a new medical record (Doctor only)
router.post('/', 
  authMiddleware.protect,
  
  // Handle media uploads for medical attachments
  conditionalMediaManagement({
    fieldName: 'medical_attachments',
    contentType: 'medical_records',
     mediaField: 'medical_attachments',
    uploadType: 'array',
    mediaType: 'image',
    entityType: 'medical_record',
    cleanup: false // No cleanup needed for new medical records
  }),
  createMedicalRecord
);


// GET /api/v1/medical-records - Get all medical records (Doctor, Admin, Super Admin only)
router.get('/', 
  authMiddleware.protect,
  getAllMedicalRecords
);

// GET /api/v1/medical-records/:id - Get medical record by ID
router.get('/:id', 
  authMiddleware.protect,
  getMedicalRecordById
);

// GET /api/v1/medical-records/user/:userId - Get medical records by user ID
router.get('/user/:userId', 
  authMiddleware.protect,
  getMedicalRecordsByUserId
);

// GET /api/v1/medical-records/doctor/:doctorId - Get medical records by doctor ID
router.get('/doctor/:doctorId', 
  authMiddleware.protect,
  getMedicalRecordsByDoctorId
);

// PUT /api/v1/medical-records/:id - Update medical record by ID (Doctor only)
router.put('/:id', 
  authMiddleware.protect,
  // Handle media uploads for medical attachments update
  conditionalMediaManagement({
    fieldName: 'medical_attachments',
    contentType: 'medical_records',
    mediaField: 'medical_attachments',  // Use the model attribute name (plural)
    uploadType: 'array',
    mediaType: 'image',
    entityType: 'medical_record',
    cleanup: true // Cleanup old attachments when updating
  }),
  updateMedicalRecord
);

// DELETE /api/v1/medical-records/:id - Delete medical record by ID (Doctor only)
router.delete('/:id', 
  authMiddleware.protect,
  // Add media cleanup middleware for deletion
  deleteMediaCleanup({
    entityType: 'medical_record',
    contentType: 'medical_records',
    mediaField: 'medical_attachments',
    mediaType: 'images'
  }),
  deleteMedicalRecord
);

module.exports = router;