const express = require('express');
const router = express.Router();
const {
  generateAssignment,
  getAssignments,
  getAssignment,
  updateAssignment,
  publishAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getAssignments);
router.get('/:id', verifyToken, getAssignment);

router.post('/generate', verifyToken, requireAdmin, generateAssignment);
router.put('/:id', verifyToken, requireAdmin, updateAssignment);
router.post('/:id/publish', verifyToken, requireAdmin, publishAssignment);
router.delete('/:id', verifyToken, requireAdmin, deleteAssignment);

module.exports = router;
