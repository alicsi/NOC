import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import '../styles.css';

const MySwal = withReactContent(Swal);

const AdminForm = ({ onAddEntry }) => {
  const [name, setName] = useState('');
  const [textarea, setTextarea] = useState('');
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEntries, setFilteredEntries] = useState([]);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/leaderboard`);
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const handleSearch = useCallback(() => {
    const filtered = entries.filter(entry => 
      (entry.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.text || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEntries(filtered);
  }, [entries, searchTerm]);

  useEffect(() => {
    fetchEntries();
  }, []);

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
      fetchEntries();
      if (onAddEntry) onAddEntry();
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const createEntry = async (name, text) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/leaderboard`, { name, text });
    } catch (error) {
      console.error('Error creating entry:', error);
    }
  };

  const updateEntry = async (id, name, text) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/leaderboard/${id}`, { name, text });
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
        axios.delete(`${process.env.REACT_APP_API_URL}/leaderboard/${id}`)
          .then(() => {
            fetchEntries();
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
    window.open(`${process.env.REACT_APP_FRONTEND_URL}/leaderboard`, '_blank');
  };

  return (
    <div className="admin-form-container">
      <div className="form-container">
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
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
            <label htmlFor="textarea">How Can We Help You?</label>
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
            {filteredEntries.slice(0, 3).map((entry) => (
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
    </div>
  );
};

export default AdminForm;
