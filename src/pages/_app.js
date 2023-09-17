import '@/styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import poppins from '../../utils/font';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <div className={poppins.className}>
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  );
}

export default MyApp;
