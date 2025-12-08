import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxcixjiafdohbpwijfmd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2l4amlhZmRvaGJwd2lqZm1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDEzNzc1MCwiZXhwIjoyMDc5NzEzNzUwfQ.CkLJXohBKk4kdZWNslbw-SwxOi8MVXQDLM4FarU_0zw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMessageTemplatesTable() {
  console.log('Checking message_templates table...');

  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .limit(1);

  if (error) {
    console.error('message_templates Error:', error);
    return false;
  }

  console.log('message_templates table exists! Current data:', data);
  return true;
}

async function checkScheduledMessagesTable() {
  console.log('\nChecking scheduled_messages table...');

  const { data, error } = await supabase
    .from('scheduled_messages')
    .select('*')
    .limit(5);

  if (error) {
    console.error('scheduled_messages Error:', error);
    return false;
  }

  console.log('scheduled_messages table exists! Current data:', data);
  return true;
}

async function checkMessageLogsTable() {
  console.log('\nChecking message_logs table...');

  const { data, error } = await supabase
    .from('message_logs')
    .select('*')
    .limit(5);

  if (error) {
    console.error('message_logs Error:', error);
    return false;
  }

  console.log('message_logs table exists! Current data:', data);
  return true;
}

async function testInsertTemplate() {
  console.log('\n--- Testing template insert ---');

  const { data, error } = await supabase
    .from('message_templates')
    .insert({
      name: 'CLI Test Template ' + Date.now(),
      message_en: 'This is a test message from CLI',
      type: 'sms',
      category: 'announcement',
      subject: 'Test Subject'
    })
    .select()
    .single();

  if (error) {
    console.error('Insert failed:', error);
    return false;
  }

  console.log('Insert successful:', data);
  return true;
}

async function main() {
  await checkMessageTemplatesTable();
  await checkScheduledMessagesTable();
  await checkMessageLogsTable();
  await testInsertTemplate();
}

main();
