import assert from 'node:assert/strict';
import * as bcrypt from 'bcryptjs';
import { sqlValidationService } from '../src/server/sql-validation.service.js';
import { User } from '../src/types/index.js';

const admin: User = { id: '00000000-0000-0000-0000-000000000001', name: 'Test Admin', email: 'test@example.local', role: 'Admin' };

async function run(): Promise<void> {
  // 1. Valid Read-Only Query
  const count = sqlValidationService.validate('SELECT COUNT(*) AS total_students FROM students;', admin);
  assert.equal(count.isValid, true, 'SELECT COUNT(*) should be valid');

  // 2. Blocked DDL and DML operations
  for (const sql of [
    'DELETE FROM students',
    'DROP TABLE students',
    'TRUNCATE TABLE students',
    'INSERT INTO students (first_name) VALUES (\'Eve\')',
    'UPDATE students SET first_name = \'Eve\'',
    'ALTER TABLE students ADD COLUMN test TEXT',
    'GRANT ALL ON students TO PUBLIC',
    'SELECT student_id FROM students; DROP TABLE students;',
    'SELECT student_id FROM students -- comment',
    'SELECT student_id FROM pg_catalog.pg_authid',
    'SELECT password FROM students',
  ]) {
    const res = sqlValidationService.validate(sql, admin);
    assert.equal(res.isValid, false, `Expected to block: ${sql}`);
  }

  // 3. RBAC checks
  const faculty: User = { ...admin, role: 'Faculty', departmentCode: 'AIML' };
  assert.equal(sqlValidationService.validate('SELECT fee_id FROM fees', faculty).isValid, false, 'Faculty should not access fees');

  // 4. Password hashing verification
  const passwordHash = await bcrypt.hash('local-test-password', 4);
  assert.equal(await bcrypt.compare('local-test-password', passwordHash), true, 'Bcrypt hash comparison should match');

  console.log('All Core Security and SQL Validation Tests Passed!');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
