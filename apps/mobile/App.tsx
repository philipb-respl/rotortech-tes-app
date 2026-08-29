import { ActivityIndicator, StatusBar, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Barlow_400Regular, Barlow_500Medium, Barlow_700Bold } from '@expo-google-fonts/barlow';
import { BarlowCondensed_400Regular, BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { PendingScreen } from './src/screens/PendingScreen';
import { NotEmployeeScreen } from './src/screens/NotEmployeeScreen';
import { EmployeeApp } from './src/screens/EmployeeApp';
import { colors } from './src/theme';

function Root() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!user) return <LoginScreen />;
  if (!profile || !profile.active) return <PendingScreen />;
  if (profile.role !== 'employee') return <NotEmployeeScreen role={profile.role} />;
  return <EmployeeApp />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_700Bold,
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <Root />
      </ToastProvider>
    </AuthProvider>
  );
}
