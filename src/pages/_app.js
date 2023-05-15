import '@/styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import LoginPage from '../pages/register';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
