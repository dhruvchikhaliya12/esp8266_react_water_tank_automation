import { FC, useCallback, useContext, useEffect } from 'react';
import { Navigate, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AxiosError } from 'axios';

import { FeaturesContext } from './contexts/features';
import * as AuthenticationApi from './api/authentication';
import { PROJECT_PATH } from './api/env';
import { AXIOS } from './api/endpoints';
import { Layout, RequireAdmin } from './components';

import WiFiConnection from './framework/wifi/WiFiConnection';
import AccessPoint from './framework/ap/AccessPoint';
import NetworkTime from './framework/ntp/NetworkTime';
import System from './framework/system/System';
import Security from './framework/security/Security';
import TankInfo from './project/TankInfo';

const AuthenticatedRouting: FC = () => {
  const { features } = useContext(FeaturesContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleApiResponseError = useCallback((error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      AuthenticationApi.storeLoginRedirect(location);
      navigate("/unauthorized");
    }
    return Promise.reject(error);
  }, [location, navigate]);

  useEffect(() => {
    const axiosHandlerId = AXIOS.interceptors.response.use((response) => response, handleApiResponseError);
    return () => AXIOS.interceptors.response.eject(axiosHandlerId);
  }, [handleApiResponseError]);

  return (
    <Layout>
      <Routes>
        {features.project && (
          <Route path={`/${PROJECT_PATH}/*`} element={<TankInfo />} />
        )}
        <Route path="/wifi/*" element={<WiFiConnection />} />
        <Route path="/ap/*" element={<AccessPoint />} />
        {features.ntp && (
          <Route path="/ntp/*" element={<NetworkTime />} />
        )}
        {features.security && (
          <Route
            path="/security/*"
            element={
              <RequireAdmin>
                <Security />
              </RequireAdmin>
            }
          />
        )}
        <Route path="/system/*" element={<System />} />
        <Route path="/*" element={<Navigate to={AuthenticationApi.getDefaultRoute(features)} />} />
      </Routes>
    </Layout>
  );
};

export default AuthenticatedRouting;
