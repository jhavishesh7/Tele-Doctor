import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Appointment, PatientProfile } from './supabase';
import { supabase } from './supabase';
import { StorageBucket } from './storage';

export async function generateAppointmentPDF(
  appointment: Appointment | Record<string, unknown>,
  consultation: Record<string, unknown>
) {
  const appt = appointment as Appointment;

  // 🔹 Create the container
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.padding = '28px';
  container.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
  container.style.background = '#ffffff';
  container.style.color = '#111827';
  container.style.fontFamily = 'Inter, Arial, sans-serif';
  container.style.boxSizing = 'border-box';
  container.style.border = '1px solid #e5e7eb';

  // 🔹 Helper: Convert logo to DataURL for embedding
  const loadImageAsDataUrl = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = () => reject(new Error('Failed to read image as data URL'));
        fr.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('Could not inline logo:', err);
      return url;
    }
  };

  // 🔹 Load logo
  const logoDataUrl = await loadImageAsDataUrl('/asset/logo.png');

  // Ensure patient profile is present; if not, try fetching from the DB using patient_id
  let patientProfile: PatientProfile | undefined = appt.patient_profiles as PatientProfile | undefined;
  if (!patientProfile && appt.patient_id) {
    try {
      // Try by patient_profiles.id first
      let fetched: any = null;
      let fetchErr: any = null;

      ({ data: fetched, error: fetchErr } = await supabase
        .from('patient_profiles')
        .select('*, profiles(*)')
        .eq('id', appt.patient_id)
        .maybeSingle());

      if (fetchErr) {
        console.debug('No patient_profiles row matched id, will try user_id', fetchErr);
      }

      if (!fetched) {
        // fallback: patient_id might be the auth user id stored in user_id
        ({ data: fetched, error: fetchErr } = await supabase
          .from('patient_profiles')
          .select('*, profiles(*)')
          .eq('user_id', appt.patient_id)
          .maybeSingle());
      }

      if (fetchErr) {
        console.warn('Failed to fetch patient profile for PDF:', fetchErr);
      } else if (fetched) {
        patientProfile = fetched as PatientProfile;
      }
    } catch (err) {
      console.warn('Error fetching patient profile for PDF:', err);
    }
  }

  console.log('Generating PDF for appointment:', appt.id, 'patientProfile:', patientProfile);

  // Prepare simple display variables to avoid inline complex expressions in the template
  const doctorName = String(appt.doctor_profiles?.profiles?.full_name ?? '');
  const doctorEmail = String(appt.doctor_profiles?.profiles?.email ?? '');
  const doctorPhone = String(appt.doctor_profiles?.contact_phone ?? '');
  const patientName = String(patientProfile?.profiles?.full_name ?? appt.patient_profiles?.profiles?.full_name ?? '');
  const patientEmail = String(patientProfile?.profiles?.email ?? appt.patient_profiles?.profiles?.email ?? '');
  const patientPhone = String(patientProfile?.phone ?? appt.patient_profiles?.phone ?? '');

  // 🔹 Build inner HTML
  container.innerHTML = `
    <!-- Header -->
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
      <div id="mc-logo-wrapper" style="width:56px;height:56px;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(13,110,116,0.08);">
        <img src="${logoDataUrl}" alt="MeroClinic" style="width:56px;height:56px;object-fit:cover;display:block" />
      </div>
      <div>
        <div style="font-size:22px;font-weight:700;color:#0f172a;">MeroClinic</div>
        <div style="font-size:13px;color:#6b7280;">Your Health, Our Priority</div>
      </div>
    </div>

    <div style="border-top:1px solid #e5e7eb;margin:12px 0;"></div>

    <!-- Appointment Details -->
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;">
      <div>
        <div style="font-size:12px;color:#6b7280;">Appointment ID</div>
        <div style="font-weight:600;">${String(appt.id ?? '')}</div>
      </div>
      <div>
        <div style="font-size:12px;color:#6b7280;">Date</div>
        <div style="font-weight:600;">${new Date(String(appt.requested_date ?? '')).toLocaleString()}</div>
      </div>
      <div>
        <div style="font-size:12px;color:#6b7280;">Status</div>
        <div style="font-weight:600;">${String(appt.status ?? '')}</div>
      </div>
    </div>

    <!-- Doctor & Patient Info -->
    <div style="margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div style="background:#f9fafb;padding:16px;border-radius:8px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:6px;">Doctor Details</div>
  <div><strong>Name:</strong> ${doctorName}</div>
  <div><strong>Email:</strong> ${doctorEmail}</div>
  <div><strong>Phone:</strong> ${doctorPhone}</div>
      </div>

      <div style="background:#f9fafb;padding:16px;border-radius:8px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:6px;">Patient Details</div>
  <div><strong>Name:</strong> ${patientName}</div>
  <div><strong>Email:</strong> ${patientEmail}</div>
  <div><strong>Phone:</strong> ${patientPhone}</div>
      </div>
    </div>

    <!-- Consultation Summary -->
    <div style="margin-top:24px;">
      <div style="font-size:16px;font-weight:700;margin-bottom:10px;">Consultation Summary</div>
      <div style="font-size:13px;line-height:1.6;">
        <div><strong>Symptoms:</strong> ${String(consultation['symptoms'] ?? '—')}</div>
        <div style="margin-top:8px;"><strong>Medicines:</strong> ${String(consultation['medicines'] ?? '—')}</div>
        <div style="margin-top:8px;"><strong>Advice:</strong> ${String(consultation['additional_advice'] ?? '—')}</div>
        <div style="margin-top:8px;"><strong>Follow-up:</strong> ${consultation['follow_up'] ? new Date(String(consultation['follow_up_date'] ?? '')).toLocaleString() : 'No'}</div>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top:28px;text-align:center;border-top:1px solid #e5e7eb;padding-top:12px;font-size:12px;color:#6b7280;">
      Generated on ${new Date().toLocaleString()} — <strong>MeroClinic</strong> | Your Health, Our Priority
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Capture as image
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    // Create PDF
    const pdf = new jsPDF('p', 'pt', 'a4');
    // Embed document metadata
    pdf.setProperties({
      title: `MeroClinic Appointment ${appt.id}`,
      subject: 'Consultation Report',
      author: 'MeroClinic',
      keywords: 'MeroClinic,consultation,appointment,medical,report',
    });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Save PDF to blob
    const pdfBlob = pdf.output('blob');
    const pdfFile = new File([pdfBlob], `appointment_${appt.id}_report.pdf`, { type: 'application/pdf' });
    
    // Download PDF for user
    pdf.save(`appointment_${appt.id}_report.pdf`);
    
    // Return the PDF blob for saving to storage
    return pdfFile;
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generate PDF and save to storage and database
 */
export async function generateAndSaveConsultationSummary(
  appointment: Appointment | Record<string, unknown>,
  consultation: Record<string, unknown>
): Promise<void> {
  try {
    // Generate PDF
    const pdfFile = await generateAppointmentPDF(appointment, consultation);
    const appt = appointment as Appointment;
    
    // Get consultation ID from the consultation record
    const consultationId = consultation['id'] as string;
    if (!consultationId) {
      throw new Error('Consultation ID is required');
    }
    
    // Get patient profile to determine storage path
    let patientProfile: PatientProfile | undefined = appt.patient_profiles as PatientProfile | undefined;
    if (!patientProfile && appt.patient_id) {
      const { data: fetched } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('id', appt.patient_id)
        .maybeSingle();
      
      if (!fetched) {
        const { data: fetchedByUserId } = await supabase
          .from('patient_profiles')
          .select('id')
          .eq('user_id', appt.patient_id)
          .maybeSingle();
        if (fetchedByUserId) {
          patientProfile = { id: fetchedByUserId.id } as PatientProfile;
        }
      } else {
        patientProfile = { id: fetched.id } as PatientProfile;
      }
    }
    
    if (!patientProfile?.id) {
      throw new Error('Patient profile not found');
    }
    
    // Upload PDF to storage
    const fileExt = 'pdf';
    const fileName = `consultation_${consultationId}_${Date.now()}.${fileExt}`;
    const filePath = `consultation_summaries/${patientProfile.id}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('Documents' as StorageBucket)
      .upload(filePath, pdfFile, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('Documents' as StorageBucket)
      .getPublicUrl(uploadData.path);
    
    // Save to consultation_summaries table
    const { error: insertError } = await supabase
      .from('consultation_summaries')
      .insert({
        consultation_id: consultationId,
        appointment_id: appt.id,
        patient_id: patientProfile.id,
        doctor_id: appt.doctor_id,
        pdf_url: publicUrl,
        pdf_path: uploadData.path,
        file_size: pdfFile.size,
      });
    
    if (insertError) {
      console.error('Failed to save consultation summary record:', insertError);
      // Don't throw - PDF was generated and uploaded, just DB record failed
    }
  } catch (err) {
    console.error('Error saving consultation summary:', err);
    // Don't throw - allow the consultation to complete even if PDF save fails
  }
}
