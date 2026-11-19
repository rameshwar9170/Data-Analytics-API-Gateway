/**
 * Admin & Demo Candidate Seed
 * Creates default admin and demo candidate user if none exists
 */

const User = require('../models/User');
const logger = require('../utils/logger');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const admin = await User.create({
        email: 'admin@icoded.in',
        password: 'admin123',
        name: 'iCoded Admin',
        role: 'admin',
        status: 'active',
      });
      logger.info(`Default admin created: ${admin.email}`);
    }

    const candidateExists = await User.findOne({ role: 'candidate' });
    if (!candidateExists) {
      const candidate = await User.create({
        email: 'candidate@icoded.in',
        password: 'candidate123',
        name: 'Alex Rivera (Data Analyst Candidate)',
        role: 'candidate',
        status: 'active',
      });
      logger.info(`Default candidate created: ${candidate.email}`);
    }
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
  }
};

module.exports = seedAdmin;
