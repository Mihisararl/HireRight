import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getErrorMessage } from '../api/client';
import { updateProfile } from '../api/auth';
import { getMyAvailability, updateAvailability } from '../api/provider';
import { useTranslation } from 'react-i18next';
import LoadingView from '../components/LoadingView';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../constants/theme';

const SERVICE_CATEGORIES = [
  'Home Cleaning',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Landscaping',
  'HVAC',
  'Handyman',
  'Moving',
  'Other',
];

const SRI_LANKAN_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa',
  'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle',
];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  postalCode: '',
  city: '',
  district: '',
  serviceCategory: '',
  yearsOfExperience: '',
  rateType: 'hourly',
  rateAmount: '',
  professionalBio: '',
  bankName: '',
  accountNumber: '',
  accountHolderName: '',
  branch: '',
};

function Field({ label, value, onChangeText, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
      />
    </View>
  );
}

function userToForm(user) {
  if (!user) return { ...emptyForm };

  const rateType = user.rateType === 'daily' ? 'daily' : 'hourly';
  const rateAmount = rateType === 'daily'
    ? (user.dailyRate != null ? String(user.dailyRate) : '')
    : (user.hourlyRate != null ? String(user.hourlyRate) : '');

  return {
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    postalCode: user.postalCode || '',
    city: user.city || '',
    district: user.district || '',
    serviceCategory: user.serviceCategory || '',
    yearsOfExperience: user.yearsOfExperience != null ? String(user.yearsOfExperience) : '',
    rateType,
    rateAmount,
    professionalBio: user.professionalBio || '',
    bankName: user.bankName || '',
    accountNumber: user.accountNumber || '',
    accountHolderName: user.accountHolderName || '',
    branch: user.branch || '',
  };
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(true);
  const [bookedDates, setBookedDates] = useState([]);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setForm(userToForm(user));
  }, [user]);

  const loadAvailability = useCallback(async () => {
    if (user?.providerStatus !== 'approved') return;
    setLoading(true);
    try {
      const data = await getMyAvailability();
      setAvailable(Boolean(data.isAvailableToday));
      setBookedDates(data.bookedDates || []);
    } catch (err) {
      Alert.alert(t('mobile.error'), getErrorMessage(err, t('mobile.failedLoadAvailability')));
    } finally {
      setLoading(false);
    }
  }, [user?.providerStatus, t]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
      loadAvailability();
    }, [loadAvailability, refreshUser])
  );

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAvailability = async (value) => {
    setSavingAvailability(true);
    try {
      const data = await updateAvailability(value);
      setAvailable(Boolean(data.isAvailableToday));
      setBookedDates(data.bookedDates || []);
    } catch (err) {
      Alert.alert(t('mobile.error'), getErrorMessage(err, t('provider.alerts.failedUpdateAvailability')));
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      Alert.alert(t('mobile.validation'), t('mobile.nameEmailPhoneRequired'));
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        postalCode: form.postalCode.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        serviceCategory: form.serviceCategory.trim(),
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : 0,
        rateType: form.rateType,
        hourlyRate: form.rateType === 'hourly' && form.rateAmount ? Number(form.rateAmount) : null,
        dailyRate: form.rateType === 'daily' && form.rateAmount ? Number(form.rateAmount) : null,
        professionalBio: form.professionalBio.trim(),
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        accountHolderName: form.accountHolderName.trim(),
        branch: form.branch.trim(),
      });
      await refreshUser();
      Alert.alert(t('common.saveChanges'), t('mobile.profileSaved'));
    } catch (err) {
      Alert.alert(t('mobile.error'), getErrorMessage(err, t('auth.completeProfileFailed')));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('mobile.logoutTitle'), t('mobile.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: logout },
    ]);
  };

  const hasSubmittedWorkerProfile = Boolean(user?.workerProfileSubmitted);
  const isApproved = user?.providerStatus === 'approved';
  const isRejected = user?.providerStatus === 'rejected';

  const statusMessage = isRejected
    ? t('provider.registrationRejected')
    : hasSubmittedWorkerProfile
      ? t('provider.registrationPending')
      : t('provider.registrationIncomplete');

  if (loading && isApproved) {
    return <LoadingView message={t('mobile.loadingProfile')} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.langRow}>
          <Text style={styles.langLabel}>{t('language')}</Text>
          <LanguageSwitcher />
        </View>

        <View style={styles.card}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.meta}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.badge}>{t('mobile.roleBadge', { role: user?.role })}</Text>
            <Text style={styles.badge}>{t('mobile.statusBadge', { status: user?.providerStatus || 'pending' })}</Text>
          </View>
        </View>

        {isApproved ? (
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>{t('mobile.availableToday')}</Text>
                <Text style={styles.hint}>
                  {available ? t('mobile.availableTodayHint') : t('mobile.unavailableTodayHint')}
                </Text>
              </View>
              <Switch
                value={available}
                onValueChange={toggleAvailability}
                disabled={savingAvailability}
              />
            </View>
            {bookedDates.length > 0 ? (
              <Text style={styles.booked}>{t('mobile.bookedDates', { dates: bookedDates.join(', ') })}</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={[styles.pending, isRejected && styles.rejected]}>
              {statusMessage}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('mobile.profileSettings')}</Text>
          <Text style={styles.hint}>{t('mobile.profileSettingsHint')}</Text>

          <Field label={t('auth.fullName')} value={form.name} onChangeText={(v) => updateField('name', v)} />
          <Field
            label={t('common.email')}
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field
            label={t('common.phone')}
            value={form.phone}
            onChangeText={(v) => updateField('phone', v)}
            keyboardType="phone-pad"
          />
          <Field label={t('provider.settingsPage.city')} value={form.city} onChangeText={(v) => updateField('city', v)} />
          <Field
            label={t('provider.settingsPage.district')}
            value={form.district}
            onChangeText={(v) => updateField('district', v)}
            placeholder={SRI_LANKAN_DISTRICTS.slice(0, 3).join(', ') + '...'}
          />
          <Field
            label={t('provider.settingsPage.postalCode')}
            value={form.postalCode}
            onChangeText={(v) => updateField('postalCode', v)}
          />
          <Field
            label={t('provider.settingsPage.streetAddress')}
            value={form.address}
            onChangeText={(v) => updateField('address', v)}
            multiline
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('mobile.professionalInfo')}</Text>
          <Field
            label={t('provider.settingsPage.serviceCategory')}
            value={form.serviceCategory}
            onChangeText={(v) => updateField('serviceCategory', v)}
            placeholder={SERVICE_CATEGORIES.join(', ')}
          />
          <Field
            label={t('provider.settingsPage.yearsOfExperience')}
            value={form.yearsOfExperience}
            onChangeText={(v) => updateField('yearsOfExperience', v)}
            keyboardType="numeric"
          />

          <Text style={styles.label}>{t('mobile.chargeType')}</Text>
          <View style={styles.rateTypeRow}>
            <Pressable
              style={[styles.rateTypeBtn, form.rateType === 'hourly' && styles.rateTypeBtnActive]}
              onPress={() => updateField('rateType', 'hourly')}
            >
              <Text style={[styles.rateTypeText, form.rateType === 'hourly' && styles.rateTypeTextActive]}>
                {t('mobile.hourlyRateLabel')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.rateTypeBtn, form.rateType === 'daily' && styles.rateTypeBtnActive]}
              onPress={() => updateField('rateType', 'daily')}
            >
              <Text style={[styles.rateTypeText, form.rateType === 'daily' && styles.rateTypeTextActive]}>
                {t('mobile.dailyChargeLabel')}
              </Text>
            </Pressable>
          </View>

          <Field
            label={form.rateType === 'daily' ? t('provider.settingsPage.dailyRate') : t('provider.settingsPage.hourlyRate')}
            value={form.rateAmount}
            onChangeText={(v) => updateField('rateAmount', v)}
            keyboardType="numeric"
            placeholder={form.rateType === 'daily' ? '8000' : '1200'}
          />
          <Field
            label={t('provider.settingsPage.professionalBio')}
            value={form.professionalBio}
            onChangeText={(v) => updateField('professionalBio', v)}
            multiline
            style={[styles.input, styles.textArea]}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('mobile.bankDetails')}</Text>
          <Field
            label={t('provider.settingsPage.bankName')}
            value={form.bankName}
            onChangeText={(v) => updateField('bankName', v)}
          />
          <Field
            label={t('provider.settingsPage.accountNumber')}
            value={form.accountNumber}
            onChangeText={(v) => updateField('accountNumber', v)}
            keyboardType="numeric"
          />
          <Field
            label={t('provider.settingsPage.accountHolderName')}
            value={form.accountHolderName}
            onChangeText={(v) => updateField('accountHolderName', v)}
          />
          <Field
            label={t('provider.settingsPage.branch')}
            value={form.branch}
            onChangeText={(v) => updateField('branch', v)}
          />
        </View>

        <Pressable
          style={[styles.saveBtn, savingProfile && styles.buttonDisabled]}
          onPress={handleSaveProfile}
          disabled={savingProfile}
        >
          <Text style={styles.saveBtnText}>
            {savingProfile ? t('common.saving') : t('mobile.saveProfile')}
          </Text>
        </Pressable>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  meta: {
    marginTop: 4,
    color: colors.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  badge: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  hint: {
    marginBottom: spacing.md,
    color: colors.textMuted,
    fontSize: 13,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  rateTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rateTypeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  rateTypeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#eff6ff',
  },
  rateTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  rateTypeTextActive: {
    color: colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#f8fafc',
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  booked: {
    marginTop: spacing.md,
    color: '#9a3412',
    fontSize: 13,
  },
  pending: {
    color: colors.warning,
    lineHeight: 20,
  },
  rejected: {
    color: colors.danger,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutBtn: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
