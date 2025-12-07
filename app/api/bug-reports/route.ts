import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import sharp from 'sharp'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

// GET - Fetch bug reports for the logged-in user
export async function GET(request: NextRequest) {
  try {
    // Get user from session (you may need to adjust based on your auth implementation)
    const cookieHeader = request.headers.get('cookie')
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // If no user session, return empty array or error based on your preference
      return NextResponse.json({ reports: [] })
    }

    // Fetch bug reports for this user
    const { data: reports, error } = await supabase
      .from('bug_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bug reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bug reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error in GET /api/bug-reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new bug report
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const screenshot = formData.get('screenshot') as File | null

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user details
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single()

    const userName = userData?.name || 'Unknown User'
    const userEmail = userData?.email || user.email || 'unknown@example.com'

    let screenshot_url = null

    // Handle screenshot upload if provided
    if (screenshot && screenshot.size > 0) {
      try {
        // Read the file as buffer
        const arrayBuffer = await screenshot.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Optimize image with sharp
        const optimizedImageBuffer = await sharp(buffer)
          .resize(1920, 1080, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer()

        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(7)
        const filename = `bug-report-${timestamp}-${randomString}.jpg`

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('bug-reports')
          .upload(filename, optimizedImageBuffer, {
            contentType: 'image/jpeg',
            upsert: false
          })

        if (uploadError) {
          console.error('Error uploading screenshot:', uploadError)
        } else {
          // Get public URL
          const { data: urlData } = supabase
            .storage
            .from('bug-reports')
            .getPublicUrl(filename)

          screenshot_url = urlData.publicUrl
        }
      } catch (imageError) {
        console.error('Error processing image:', imageError)
        // Continue without screenshot if there's an error
      }
    }

    // Insert bug report into database
    const { data: bugReport, error: insertError } = await supabase
      .from('bug_reports')
      .insert({
        user_id: user.id,
        user_name: userName,
        user_email: userEmail,
        title,
        description,
        screenshot_url,
        application_source: 'fleet-management',
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting bug report:', insertError)
      return NextResponse.json(
        { error: 'Failed to create bug report' },
        { status: 500 }
      )
    }

    // Send email notification to developer
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
              .badge-pending { background: #fef3c7; color: #92400e; }
              .field { margin-bottom: 20px; }
              .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
              .value { background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; }
              .screenshot { margin-top: 20px; }
              .screenshot img { max-width: 100%; border-radius: 8px; border: 2px solid #e5e7eb; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">🐛 New Bug Report</h2>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">Fleet Management System</p>
              </div>
              <div class="content">
                <div style="margin-bottom: 20px;">
                  <span class="badge badge-pending">PENDING</span>
                </div>

                <div class="field">
                  <div class="label">Title</div>
                  <div class="value"><strong>${title}</strong></div>
                </div>

                <div class="field">
                  <div class="label">Description</div>
                  <div class="value">${description.replace(/\n/g, '<br>')}</div>
                </div>

                <div class="field">
                  <div class="label">Reported By</div>
                  <div class="value">
                    ${userName}<br>
                    <a href="mailto:${userEmail}" style="color: #667eea;">${userEmail}</a>
                  </div>
                </div>

                <div class="field">
                  <div class="label">Report ID</div>
                  <div class="value"><code>${bugReport.id}</code></div>
                </div>

                ${screenshot_url ? `
                  <div class="screenshot">
                    <div class="label">Screenshot</div>
                    <img src="${screenshot_url}" alt="Bug Screenshot" />
                  </div>
                ` : ''}

                <div class="footer">
                  <p>This bug report was submitted on ${new Date().toLocaleString()}</p>
                  <p>Manage this ticket in your <a href="https://bettersystems.ai/admin/tickets" style="color: #667eea;">Developer Dashboard</a></p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `

      await resend.emails.send({
        from: 'AgaveFleet Bug Reports <noreply@agavefleet.com>',
        to: 'developer@bettersystems.ai',
        subject: `🐛 New Bug Report: ${title}`,
        html: emailHtml
      })
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      report: bugReport
    })
  } catch (error) {
    console.error('Error in POST /api/bug-reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
