import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from './store';
import Welcome from './views/Welcome';
import Dashboard from './views/Dashboard';
import Match from './views/Match';
import NavigationBar from './components/NavigationBar/NavigationBar';
import withAuth from './hocs/withAuth';
import { setSession } from './store/sessionSlice';
import './styles/globalStyles.css';

const AuthorizedDashboard = withAuth(Dashboard);
const AuthorizedMatch = withAuth(Match);

const AppRoutes: React.FC = () => {
  const dispatch = useDispatch();
  const sessionID = useSelector((state: RootState) => state.session.sessionID);
  const location = useLocation();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const savedSessionID = localStorage.getItem("sessionID");
    if (savedSessionID) {
      dispatch(setSession({ sessionID: savedSessionID, userID: "", username: "" }));
    }
    setCheckingSession(false);
  }, [dispatch]);

  if (checkingSession) return null;

  const showNavbar = sessionID && location.pathname !== "/";

  return (
    <>
      {showNavbar && <NavigationBar />}
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/dashboard" element={<AuthorizedDashboard />} />
        <Route path="/match/:id" element={<AuthorizedMatch />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />
      </Router>
    </Provider>
  );
};

export default App;
