import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import socket from '../../socket';
import '../../styles/NavigationBar.css';
import { clearSession } from '../../store/sessionSlice';

interface RootState {
  session: {
    username: string;
  }
}

const NavigationBar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const username = useSelector((state: RootState) => state.session.username);
  
  const handleLeave = () => {
    socket.emit('leave');
    
    socket.disconnect();
    
    localStorage.removeItem('sessionID');
    
    dispatch(clearSession());
    
    navigate('/');
  };
  
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <span className="logo">Tic-Tac-Toe!</span>
      </div>
      <div className="navbar-username">
        <span className="username">Player: {username}</span>
      </div>
      <div className="navbar-actions">
        <button onClick={handleLeave} className="button leave-button">
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default NavigationBar;