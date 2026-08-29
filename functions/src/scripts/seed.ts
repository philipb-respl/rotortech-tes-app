/**
 * Seeds demo users + TES records — the same cast and records as the Claude
 * Design prototype's seedRecords(), but written through the real Auth +
 * Firestore data model. Safe to re-run: existing users/records are left
 * alone rather than duplicated.
 *
 * Usage (see docs/SETUP.md for the full walkthrough):
 *   Against the emulator suite:
 *     firebase emulators:exec --project rotortech-tes "npm run seed"
 *   Against a real project (after `gcloud auth application-default login`
 *   or with GOOGLE_APPLICATION_CREDENTIALS set):
 *     GCLOUD_PROJECT=rotortech-tes npm run seed
 */
import { getAuth } from 'firebase-admin/auth';
import { stageFromDates, totalOf } from '@rotortech-tes/shared';
import type { Expense, TesRecord } from '@rotortech-tes/shared';
import { SEED_USERS, SEED_RECORDS, SEED_NEXT_TES_SEQUENCE, SEED_TES_YEAR } from '@rotortech-tes/shared';
import { db } from '../admin';

async function ensureAuthUser(email: string, password: string, name: string): Promise<string> {
  const auth = getAuth();
  try {
    const existing = await auth.getUserByEmail(email);
    return existing.uid;
  } catch {
    const created = await auth.createUser({ email, password, displayName: name, emailVerified: true });
    return created.uid;
  }
}

async function main() {
  console.log(`Seeding against project: ${process.env.GCLOUD_PROJECT || '(default)'}`);

  const uidByEmail = new Map<string, string>();
  for (const u of SEED_USERS) {
    const uid = await ensureAuthUser(u.email, u.password, u.name);
    uidByEmail.set(u.email, uid);
    await db.collection('users').doc(uid).set(
      {
        uid,
        name: u.name,
        employeeId: u.employeeId,
        email: u.email,
        department: u.department,
        role: u.role,
        active: u.active,
        createdAt: Date.now(),
      },
      { merge: true },
    );
    console.log(`  user  ${u.role.padEnd(8)} ${u.name} <${u.email}> (${uid})`);
  }

  for (const r of SEED_RECORDS) {
    const already = await db.collection('records').where('tesNo', '==', r.tesNo).limit(1).get();
    if (!already.empty) {
      console.log(`  skip  ${r.tesNo} (already exists)`);
      continue;
    }
    const employeeUid = uidByEmail.get(r.employeeEmail);
    const employeeSeed = SEED_USERS.find((u) => u.email === r.employeeEmail);
    if (!employeeUid || !employeeSeed) throw new Error(`Unknown seed employee: ${r.employeeEmail}`);

    const recordRef = db.collection('records').doc();
    const stage = stageFromDates(r);
    const record: TesRecord = {
      id: recordRef.id,
      tesNo: r.tesNo,
      employeeUid,
      employeeName: employeeSeed.name,
      employeeId: employeeSeed.employeeId,
      department: employeeSeed.department,
      projectCode: r.projectCode,
      purpose: r.purpose,
      location: r.location,
      startDate: r.startDate,
      endDate: r.endDate,
      advanceAmount: r.advanceAmount,
      expensesTotal: totalOf(r.expenses),
      stage,
      submittedDate: r.submittedDate,
      receivedDate: r.receivedDate,
      approvedDate: r.approvedDate,
      accountsEntryDate: r.accountsEntryDate,
      advanceDate: r.advanceDate,
      expenseApproved: r.expenseApproved,
      balanceEmployee: r.balanceEmployee,
      balanceCompany: r.balanceCompany,
      rejected: r.rejected,
      approverComment: r.approverComment,
      driveFileId: null,
      driveFileUrl: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await recordRef.set(record);

    const batch = db.batch();
    for (const e of r.expenses) {
      const expenseRef = recordRef.collection('expenses').doc();
      const expense: Expense = {
        id: expenseRef.id,
        category: e.category as Expense['category'],
        date: e.date,
        description: e.description,
        amount: e.amount,
        billNo: e.billNo,
        remarks: e.remarks,
        receiptPath: null,
        createdAt: Date.now(),
      };
      batch.set(expenseRef, expense);
    }
    await batch.commit();
    console.log(`  record ${r.tesNo} (${stage}) — ${r.expenses.length} expenses`);
  }

  // So the next real submission continues the sequence after the seeded
  // demo TES numbers instead of colliding with one of them.
  await db.collection('meta').doc('tesCounter').set({ year: SEED_TES_YEAR, seq: SEED_NEXT_TES_SEQUENCE - 1 });

  console.log('Done.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
