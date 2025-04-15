import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { AuthContext } from '../context/AuthContext';

const Editor = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [document, setDocument] = useState(null);
  const [code, setCode] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  
  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // Join document room and listen for changes
  useEffect(() => {
    if (socket == null || !id) return;
    
    socket.emit('join-document', id);
    
    socket.on('receive-changes', (newCode) => {
      setCode(newCode);
    });
    
    return () => {
      socket.off('receive-changes');
    };
  }, [socket, id]);
  
  // Fetch document data
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/documents/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        setDocument(response.data);
        setCode(response.data.content);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch document');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchDocument();
    }
  }, [id, user]);
  
  // Send code changes to server and other clients
  const handleCodeChange = (value) => {
    setCode(value);
    
    if (socket) {
      socket.emit('code-change', { documentId: id, code: value });
    }
    
    // Debounced save to database
    const saveTimeout = setTimeout(() => {
      saveDocument(value);
    }, 2000);
    
    return () => clearTimeout(saveTimeout);
  };
  
  const saveDocument = async (content) => {
    try {
      await axios.put(
        `http://localhost:5000/api/documents/${id}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );
    } catch (err) {
      setError('Failed to save document');
    }
  };
  
  const handleTitleChange = async (e) => {
    const newTitle = e.target.value;
    setDocument({ ...document, title: newTitle });
    
    try {
      await axios.put(
        `http://localhost:5000/api/documents/${id}`,
        { title: newTitle },
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );
    } catch (err) {
      setError('Failed to update title');
    }
  };
  
  const getCodeReview = async () => {
    setReviewLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/code-review/analyze',
        { code, language: document.language },
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );
      setSuggestions(response.data.suggestions);
    } catch (err) {
      setError('Failed to get code review');
    } finally {
      setReviewLoading(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading editor...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  return (
    <div className="editor-container">
      <div className="editor-header">
        <input
          type="text"
          value={document?.title || ''}
          onChange={handleTitleChange}
          className="document-title"
        />
        <button onClick={getCodeReview} className="review-btn" disabled={reviewLoading}>
          {reviewLoading ? 'Analyzing...' : 'Get Code Review'}
        </button>
      </div>
      
      <div className="editor-content">
        <div className="code-editor">
          <CodeMirror
            value={code}
            height="70vh"
            extensions={[javascript()]}
            onChange={handleCodeChange}
            theme="dark"
          />
        </div>
        
        {suggestions.length > 0 && (
          <div className="code-review-panel">
            <h3>Code Review Suggestions</h3>
            <ul className="suggestion-list">
              {suggestions.map((suggestion, index) => (
                <li key={index} className={`suggestion-item ${suggestion.type}`}>
                  <span className="suggestion-type">{suggestion.type}</span>
                  <p>{suggestion.message}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;