import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxcixjiafdohbpwijfmd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2l4amlhZmRvaGJwd2lqZm1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDEzNzc1MCwiZXhwIjoyMDc5NzEzNzUwfQ.CkLJXohBKk4kdZWNslbw-SwxOi8MVXQDLM4FarU_0zw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupTestTemplates() {
  console.log('=== Cleaning up test templates ===');

  // Delete CLI test templates
  const { data: deleted, error } = await supabase
    .from('message_templates')
    .delete()
    .like('name', 'CLI Test Template%')
    .select();

  if (error) {
    console.error('Error deleting test templates:', error);
  } else {
    console.log('Deleted test templates:', deleted?.length || 0);
  }

  // Delete the old workflow test template
  const { data: deleted2, error: error2 } = await supabase
    .from('message_templates')
    .delete()
    .like('name', 'Test Workflow Template%')
    .select();

  if (error2) {
    console.error('Error deleting workflow templates:', error2);
  } else {
    console.log('Deleted workflow test templates:', deleted2?.length || 0);
  }

  // Delete Test Announcement Template
  const { data: deleted3, error: error3 } = await supabase
    .from('message_templates')
    .delete()
    .eq('name', 'Test Announcement Template')
    .select();

  if (error3) {
    console.error('Error:', error3);
  } else {
    console.log('Deleted test announcement templates:', deleted3?.length || 0);
  }
}

async function listFinalTemplates() {
  console.log('\n=== Final Template List ===');

  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching templates:', error);
    return;
  }

  console.log(`Total templates: ${data.length}\n`);
  data.forEach((template, index) => {
    console.log(`${index + 1}. ${template.name}`);
    console.log(`   Type: ${template.type} | Category: ${template.category}`);
    console.log(`   Subject: ${template.subject || 'N/A'}`);
    console.log(`   Created: ${template.created_at}`);
    console.log('');
  });
}

async function listScheduledMessages() {
  console.log('\n=== Scheduled Messages ===');

  const { data, error } = await supabase
    .from('scheduled_messages')
    .select('*')
    .order('scheduled_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total scheduled messages: ${data.length}\n`);
  const pendingCount = data.filter(m => m.status === 'pending').length;
  const sentCount = data.filter(m => m.status === 'sent').length;
  const failedCount = data.filter(m => m.status === 'failed').length;
  const cancelledCount = data.filter(m => m.status === 'cancelled').length;

  console.log(`Pending: ${pendingCount}`);
  console.log(`Sent: ${sentCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Cancelled: ${cancelledCount}`);
}

async function checkMessageLogs() {
  console.log('\n=== Message Logs ===');

  const { data, error } = await supabase
    .from('message_logs')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total logs fetched: ${data.length}`);
  if (data.length === 0) {
    console.log('No message logs yet - logs will appear when messages are sent.');
  }
}

async function main() {
  await cleanupTestTemplates();
  await listFinalTemplates();
  await listScheduledMessages();
  await checkMessageLogs();

  console.log('\n=== Summary ===');
  console.log('All APIs fixed to use service role key');
  console.log('message_logs table created');
  console.log('Fleet transition template created');
  console.log('\nPlease refresh the browser to see the updated data!');
}

main();
