// Simple code analyzer for providing suggestions
const analyzeJavaScript = (code) => {
    const suggestions = [];
    
    // Check for missing semicolons
    if (code.match(/\w+\s*\n\s*\w+/g) && !code.match(/;\s*\n/g)) {
      suggestions.push({
        type: 'style',
        message: 'Consider adding semicolons at the end of statements'
      });
    }
    
    // Check for console.log statements
    if (code.includes('console.log')) {
      suggestions.push({
        type: 'debug',
        message: 'Remember to remove console.log statements in production code'
      });
    }
    
    // Check for potential memory leaks in event listeners
    if (code.includes('addEventListener') && !code.includes('removeEventListener')) {
      suggestions.push({
        type: 'warning',
        message: 'Potential memory leak: addEventListener without removeEventListener'
      });
    }
    
    // Check for unused variables (simple version)
    const varDeclarations = code.match(/(?:let|const|var)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/g) || [];
    for (const declaration of varDeclarations) {
      const varName = declaration.split(/\s+/)[1];
      const usage = new RegExp(`\\b${varName}\\b`, 'g');
      const usageMatches = code.match(usage) || [];
      
      if (usageMatches.length <= 1) {
        suggestions.push({
          type: 'unused',
          message: `Variable '${varName}' might be unused`
        });
      }
    }
    
    return suggestions;
  };
  
  // Add more language analyzers later
  const analyzeCode = (code, language) => {
    switch (language.toLowerCase()) {
      case 'javascript':
        return analyzeJavaScript(code);
      // Add more languages later
      default:
        return [{
          type: 'info',
          message: `Code analysis for ${language} is not implemented yet`
        }];
    }
  };
  
  module.exports = { analyzeCode };