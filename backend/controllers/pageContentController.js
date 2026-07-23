const PageContent = require("../models/PageContent");

exports.createPageContent = async (req, res) => {
  try {
    const { pageName, title, subtitle, content, image } = req.body;

    if (!pageName || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "Page name, title and content are required",
      });
    }

    const pageContent = await PageContent.create({
      pageName,
      title,
      subtitle,
      content,
      image,
    });

    res.status(201).json({
      success: true,
      message: "Page content created successfully",
      pageContent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPageContents = async (req, res) => {
  try {
    const contents = await PageContent.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      contents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPageContentById = async (req, res) => {
  try {
    const pageContent = await PageContent.findById(req.params.id);

    if (!pageContent) {
      return res.status(404).json({
        success: false,
        message: "Page content not found",
      });
    }

    res.status(200).json({
      success: true,
      pageContent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePageContent = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = req.file.path;
    }

    const pageContent = await PageContent.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!pageContent) {
      return res.status(404).json({
        success: false,
        message: "Page content not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Page content updated successfully",
      pageContent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePageContent = async (req, res) => {
  try {
    const pageContent = await PageContent.findByIdAndDelete(req.params.id);

    if (!pageContent) {
      return res.status(404).json({
        success: false,
        message: "Page content not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Page content deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};