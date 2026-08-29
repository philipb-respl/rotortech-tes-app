import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { Stage } from '@rotortech-tes/shared';
import { DashboardScreen } from './DashboardScreen';
import { TripInfoScreen } from './TripInfoScreen';
import { ExpensesScreen } from './ExpensesScreen';
import { AddExpenseScreen } from './AddExpenseScreen';
import { ReviewScreen } from './ReviewScreen';
import { StatusScreen } from './StatusScreen';
import { useRecordWithExpenses } from '../hooks/useRecordWithExpenses';
import { colors } from '../theme';

type Screen = 'dashboard' | 'info' | 'expenses' | 'addExpense' | 'review' | 'status';

/** The employee flow's own tiny state machine — mirrors the Claude Design
 *  prototype's `empScreen` state exactly (dashboard → info → expenses →
 *  addExpense / review → status) rather than a full navigation library,
 *  since it's a single linear flow with no deep-linking needs. */
export function EmployeeApp() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useRecordWithExpenses(activeId);

  function toDashboard() {
    setScreen('dashboard');
    setActiveId(null);
  }

  if (screen === 'dashboard') {
    return (
      <DashboardScreen
        onOpen={(id, stage) => {
          setActiveId(id);
          setScreen(stage === 'draft' ? 'expenses' : 'status');
        }}
        onCreated={(id) => {
          setActiveId(id);
          setScreen('info');
        }}
      />
    );
  }

  if (!active) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  switch (screen) {
    case 'info':
      return <TripInfoScreen record={active} onBack={toDashboard} onContinue={() => setScreen('expenses')} />;
    case 'expenses':
      return (
        <ExpensesScreen
          record={active}
          onBack={toDashboard}
          onEdit={() => setScreen('info')}
          onAddExpense={() => setScreen('addExpense')}
          onReview={() => setScreen('review')}
        />
      );
    case 'addExpense':
      return <AddExpenseScreen recordId={active.id} onCancel={() => setScreen('expenses')} onSaved={() => setScreen('expenses')} />;
    case 'review':
      return <ReviewScreen record={active} onBack={() => setScreen('expenses')} onSubmitted={() => setScreen('status')} />;
    case 'status':
      return <StatusScreen record={active} onBack={toDashboard} />;
    default:
      return null;
  }
}
