const Project = require('../models/Project');
const Lead = require('../models/Lead');

// @desc    שליפת כל הפרויקטים (כולל נתוני הליד המקושר)
// @route   GET /api/projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({})
      .populate('lead', 'name email phone serviceType')
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בשליפת הפרויקטים', error: error.message });
  }
};

// @desc    שליפת פרויקט בודד לפי מזהה
// @route   GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('lead');

    if (!project) {
      return res.status(404).json({ message: 'הפרויקט המבוקש לא נמצא' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בשליפת הפרויקט', error: error.message });
  }
};

// @desc    יצירת פרויקט חדש (מקושר לליד)
// @route   POST /api/projects
const createProject = async (req, res) => {
  try {
    const { name, description, lead, status, budget, deadline } = req.body;

    if (!name || !lead) {
      return res.status(400).json({ message: 'נא להזין שם פרויקט ולקשר ליד' });
    }

    // לוודא שהליד אכן קיים במערכת
    const leadExists = await Lead.findById(lead);
    if (!leadExists) {
      return res.status(404).json({ message: 'הליד המשויך לא נמצא במערכת' });
    }

    const newProject = await Project.create({
      name,
      description,
      lead,
      status: status || 'בביצוע',
      budget: budget || 0,
      deadline,
    });

    const populatedProject = await Project.findById(newProject._id).populate('lead', 'name email');

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(400).json({ message: 'שגיאה ביצירת הפרויקט', error: error.message });
  }
};

// @desc    עדכון פרויקט קיים
// @route   PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'הפרויקט לעדכון לא נמצא' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('lead');

    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: 'שגיאה בעדכון הפרויקט', error: error.message });
  }
};

// @desc    מחיקת פרויקט
// @route   DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'הפרויקט למחיקה לא נמצא' });
    }

    await project.deleteOne();
    res.status(200).json({ message: 'הפרויקט נמחק בהצלחה', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה במחיקת הפרויקט', error: error.message });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};