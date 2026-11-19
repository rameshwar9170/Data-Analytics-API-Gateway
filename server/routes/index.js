const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const datasetRoutes = require('./dataset.routes');
const databaseRoutes = require('./database.routes');
const assignmentRoutes = require('./assignment.routes');
const assessmentRoutes = require('./assessment.routes');
const candidateRoutes = require('./candidate.routes');
const queryRoutes = require('./query.routes');
const analyticsRoutes = require('./analytics.routes');
const readOnlyRoutes = require('./readOnlyApi.routes');
const monitorRoutes = require('./monitor.routes');
const settingsRoutes = require('./settings.routes');

router.use('/auth', authRoutes);
router.use('/datasets', datasetRoutes);
router.use('/databases', databaseRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/candidates', candidateRoutes);
router.use('/queries', queryRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/data', readOnlyRoutes);
router.use('/monitor', monitorRoutes);
router.use('/settings', settingsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'iCoded Automation API',
  });
});

module.exports = router;
