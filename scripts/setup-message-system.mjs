import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxcixjiafdohbpwijfmd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2l4amlhZmRvaGJwd2lqZm1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDEzNzc1MCwiZXhwIjoyMDc5NzEzNzUwfQ.CkLJXohBKk4kdZWNslbw-SwxOi8MVXQDLM4FarU_0zw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMessageLogsTable() {
  console.log('Creating message_logs table...');

  // First check if the table already exists
  const { data: existingData, error: checkError } = await supabase
    .from('message_logs')
    .select('id')
    .limit(1);

  if (!checkError) {
    console.log('message_logs table already exists');
    return true;
  }

  // Create the table using raw SQL via Supabase's SQL endpoint
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS message_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'both')),
      subject VARCHAR(500),
      message_content TEXT NOT NULL,
      recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('individual', 'group', 'custom')),
      recipient_identifier VARCHAR(255) NOT NULL,
      recipient_name VARCHAR(255),
      status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
      error_message TEXT,
      sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      was_scheduled BOOLEAN DEFAULT FALSE,
      scheduled_message_id UUID REFERENCES scheduled_messages(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_message_logs_sent_at ON message_logs(sent_at DESC);
    CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
    CREATE INDEX IF NOT EXISTS idx_message_logs_recipient ON message_logs(recipient_identifier);

    -- Enable RLS
    ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

    -- Create policy to allow all operations (service role bypasses RLS)
    DROP POLICY IF EXISTS "Enable all operations for message_logs" ON message_logs;
    CREATE POLICY "Enable all operations for message_logs" ON message_logs
      FOR ALL
      USING (true)
      WITH CHECK (true);
  `;

  // Try to execute via pg_net or edge function
  // Since we can't execute raw SQL directly, we'll need to use the dashboard or migrations
  console.log('Note: To create the message_logs table, run this SQL in Supabase Dashboard:\n');
  console.log(createTableSQL);

  return false;
}

async function createFleetTransitionTemplate() {
  console.log('\nCreating Fleet Transition SMS Template...');

  // First check if it already exists
  const { data: existing } = await supabase
    .from('message_templates')
    .select('*')
    .eq('name', 'Fleet Transition - New Repair Submission Page')
    .single();

  if (existing) {
    console.log('Fleet transition template already exists:', existing);
    return existing;
  }

  const { data, error } = await supabase
    .from('message_templates')
    .insert({
      name: 'Fleet Transition - New Repair Submission Page',
      subject: 'New Repair Request Submission System',
      message_en: `🚗 AGAVE FLEET UPDATE

Hi! We've upgraded our repair request system to serve you better.

📱 NEW: Submit repair requests easily at:
<https://agavefleet.com/repair>

✅ What's New:
• Faster submission process
• Photo upload support
• Real-time status tracking
• Mobile-friendly design

Please use this new link for all future repair requests. The old method will no longer be available.

Thank you for being part of the Agave Fleet team!

Questions? Contact your supervisor.

- Agave Environmental`,
      message_es: `🚗 ACTUALIZACIÓN DE AGAVE FLEET

¡Hola! Hemos mejorado nuestro sistema de solicitudes de reparación para servirle mejor.

📱 NUEVO: Envíe solicitudes de reparación fácilmente en:
<https://agavefleet.com/repair>

✅ Novedades:
• Proceso de envío más rápido
• Soporte para subir fotos
• Seguimiento de estado en tiempo real
• Diseño optimizado para móviles

Por favor use este nuevo enlace para todas las futuras solicitudes de reparación. El método anterior ya no estará disponible.

¡Gracias por ser parte del equipo Agave Fleet!

¿Preguntas? Contacte a su supervisor.

- Agave Environmental`,
      type: 'sms',
      category: 'announcement'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating template:', error);
    return null;
  }

  console.log('Fleet transition template created successfully:', data);
  return data;
}

async function listAllTemplates() {
  console.log('\n=== All Message Templates ===');

  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching templates:', error);
    return;
  }

  data.forEach((template, index) => {
    console.log(`\n--- Template ${index + 1} ---`);
    console.log('Name:', template.name);
    console.log('Type:', template.type);
    console.log('Category:', template.category);
    console.log('Message (EN):', template.message_en?.substring(0, 100) + '...');
  });
}

async function main() {
  await createMessageLogsTable();
  await createFleetTransitionTemplate();
  await listAllTemplates();
}

main();
