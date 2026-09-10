import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { StudentCertificateDetail } from '../types';
import type { VerifiedCertificateData } from '../services/progressService';

/**
 * Downloads high-resolution official PDF certificate directly to the browser.
 * Renders an exact 1:1 match of CertificatePreviewDocument.tsx (Image 2).
 */
export async function downloadCertificatePdf(
  certData: StudentCertificateDetail | VerifiedCertificateData | any
): Promise<void> {
  if (!certData) {
    throw new Error('Certificate data is missing');
  }

  const studentName = certData.studentName || 'Student';
  const courseTitle = certData.courseTitle || 'Masterclass';
  const courseDescription = certData.courseDescription || '';
  const instructorName = certData.instructorName || 'Lead Instructor';
  const instructorTitle = certData.instructorTitle || 'Lead Instructor & Mentor';
  const certificateCode = certData.certificateCode || certData.serialCode || 'EDU-VERIFIED';
  const formattedDate =
    certData.issueDate ||
    certData.completionDate ||
    new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const safeStudentName = studentName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `EduSphere-Certificate-${safeStudentName}.pdf`;

  // Create an off-screen fixed-dimension container for consistent high-DPI rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '1120px';
  container.style.height = '792px';
  container.style.zIndex = '-9999';
  container.style.backgroundColor = '#FCFBF7';

  container.innerHTML = `
    <div style="
      width: 1120px;
      height: 792px;
      padding: 44px 50px;
      box-sizing: border-box;
      background-color: #FCFBF7;
      border: 12px solid #1E293B;
      position: relative;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #0F172A;
      overflow: hidden;
    ">
      <!-- Outer Inner Gold Borders -->
      <div style="position: absolute; inset: 12px; border: 1px solid rgba(197, 160, 89, 0.6); border-radius: 8px; pointer-events: none;"></div>
      <div style="position: absolute; inset: 16px; border: 2px solid #C5A059; border-radius: 8px; pointer-events: none;"></div>

      <!-- Corner Flourishes -->
      <div style="position: absolute; top: 22px; left: 22px; width: 32px; height: 32px; border-top: 2px solid #C5A059; border-left: 2px solid #C5A059;"></div>
      <div style="position: absolute; top: 22px; right: 22px; width: 32px; height: 32px; border-top: 2px solid #C5A059; border-right: 2px solid #C5A059;"></div>
      <div style="position: absolute; bottom: 22px; left: 22px; width: 32px; height: 32px; border-bottom: 2px solid #C5A059; border-left: 2px solid #C5A059;"></div>
      <div style="position: absolute; bottom: 22px; right: 22px; width: 32px; height: 32px; border-bottom: 2px solid #C5A059; border-right: 2px solid #C5A059;"></div>

      <!-- Watermark Ornate Seal Background (FiAward SVG) -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 0.04;
        pointer-events: none;
        z-index: 0;
      ">
        <svg width="440" height="440" viewBox="0 0 24 24" fill="none" stroke="#1E293B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="7"></circle>
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
      </div>

      <!-- Header Section -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(197, 160, 89, 0.35);
        padding-bottom: 16px;
        position: relative;
        z-index: 10;
      ">
        <div style="display: flex; align-items: center; gap: 14px; text-align: left;">
          <div style="
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background-color: #1E293B;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: 900;
            border: 1.5px solid #C5A059;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          ">ES</div>
          <div>
            <div style="font-size: 19px; font-weight: 800; letter-spacing: 1.5px; color: #0F172A; font-family: Georgia, serif;">EDUSPHERE LMS</div>
            <div style="font-size: 9px; color: #C5A059; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-family: monospace;">Academic Council & Global Credentialing</div>
          </div>
        </div>

        <!-- Official Verified Credential Shield Badge (FiShield SVG) -->
        <div style="
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background-color: rgba(241, 233, 210, 0.7);
          border: 1px solid rgba(197, 160, 89, 0.5);
          border-radius: 12px;
          text-align: left;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C5A059" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <div style="font-family: monospace; line-height: 1.3;">
            <span style="display: block; font-size: 9px; font-weight: 800; color: #8C6D23; letter-spacing: 0.5px;">OFFICIAL VERIFIED CREDENTIAL</span>
            <span style="font-size: 8px; font-weight: 600; color: #475569;">AUTHENTICITY GUARANTEED</span>
          </div>
        </div>
      </div>

      <!-- Certificate Main Content -->
      <div style="padding: 10px 20px; position: relative; z-index: 10;">
        <div>
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 3px; color: #0F172A; text-transform: uppercase; font-family: Georgia, serif;">
            CERTIFICATE OF COMPLETION
          </div>
          <div style="font-size: 11px; color: #64748B; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-top: 6px;">
            THIS IS PROUDLY PRESENTED TO
          </div>
        </div>

        <div style="margin: 16px 0 10px 0;">
          <div style="font-size: 44px; font-weight: 800; color: #1E293B; font-family: Georgia, serif; line-height: 1.1; letter-spacing: -0.5px;">
            ${studentName}
          </div>
          <div style="width: 220px; height: 2px; background: linear-gradient(90deg, transparent, #C5A059, transparent); margin: 8px auto 0 auto;"></div>
        </div>

        <div style="font-size: 13.5px; color: #475569; max-width: 780px; margin: 14px auto 0 auto; line-height: 1.6;">
          for successfully completing all required curriculum modules, laboratory assignments, and passing the comprehensive knowledge verification assessment for the course:
        </div>

        <div style="margin-top: 14px;">
          <div style="font-size: 24px; font-weight: 800; color: #0F172A; font-family: Georgia, serif;">
            "${courseTitle}"
          </div>
          ${
            courseDescription
              ? `<div style="font-size: 11px; color: #64748B; font-style: italic; max-width: 600px; margin: 5px auto 0 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${courseDescription}</div>`
              : ''
          }
        </div>
      </div>

      <!-- Footer Signatures & Official Gold Seal Grid -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        border-top: 1px solid rgba(197, 160, 89, 0.35);
        padding-top: 16px;
        position: relative;
        z-index: 10;
      ">
        <!-- Instructor Signature -->
        <div style="text-align: left; width: 280px;">
          <div style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 18px; color: #0F172A; border-bottom: 1px solid #94A3B8; padding-bottom: 4px; margin-bottom: 4px; font-weight: 500;">
            ${instructorName}
          </div>
          <div style="font-size: 12px; font-weight: 800; color: #0F172A;">${instructorName}</div>
          <div style="font-size: 10px; color: #64748B;">${instructorTitle || 'Lead Instructor & Mentor'}</div>
        </div>

        <!-- Official Gold Seal Emblem (FiAward SVG inside dashed circle) -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
          <div style="
            width: 74px;
            height: 74px;
            border-radius: 50%;
            background: linear-gradient(135deg, #A67C1E, #C5A059, #E5C989);
            padding: 3px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255, 255, 255, 0.4);
          ">
            <div style="
              width: 100%;
              height: 100%;
              border-radius: 50%;
              border: 1px dashed rgba(15, 23, 42, 0.45);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 2px;
              box-sizing: border-box;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 2px;">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
              <span style="font-size: 7px; font-weight: 900; color: #0F172A; text-transform: uppercase; line-height: 1; letter-spacing: -0.2px;">
                EDUSPHERE<br/>VERIFIED
              </span>
            </div>
          </div>
          <div style="font-family: monospace; font-size: 10px; font-weight: 700; color: #475569; letter-spacing: 0.5px;">
            ID: ${certificateCode}
          </div>
        </div>

        <!-- Academic Registrar Signature -->
        <div style="text-align: right; width: 280px;">
          <div style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 18px; color: #0F172A; border-bottom: 1px solid #94A3B8; padding-bottom: 4px; margin-bottom: 4px; font-weight: 500;">
            EduSphere Academic Registrar
          </div>
          <div style="font-size: 12px; font-weight: 800; color: #0F172A;">
            Issued: ${formattedDate}
          </div>
          <div style="font-size: 10px; color: #64748B;">
            EduSphere Academic Board
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FCFBF7',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (error: any) {
    console.error('PDF Generation Failed:', error);
    throw new Error('Unable to download certificate. Please try again.');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
