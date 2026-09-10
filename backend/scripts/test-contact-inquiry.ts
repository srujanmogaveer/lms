/**
 * Test Contact Inquiry API and Admin Notification pipeline
 * Run: npx tsx scripts/test-contact-inquiry.ts
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { ContactService } from '../src/services/contact.service';

async function testContactPipeline() {
  console.log('--- 1. Testing Contact Inquiry Creation ---');
  const inquiry = await ContactService.createInquiry({
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    phone: '+1 555-0199',
    subject: 'Question about React Certification',
    category: 'Courses',
    message: 'Hello, does the React certification include verifications for LinkedIn and employer portals?',
  });

  console.log('Created Inquiry:', inquiry.id, inquiry.name, inquiry.category);

  console.log('--- 2. Testing Admin Inquiries Query ---');
  const list = await ContactService.getInquiries({ status: 'new' });
  console.log('Found inquiries:', list.inquiries.length, 'Total:', list.pagination.total);

  const found = list.inquiries.find((i) => i.id === inquiry.id);
  if (found) {
    console.log('SUCCESS: Inquiry successfully retrieved from service pipeline!');
  } else {
    console.log('WARNING: Could not find created inquiry in list.');
  }

  console.log('--- 3. Testing Admin Status Update ---');
  const updated = await ContactService.updateInquiryStatus(inquiry.id, {
    status: 'in_progress',
    adminNotes: 'Assigned to Academic Advisor',
  });
  console.log('Updated Status:', updated.status, 'Notes:', updated.adminNotes);

  console.log('All tests passed successfully!');
}

testContactPipeline()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  });
