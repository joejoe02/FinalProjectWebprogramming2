import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { setSession } from "../store/sessionSlice";
import "../styles/Welcome.css";

const Welcome: React.FC = () => {
  const [nickname, setNickname] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleJoin = () => {
    if (!nickname.trim()) return alert("Enter a nickname");

    socket.auth = { username: nickname };
    socket.connect();

    socket.on("session", (session) => {
      console.log("Connected:", session);
      localStorage.setItem("sessionID", session.sessionID);
      dispatch(
        setSession({
          sessionID: session.sessionID,
          userID: session.userID,
          username: session.username,
        })
      );
      navigate("/dashboard");
    });
  };

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h1 className="welcome-heading">Welcome to Tic-Tac-Toe</h1>
        <input
          type="text"
          placeholder="Enter your nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="welcome-input"
        />
        <button onClick={handleJoin} className="welcome-button">
          Join Game
        </button>
      </div>
    </div>
  );
};

export default Welcome;
