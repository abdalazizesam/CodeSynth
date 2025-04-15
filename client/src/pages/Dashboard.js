import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/documents', {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        setDocuments(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch documents');
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [user]);
  
  const createNewDocument = async () => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/documents',
        { title: 'Untitled Document', language: 'javascript' },
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );
      navigate(`/editor/${response.data._id}`);
    } catch (err) {
      setError('Failed to create new document');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading documents...</div>;
  }
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>My Documents</h1>
        <button className="new-doc-btn" onClick={createNewDocument}>
          Create New Document
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="documents-list">
        {documents.length === 0 ? (
          <div className="no-documents">
            <p>You don't have any documents yet.</p>
            <button onClick={createNewDocument}>Create your first document</button>
          </div>
        ) : (
          documents.map(doc => (
            <div className="document-card" key={doc._id}>
              <h3>{doc.title}</h3>
              <p>Language: {doc.language}</p>
              <p>Last updated: {new Date(doc.updatedAt).toLocaleString()}</p>
              <Link to={`/editor/${doc._id}`} className="open-doc-btn">
                Open
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;