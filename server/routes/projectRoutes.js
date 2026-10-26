const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');

// אבטחה גורפת לכל נתיבי הפרויקטים
router.use(protect);

// @route POST /api/projects
router.post("/", createProject);

// @route GET /api/projects
router.get("/", getProjects);

// @route GET /api/projects/:id
router.get("/:id", getProjectById);

// @route PUT /api/projects/:id
router.put("/:id", updateProject);

// @route DELETE /api/projects/:id
router.delete("/:id", deleteProject);

module.exports = router;