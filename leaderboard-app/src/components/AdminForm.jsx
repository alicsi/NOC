import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import '../styles.css';
import { io } from 'socket.io-client';

const MySwal = withReactContent(Swal);

const AdminForm = ({ onAddEntry }) => {
  const [name, setName] = useState('');
  const [textarea, setTextarea] = useState('');
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL;
  const frontendUrl = process.env.REACT_APP_FRONTEND_URL;

  const socket = useRef(null);

  // Fetch entries and history data from the server
  const fetchEntries = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/leaderboard`);
      if (Array.isArray(response.data)) {
        setEntries(response.data);
      } else {
        console.error('Unexpected response data:', response.data);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  }, [apiUrl]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/deleted-entries`);
      if (Array.isArray(response.data)) {
        setHistory(response.data);
      } else {
        console.error('Unexpected response data:', response.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchEntries();
    fetchHistory();

    // Initialize Socket.IO connection
    socket.current = io(apiUrl);

    socket.current.on('new-entry', (data) => {
      setEntries((prevEntries) => [data, ...prevEntries]);
    });

    socket.current.on('update-entry', (updatedEntry) => {
      setEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.id === updatedEntry.id ? { ...entry, ...updatedEntry } : entry
        )
      );
    });

    socket.current.on('delete-entry', (id) => {
      setEntries((prevEntries) => prevEntries.filter((entry) => entry.id !== id));
    });

    return () => {
      socket.current.disconnect();
    };
  }, [fetchEntries, fetchHistory, apiUrl]);

  const handleSearch = useCallback(() => {
    const filtered = (entries || []).filter(entry =>
      (entry.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.text || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEntries(filtered);
  }, [entries, searchTerm]);

  useEffect(() => {
    handleSearch();
  }, [entries, searchTerm, handleSearch]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, name, textarea);
      } else {
        await createEntry(name, textarea);
      }
      setName('');
      setTextarea('');
      setEditingEntry(null);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const createEntry = async (name, text) => {
    try {
      await axios.post(`${apiUrl}/leaderboard`, { name, text });
    } catch (error) {
      console.error('Error creating entry:', error);
    }
  };

  const updateEntry = async (id, name, text) => {
    try {
      await axios.put(`${apiUrl}/leaderboard/${id}`, { name, text });
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setName(entry.name || '');
    setTextarea(entry.text || '');
  };

  const handleDelete = (id) => {
    const swalWithBootstrapButtons = MySwal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger'
      },
      buttonsStyling: false
    });

    swalWithBootstrapButtons.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${apiUrl}/leaderboard/${id}`)
          .then(() => {
            fetchEntries();
            fetchHistory();
            swalWithBootstrapButtons.fire(
              'Deleted!',
              'Your entry has been deleted.',
              'success'
            );
          })
          .catch((error) => {
            console.error('Error deleting entry:', error);
            swalWithBootstrapButtons.fire(
              'Error!',
              'There was an error deleting the entry.',
              'error'
            );
          });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        swalWithBootstrapButtons.fire(
          'Cancelled',
          'Your entry is safe :)',
          'error'
        );
      }
    });
  };

  const handleOpenLeaderboard = () => {
    window.open(`${frontendUrl}/leaderboard`, '_blank');
  };

  const toggleHistoryModal = () => {
    if (!showHistory) {
      fetchHistory();
    }
    setShowHistory(!showHistory);
  };

  return (
    <div className="admin-form-container">
      <div className="form-container">
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Client Name: </label>
            <input
              required
              name="name"
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="textarea">Issue: </label>
            <textarea
              required
              cols="50"
              rows="10"
              id="textarea"
              name="textarea"
              value={textarea}
              onChange={(e) => setTextarea(e.target.value)}
            />
          </div>
          <button type="submit" className="form-submit-btn">
            {editingEntry ? 'Update' : 'Submit'}
          </button>
          <button type="button" onClick={handleOpenLeaderboard}>Open Leaderboard</button>
          <button type="button" onClick={toggleHistoryModal}>Show History</button>
        </form>
      </div>

      <div className="entries-container">
        <div className="InputContainer">
          <input
            placeholder="Search.."
            id="input"
            className="input"
            name="text"
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <table className="entries-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(filteredEntries || []).slice(0, 3).map((entry) => (
              <tr key={entry.id}>
                <td>{entry.name || 'No Name'}</td>
                <td>{entry.text || 'No Description'}</td>
                <td>
                  <button onClick={() => handleEdit(entry)}>Edit</button>
                  <button onClick={() => handleDelete(entry.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showHistory && (
        <div className="modal-overlay">
          <div className="history-modal">
            <h2>Deleted Entries History</h2>
            <button onClick={toggleHistoryModal} className="close-button">Close</button>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Deleted At</th>
                </tr>
              </thead>
              <tbody>
                {(history || []).map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.name || 'No Name'}</td>
                    <td>{entry.text || 'No Description'}</td>
                    <td>{entry.date_deleted ? new Date(entry.date_deleted).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminForm;
