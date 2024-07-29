import React, { useState, useEffect, useRef } from 'react';
import '../styles.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import soundEffectFile from '../sound/Karaoke Score Sound.mp3';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const socket = useRef(null);
  const soundEffect = useRef(null);

  useEffect(() => {
    // Initialize socket connection using environment variable
    socket.current = io(process.env.REACT_APP_API_URL);

    const fetchLeaderboardData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/leaderboard`);
        if (response.data) {
          setLeaderboardData(response.data);
        }
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      }
    };

    fetchLeaderboardData();

    socket.current.on('new-entry', (data) => {
      setLeaderboardData((prevData) => [data, ...prevData]);
      if (soundEffect.current) {
        soundEffect.current.play().catch((error) => console.error('Error playing sound:', error));
      }
    });

    socket.current.on('update-entry', (updatedEntry) => {
      setLeaderboardData((prevData) =>
        prevData.map((entry) =>
          entry.id === updatedEntry.id ? updatedEntry : entry
        )
      );
    });

    socket.current.on('delete-entry', (id) => {
      setLeaderboardData((prevData) =>
        prevData.filter((entry) => entry.id !== id)
      );
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleDelete = (id) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true,
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${process.env.REACT_APP_API_URL}/leaderboard/${id}`)
          .then(() => {
            setLeaderboardData((prevData) =>
              prevData.filter((entry) => entry.id !== id)
            );
            MySwal.fire(
              'Deleted!',
              'Your entry has been deleted.',
              'success'
            );
          })
          .catch((error) => {
            console.error('Error deleting entry:', error);
            MySwal.fire(
              'Error!',
              'There was an error deleting the entry.',
              'error'
            );
          });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        MySwal.fire(
          'Cancelled',
          'Your entry is safe :)',
          'error'
        );
      }
    });
  };

  const handleToggleStatus = async (id, currentName, currentText, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'pending' : 'active';

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/leaderboard/${id}`, { name: currentName, text: currentText, status: newStatus });
      setLeaderboardData((prevData) =>
        prevData.map((entry) =>
          entry.id === id ? { ...entry, status: newStatus } : entry
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filterLeaderboardData = (data, query) => {
    return data
      .filter((item) => {
        const name = item.name ? item.name.toString() : '';
        return name.toLowerCase().includes(query.toLowerCase());
      })
      .slice(0, 10);
  };

  const filteredLeaderboardData = filterLeaderboardData(leaderboardData, searchQuery);

  useEffect(() => {
    const handleCanPlay = () => {
      console.log('Audio is ready to play.');
    };

    const audioElement = soundEffect.current;
    if (audioElement) {
      audioElement.addEventListener('canplay', handleCanPlay);
      return () => {
        audioElement.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, []);

  return (
    <main>
      <div id="header">
        <h1></h1>
        <div className="InputContainer">
          <input
            placeholder="Search.."
            id="input"
            className="input"
            name="text"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      <div id="leaderboard">
        <div className="ribbon"></div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Text</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaderboardData.map((item) => (
              <tr key={item.id}>
                <td className="number">{item.id}</td>
                <td className="name">{item.name}</td>
                <td className="text">{item.text}</td>
                <td className="status">
                  <button
                    onClick={() => handleToggleStatus(item.id, item.name, item.text, item.status)}
                    className={`status-button ${item.status}`}
                  >
                    {item.status === 'active' ? 'Active' : 'Pending'}
                  </button>
                </td>
                <td className="action">
                  <button onClick={() => handleDelete(item.id)} className="delete-button">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <audio ref={soundEffect} src={soundEffectFile} />
    </main>
  );
};

export default Leaderboard;
