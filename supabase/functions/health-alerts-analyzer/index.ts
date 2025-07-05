
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthData {
  user_id: string;
  date: string;
  sleep_hours: number | null;
  stress_level: number | null;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

interface HealthAlert {
  user_id: string;
  alert_type: string;
  alert_message: string;
  triggered_date: string;
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

async function sendHealthAlertEmail(userEmail: string, userName: string, alerts: HealthAlert[]) {
  try {
    console.log(`Sending health alert email to ${userEmail}`);
    
    const alertsHtml = alerts.map(alert => `
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 12px 0; border-radius: 4px;">
        <h3 style="color: #dc2626; margin: 0 0 8px 0;">
          ${alert.alert_type === 'sleep_deficiency' ? '😴 Sleep Alert' : '🧠 Stress Alert'}
        </h3>
        <p style="margin: 0; color: #374151;">${alert.alert_message}</p>
      </div>
    `).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%); color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">AuraX Health Alert</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Your Health Needs Attention</p>
        </div>
        
        <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 16px 0; color: #374151;">Hi ${userName},</p>
          
          <p style="margin: 0 0 20px 0; color: #374151;">
            Our health analysis has identified some patterns in your recent data that may need your attention:
          </p>
          
          ${alertsHtml}
          
          <div style="background-color: #f0f9ff; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h3 style="color: #0ea5e9; margin: 0 0 8px 0;">💡 What you can do:</h3>
            <ul style="margin: 0; color: #374151; padding-left: 20px;">
              <li>Review your recent sleep and activity patterns</li>
              <li>Consider adjusting your daily routine</li>
              <li>Log into AuraX to track your progress</li>
              <li>Consult with a healthcare professional if needed</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://your-app-domain.com" style="background: linear-gradient(135deg, #0ea5e9, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Dashboard
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
            This alert was generated based on your recent health data patterns.<br>
            Take care of yourself! 💙
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "AuraX Health <health@your-domain.com>",
      to: [userEmail],
      subject: `🚨 Health Alert: ${alerts.length} pattern${alerts.length > 1 ? 's' : ''} detected`,
      html: emailHtml,
    });

    console.log(`Email sent successfully to ${userEmail}:`, emailResponse);
    return { success: true, emailResponse };
  } catch (error) {
    console.error(`Failed to send email to ${userEmail}:`, error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting health alerts analysis with email notifications...');

    // Get the date range for analysis (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    console.log(`Analyzing data from ${sevenDaysAgoStr} to ${todayStr}`);

    // Fetch all health data from the last 7 days
    const { data: healthData, error: healthError } = await supabase
      .from('health_data')
      .select('user_id, date, sleep_hours, stress_level')
      .gte('date', sevenDaysAgoStr)
      .lte('date', todayStr)
      .order('user_id')
      .order('date');

    if (healthError) {
      console.error('Error fetching health data:', healthError);
      throw healthError;
    }

    console.log(`Found ${healthData?.length || 0} health records to analyze`);

    // Group data by user
    const userDataMap = new Map<string, HealthData[]>();
    
    healthData?.forEach((record) => {
      const userId = record.user_id;
      if (!userDataMap.has(userId)) {
        userDataMap.set(userId, []);
      }
      userDataMap.get(userId)!.push(record);
    });

    console.log(`Analyzing data for ${userDataMap.size} users`);

    const alertsToInsert = [];
    const userAlertsMap = new Map<string, HealthAlert[]>();

    // Analyze each user's data
    for (const [userId, userHealthData] of userDataMap) {
      console.log(`Analyzing user ${userId} with ${userHealthData.length} records`);
      
      // Sort by date to ensure proper order
      userHealthData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const userAlerts: HealthAlert[] = [];

      // Check for sleep deficiency (less than 5 hours for 3+ consecutive days)
      let consecutiveLowSleepDays = 0;
      let maxConsecutiveLowSleep = 0;

      for (const record of userHealthData) {
        if (record.sleep_hours !== null && record.sleep_hours < 5) {
          consecutiveLowSleepDays++;
          maxConsecutiveLowSleep = Math.max(maxConsecutiveLowSleep, consecutiveLowSleepDays);
        } else {
          consecutiveLowSleepDays = 0;
        }
      }

      if (maxConsecutiveLowSleep >= 3) {
        console.log(`User ${userId} has ${maxConsecutiveLowSleep} consecutive low sleep days`);
        const alert = {
          user_id: userId,
          alert_type: 'sleep_deficiency',
          alert_message: `You've had less than 5 hours of sleep for ${maxConsecutiveLowSleep} days — consider adjusting your sleep cycle.`,
          triggered_date: todayStr
        };
        alertsToInsert.push(alert);
        userAlerts.push(alert);
      }

      // Check for high stress (stress_level > 6 for 4+ days in current week)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

      const thisWeekData = userHealthData.filter(record => 
        record.date >= startOfWeekStr && record.stress_level !== null
      );

      const highStressDays = thisWeekData.filter(record => 
        record.stress_level! > 6
      ).length;

      if (highStressDays >= 4) {
        console.log(`User ${userId} has ${highStressDays} high stress days this week`);
        const alert = {
          user_id: userId,
          alert_type: 'high_stress',
          alert_message: 'Stress levels have been consistently high this week. Try relaxation activities.',
          triggered_date: todayStr
        };
        alertsToInsert.push(alert);
        userAlerts.push(alert);
      }

      // Store user alerts for email sending
      if (userAlerts.length > 0) {
        userAlertsMap.set(userId, userAlerts);
      }
    }

    console.log(`Generated ${alertsToInsert.length} alerts to insert`);

    // Insert alerts (using upsert to avoid duplicates)
    let insertedAlertsCount = 0;
    if (alertsToInsert.length > 0) {
      const { data: insertedAlerts, error: insertError } = await supabase
        .from('health_alerts')
        .upsert(alertsToInsert, {
          onConflict: 'user_id,alert_type,triggered_date',
          ignoreDuplicates: false
        })
        .select();

      if (insertError) {
        console.error('Error inserting alerts:', insertError);
        throw insertError;
      }

      insertedAlertsCount = insertedAlerts?.length || 0;
      console.log(`Successfully inserted/updated ${insertedAlertsCount} alerts`);
    }

    // Send emails for users with new alerts
    let emailsSent = 0;
    let emailsFailed = 0;

    if (userAlertsMap.size > 0) {
      console.log(`Sending emails to ${userAlertsMap.size} users with alerts`);

      // Fetch user profiles for email addresses
      const userIds = Array.from(userAlertsMap.keys());
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profileError) {
        console.error('Error fetching user profiles:', profileError);
      } else {
        console.log(`Found ${profiles?.length || 0} user profiles`);

        // Send emails
        for (const profile of profiles || []) {
          const userAlerts = userAlertsMap.get(profile.id);
          if (userAlerts && profile.email) {
            const emailResult = await sendHealthAlertEmail(
              profile.email,
              profile.full_name || profile.email.split('@')[0],
              userAlerts
            );
            
            if (emailResult.success) {
              emailsSent++;
            } else {
              emailsFailed++;
            }
          }
        }
      }
    }

    const responseMessage = insertedAlertsCount > 0 
      ? `Analyzed ${userDataMap.size} users, generated ${alertsToInsert.length} alerts, sent ${emailsSent} emails`
      : `Analyzed ${userDataMap.size} users - all health patterns look good! No alerts triggered.`;

    console.log(`Health analysis complete: ${responseMessage}`);
    if (emailsFailed > 0) {
      console.log(`Email sending summary: ${emailsSent} sent, ${emailsFailed} failed`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: responseMessage,
        stats: {
          usersAnalyzed: userDataMap.size,
          alertsGenerated: alertsToInsert.length,
          alertsInserted: insertedAlertsCount,
          emailsSent,
          emailsFailed
        }
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in health-alerts-analyzer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500 
      }
    );
  }
});
