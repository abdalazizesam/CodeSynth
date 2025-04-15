const Document = require('../models/Document');

// Get all documents for a user
exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id },
        { isPublic: true }
      ]
    }).sort({ updatedAt: -1 });
    
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single document
exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user has access to this document
    const hasAccess = 
      document.owner.equals(req.user._id) || 
      document.collaborators.includes(req.user._id) ||
      document.isPublic;
      
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new document
exports.createDocument = async (req, res) => {
  try {
    const { title, language, isPublic } = req.body;
    
    const document = await Document.create({
      title,
      language: language || 'javascript',
      owner: req.user._id,
      isPublic: isPublic || false
    });
    
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a document
exports.updateDocument = async (req, res) => {
  try {
    const { title, content, language, collaborators, isPublic } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Only owner can update document details (except content)
    if (!document.owner.equals(req.user._id) && 
        (title || language || collaborators || isPublic !== undefined)) {
      return res.status(403).json({ message: 'Only the owner can update document details' });
    }
    
    // Check if user can edit the content
    const canEdit = 
      document.owner.equals(req.user._id) || 
      document.collaborators.includes(req.user._id);
      
    if (!canEdit) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update fields
    if (title) document.title = title;
    if (content !== undefined) document.content = content;
    if (language) document.language = language;
    if (collaborators) document.collaborators = collaborators;
    if (isPublic !== undefined) document.isPublic = isPublic;
    
    await document.save();
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a document
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Only owner can delete document
    if (!document.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can delete this document' });
    }
    
    await Document.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};