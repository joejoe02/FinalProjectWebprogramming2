import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import { setSession } from '../store/sessionSlice';

const withAuth = (WrappedComponent: React.ComponentType<any>) => {
  const ComponentWithAuth = (props: any) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const session = useSelector((state: RootState) => state.session);

    useEffect(() => {
      if (!session.sessionID) {
        navigate('/');
      } else {
        socket.auth = { sessionID: session.sessionID };
        if (!socket.connected) {
          socket.connect();
        }
        socket.on('session', (newSession) => {
          dispatch(setSession(newSession));
        });
      }

      return () => {
        socket.off('session');
      };
    }, [session, navigate, dispatch]);

    if (!session.sessionID) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  return ComponentWithAuth;
};

export default withAuth;
