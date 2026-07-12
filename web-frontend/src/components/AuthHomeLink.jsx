import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AuthHomeLink() {
  const { t } = useTranslation();

  return (
    <Link
      to="/"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: '#0066cc',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '15px',
      }}
    >
      ← {t('auth.backToHome')}
    </Link>
  );
}
