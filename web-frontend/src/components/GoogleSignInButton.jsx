import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';

export default function GoogleSignInButton({ onSuccess, onError, disabled }) {
  const { t } = useTranslation();
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return null;
  }

  return (
    <div style={{ width: '100%', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <GoogleLogin
        onSuccess={(response) => {
          if (response?.credential) {
            onSuccess(response.credential);
          } else {
            onError?.(t('auth.googleSignInFailed'));
          }
        }}
        onError={() => onError?.(t('auth.googleSignInFailed'))}
        useOneTap={false}
        theme="outline"
        size="large"
        width={320}
        text="continue_with"
        locale="en"
      />
    </div>
  );
}
