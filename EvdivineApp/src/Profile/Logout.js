import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const Logout = ({ navigation }) => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    const resetAction = CommonActions.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });

    const parent = navigation.getParent?.();
    if (parent) {
      parent.dispatch(resetAction);
      return;
    }

    navigation.dispatch(resetAction);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#A34B1F" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Logout</Text>

        <View style={styles.headerIcon}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="log-out-outline" size={44} color="#A34B1F" />
          </View>

          <Text style={styles.title}>Ready to logout?</Text>
          <Text style={styles.subtitle}>
            You will be signed out from your current session and taken back to the login screen.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogout}
          >
            <Text style={styles.primaryButtonText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Logout;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F4FA',
  },
  header: {
    backgroundColor: '#A34B1F',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 18 : 8,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    elevation: 4,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 30,
    backgroundColor: '#F1E4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 22,
  },
  primaryButton: {
    width: '100%',
    height: 54,
    borderRadius: 18,
    backgroundColor: '#A34B1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  secondaryButton: {
    width: '100%',
    height: 54,
    borderRadius: 18,
    backgroundColor: '#F1E4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#A34B1F',
  },
});
