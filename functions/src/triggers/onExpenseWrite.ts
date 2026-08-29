import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import type { Expense } from '@rotortech-tes/shared';
import { totalOf } from '@rotortech-tes/shared';
import { db } from '../admin';

/** Keeps `records/{recordId}.expensesTotal` in sync whenever a line item
 *  is added, edited or removed, so queue/dashboard list views can show a
 *  running total without opening every record's expenses subcollection. */
export const onExpenseWrite = onDocumentWritten('records/{recordId}/expenses/{expenseId}', async (event) => {
  const { recordId } = event.params;
  const recordRef = db.collection('records').doc(recordId);
  const recordSnap = await recordRef.get();
  if (!recordSnap.exists) return; // parent record was deleted along with its expenses

  const expensesSnap = await recordRef.collection('expenses').get();
  const expenses = expensesSnap.docs.map((d) => d.data() as Expense);
  await recordRef.update({ expensesTotal: totalOf(expenses) });
});
