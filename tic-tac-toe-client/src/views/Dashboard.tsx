import React, { useEffect, useState } from "react";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { useSelector } from "react-redux";
import { RootState } from "../store";


interface Session {
  userID: string;
  username: string;
  connected: boolean;
}

interface Participant extends Session {
  symbol: "X" | "O";
}

interface Match {
  matchId: string;
  participants: Participant[];
  winner?: Participant | null;
  isOngoing: boolean;
}

interface ChallengeData {
  userID: string;
  username: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Session[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const session = useSelector((state: RootState) => state.session);
  const currentUser = session.userID;
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);

  useEffect(() => {
    
    
    socket.emit("users");
    socket.emit("matches");
  
    socket.on("users", (data: Session[]) => {
      console.log("Users received:", data);
      setUsers(data);
    });
  
    socket.on("matches", (data: Match[]) => {
      console.log("Matches received:", data);
      setMatches(data);
    });
  
    socket.on("connected_user", (newUser: Session) => {
      console.log("New user connected:", newUser);
      setUsers((prevUsers) => {
        const alreadyExists = prevUsers.some(user => user.userID === newUser.userID);
        return alreadyExists ? prevUsers : [...prevUsers, newUser];
      });
    });
  
    socket.on("match_ended", (matchId: string, winnerData: any) => {
      setMatches((prev) =>
        prev.map((m) => {
          if (m.matchId !== matchId) return m;
          const fullWinner = m.participants.find(p => p.userID === winnerData?.userID) || null;
          return {
            ...m,
            isOngoing: false,
            winner: fullWinner,
          };
        })
      );
    });
  
    return () => {
      socket.off("users");
      socket.off("matches");
      socket.off("session");
      socket.off("connected_user");
      socket.off("match_ended");
    };
  }, []);
  

  

  const challengeUser = (userID: string) => {
    socket.emit("game_challenge", userID);
    alert(`Challenge sent!`);
  };

  useEffect(() => {
    socket.on("game_challenge", (data) => {
      console.log("Challenge received from:", data.challenger.username);
      setChallenge({
        userID: data.challenger.userID,
        username: data.challenger.username,
      });
    });

    return () => {
      socket.off("game_challenge");
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && challenge) {
        console.log("User returned and challenge is still pending.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [challenge]);

  const acceptChallenge = () => {
    if (!challenge) return;
    // Generate a unique match id
    const matchId = crypto.randomUUID();
    // Send acceptance event to the server
    socket.emit("game_challenge_accepted", matchId, challenge.userID); 
    // Clear the challenge state
    setChallenge(null);
    // Redirect to the match view
    navigate(`/match/${matchId}`);
  };

  const declineChallenge = () => {
    if (!challenge) return;
    socket.emit("game_challenge_declined", challenge.userID);
    setChallenge(null);
  };

  // Listen for new matches
  useEffect(() => {
    socket.on("new_match", (match) => {
      setMatches((prevMatches) => [...prevMatches, match]);
    });

    return () => {
      socket.off("new_match");
    };
  }, []);

  useEffect(() => {
    socket.on("game_challenge_accepted", (matchId: string, challenger: Session) => {
      navigate(`/match/${matchId}`);
    });
  
    return () => {
      socket.off("game_challenge_accepted");
    };
  }, [navigate]);

  const otherUsers = users;
  console.log("Rendering dashboard - currentUser:", currentUser);



  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="title">Tic-Tac-Town</h1>
        {challenge && (
          <div className="challenge-popup">
            <h3>CHALLENGE ALERT!</h3>
            <p className="challenge-text">{challenge.username} has challenged you to a BATTLE!</p>
            <div className="challenge-buttons">
              <button className="accept-btn" onClick={acceptChallenge}>Accept Challenge</button>
              <button className="decline-btn" onClick={declineChallenge}>Run Away</button>
            </div>
          </div>
        )}
      </header>

      <main className="dashboard-main">
        <div className="dashboard-sections">
          <div className="dashboard-section">
            <h2 className="section-title">Players Online</h2>
            {otherUsers.length === 0 ? (
              <p className="empty-message">No other players online right now!</p>
            ) : (
              <ul className="list user-list">
                {users.map((user) => (
                  <li key={user.userID} className={`user-item ${user.connected ? "online" : "offline"}`}>
                    <div className="user-info">
                      <span className="user-name">{user.username}</span>
                      <span className="user-status">{user.connected ? "Online" : "Offline"}</span>
                    </div>
                    {currentUser === user.userID ? (
                      <span className="self-indicator">(me)</span>
                    ) : (
                      user.connected && (
                        <button
                          className="button challenge-btn"
                          onClick={() => challengeUser(user.userID)}
                        >
                          Challenge!
                        </button>
                      )
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
  
          <div className="dashboard-section">
            <h2 className="section-title">Game History</h2>
            {matches.length === 0 ? (
              <p className="empty-message">No matches played yet!</p>
            ) : (
              <ul className="list match-list">
                {matches.map((match) => (
                  <li key={match.matchId} className={`match-item ${match.isOngoing ? "ongoing" : "finished"}`}>
                    <div className="match-info">
                      <div className="match-players">
                        {match.participants.map((p, idx) => (
                          <span key={p.userID} className="player-name">
                            {p.username} [{p.symbol}]
                            {idx < match.participants.length - 1 && " vs "}
                          </span>
                        ))}
                      </div>
                      <div className="match-status">
                        {match.isOngoing ? (
                          <span className="status-badge ongoing">In Progress</span>
                        ) : (
                          <span className="status-badge finished">
                            {match.winner ? `Winner: ${match.winner.username}` : "Draw!"}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
  
};

export default Dashboard;