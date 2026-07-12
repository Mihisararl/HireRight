import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import PublicHeader from './PublicHeader';
import PublicSidebar from './PublicSidebar';
import { colors } from '../constants/theme';

export default function PublicScreenLayout({ navigation, activeRoute, children }) {
  return (
    <View style={styles.container}>
      <PublicHeader navigation={navigation} activeRoute={activeRoute} />
      <PublicSidebar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 32,
  },
});
