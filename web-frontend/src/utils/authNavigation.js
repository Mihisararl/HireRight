export const navigateAfterAuth = (navigate, user, location) => {
  if (user.needsProfileCompletion && (user.role === 'customer' || user.role === 'provider')) {
    navigate('/complete-profile', { replace: true });
    return;
  }

  if (location?.state?.bookingIntent) {
    if (user.role === 'customer') {
      navigate('/services', { state: { bookingIntent: location.state.bookingIntent } });
    } else {
      navigate('/provider-dashboard');
    }
    return;
  }

  if (user.role === 'provider') {
    navigate('/provider-dashboard');
  } else if (user.role === 'customer') {
    navigate('/customer-dashboard');
  } else {
    navigate('/');
  }
};
