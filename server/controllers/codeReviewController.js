const { analyzeCode } = require('../utils/codeAnalyzer');

// Get code review suggestions
exports.getCodeReview = async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }
    
    const suggestions = analyzeCode(code, language);
    
    // Add a small delay to simulate AI processing time
    setTimeout(() => {
      res.json({ suggestions });
    }, 500);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// For future AI-powered enhancements
exports.getAIImprovement = async (req, res) => {
  try {
    const { code, language, prompt } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }
    
    // This is a placeholder - in a real app, you would call an AI API here
    const improvement = {
      suggestions: analyzeCode(code, language),
      improvedCode: code, // In a real implementation, this would be improved by AI
      explanation: "This is a placeholder for AI-generated improvements. In a production version, this would connect to an AI service to provide intelligent code suggestions."
    };
    
    // Add a delay to simulate AI processing
    setTimeout(() => {
      res.json(improvement);
    }, 1000);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};