const models = require('../models');

/**
 * Creates an audit log entry in the database.
 * 
 * @param {string} username - The user who performed the action (or "SYSTEM")
 * @param {string} action - The action string (e.g., "TUITION_PAYMENT_SUBMITTED")
 * @param {string} studentId - The MongoDB ObjectId of the student (optional)
 * @param {string} details - Human-readable details about the action
 * @param {Object} oldValue - The prior state of the resource (optional)
 * @param {Object} newValue - The new state of the resource (optional)
 */
async function logAudit(username, action, studentId = null, details = '', oldValue = null, newValue = null) {
  try {
    await models.AuditLog.create({
      user: username || 'SYSTEM',
      action,
      student: studentId,
      details,
      oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Dispatches an in-app notification to specific user roles.
 * 
 * @param {string} title - Title of the notification
 * @param {string} message - Body content of the notification
 * @param {Array<string>} roles - Target roles (e.g. ['SUPER_ADMIN', 'BOOK_DEPT'])
 */
async function createNotification(title, message, roles = []) {
  try {
    await models.Notification.create({
      title,
      message,
      roles: roles.length > 0 ? roles : ['SUPER_ADMIN', 'TUITION_DEPT', 'BOOK_DEPT', 'UNIFORM_DEPT'],
      readBy: []
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

module.exports = {
  logAudit,
  createNotification
};
