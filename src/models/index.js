/*
Model Index File (index.js)
----------------------
Purpose:
- Loads all models
- Defines relationships between them
- Avoids circular dependency issues
*/

// Load models
const User = require('./User');
const Admin = require('./Admin');
const Otp = require('./Otp');
const RefreshToken = require('./RefreshToken');
const BlacklistedToken = require('./BlacklistedToken');
const Consultation = require('./Consultation');
const Chat = require('./Chat');
const Message = require('./Message');
const Session = require('./Session');
const Service = require('./Service');
const ContactUs = require('./ContactUs');
const Review = require('./Review');
const Availability = require('./Availability');
const MedicalRecord = require('./MedicalRecord');
const Blog = require('./Blog');
const Notification = require('./Notification');
const LandingImage = require('./LandingImage');

// Define relationships between models (avoid defining if they already exist)
User.hasMany(Otp, { foreignKey: 'user_id' }); // User has many Otps
Otp.belongsTo(User, { foreignKey: 'user_id' });  

Admin.hasMany(Otp, { foreignKey: 'admin_id' }); // Admin has many Otps
Otp.belongsTo(Admin, { foreignKey: 'admin_id' });  

User.hasMany(RefreshToken, { foreignKey: 'userId' }); // User has many RefreshTokens
RefreshToken.belongsTo(User, { foreignKey: 'userId' });  

Admin.hasMany(RefreshToken, { foreignKey: 'adminId' }); // Admin has many RefreshTokens
RefreshToken.belongsTo(Admin, { foreignKey: 'adminId' });  

// Relationships for new models
User.hasMany(Consultation, { foreignKey: 'user_id' }); // User has many Consultations
Consultation.belongsTo(User, { foreignKey: 'user_id' });  

Admin.hasMany(Consultation, { foreignKey: 'admin_id' }); // Admin has many Consultations
Consultation.belongsTo(Admin, { foreignKey: 'admin_id' });  

Consultation.hasOne(Chat, { foreignKey: 'consultation_id' }); // Consultation has one Chat
Chat.belongsTo(Consultation, { foreignKey: 'consultation_id' });  

Chat.hasMany(Message, { foreignKey: 'chat_id' }); // Chat has many Messages
Message.belongsTo(Chat, { foreignKey: 'chat_id' });  

// Message sender associations
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'SenderUser', constraints: false }); // Message can be sent by User
Message.belongsTo(Admin, { foreignKey: 'sender_id', as: 'SenderAdmin', constraints: false }); // Message can be sent by Admin  

// Session associations
Admin.hasMany(Session, { foreignKey: 'admin_id' }); // Admin has many Sessions
Session.belongsTo(Admin, { foreignKey: 'admin_id' }); // Session belongs to Admin  

// Review associations
User.hasMany(Review, { foreignKey: 'user_id' }); // User has many Reviews
Review.belongsTo(User, { foreignKey: 'user_id' }); // Review belongs to User

// Availability associations
Admin.hasMany(Availability, { foreignKey: 'admin_id' }); // Admin has many Availability slots
Availability.belongsTo(Admin, { foreignKey: 'admin_id' }); // Availability belongs to Admin
User.hasMany(Availability, { foreignKey: 'booked_by_user_id' }); // User has many booked Availability slots
Availability.belongsTo(User, { foreignKey: 'booked_by_user_id' }); // Availability booked by User

// Consultation and Session associations for Availability
Availability.belongsTo(Consultation, { foreignKey: 'consultation_id' }); // Availability belongs to Consultation
Availability.belongsTo(Session, { foreignKey: 'session_id' }); // Availability belongs to Session

// Medical Record associations
User.hasMany(MedicalRecord, { foreignKey: 'user_id', as: 'medicalRecords' }); // User has many Medical Records
MedicalRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' }); // Medical Record belongs to User

Admin.hasMany(MedicalRecord, { foreignKey: 'doctor_id', as: 'medicalRecords' }); // Admin has many Medical Records
MedicalRecord.belongsTo(Admin, { foreignKey: 'doctor_id', as: 'admin' }); // Medical Record belongs to Admin

Consultation.hasMany(MedicalRecord, { foreignKey: 'consultation_id', as: 'medicalRecords' }); // Consultation has many Medical Records
MedicalRecord.belongsTo(Consultation, { foreignKey: 'consultation_id', as: 'consultation' }); // Medical Record belongs to Consultation

// Supervisor-secretary relationships (Admin to Admin)
Admin.hasMany(Admin, { as: 'secretaries', foreignKey: 'supervisor_id' }); // Supervisor has many secretaries
Admin.belongsTo(Admin, { as: 'supervisor', foreignKey: 'supervisor_id' }); // Secretary belongs to supervisor

// Blog relationships
Admin.hasMany(Blog, { foreignKey: 'author_id', as: 'blogs' }); // Admin has many Blogs
Blog.belongsTo(Admin, { foreignKey: 'author_id', as: 'author' }); // Blog belongs to Admin (author)

// Notification relationships
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' }); // User has many Notifications
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' }); // Notification belongs to User

// Export models with relationships
const models = {
  User,
  Admin,
  Otp,
  RefreshToken,
  BlacklistedToken,
  Consultation,
  Chat,
  Message,
  Session,
  Service,
  ContactUs,
  Review,
  Availability,
  MedicalRecord,
  Blog,
  Notification,
  LandingImage
};

// Call associate methods if they exist
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});


module.exports = models;
