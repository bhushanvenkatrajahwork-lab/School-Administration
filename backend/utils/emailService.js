const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Helper to generate a styled PDF receipt and resolve when file is fully written.
 */
function generateReceiptPDF(payment, student, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // --- COLOR PALETTE & DESIGN SYSTEM ---
      const primaryColor = '#0B192C'; // Deep navy
      const secondaryColor = '#1E3E62'; // Slate blue
      const accentColor = '#10B981'; // Emerald green
      const darkText = '#1E293B'; // Dark charcoal text
      const lightText = '#64748B'; // Slate gray text
      const dividerColor = '#E2E8F0'; // Very light border line

      // --- TITLE HEADER ---
      doc.fillColor(primaryColor).fontSize(24).font('Helvetica-Bold').text('EduClearance Academy', { align: 'center' });
      doc.fillColor(lightText).fontSize(10).font('Helvetica').text('Clearance Office • Official Receipt & Confirmation', { align: 'center' });
      doc.moveDown(1.5);

      // Top divider line
      doc.strokeColor(dividerColor).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1.5);

      // --- GREETING AND WARM CARD ---
      // Draw background rectangle for thank you note
      const cardY = doc.y;
      doc.rect(50, cardY, 495, 120).fill('#F8FAFC');
      doc.rect(50, cardY, 4, 120).fill(secondaryColor); // Nice left accent bar

      // Cheering content
      doc.fillColor(secondaryColor).fontSize(11).font('Helvetica-Bold').text('Warm Appreciation & Congratulations!', 70, cardY + 15);
      
      const greetingText = `Dear Parent,

We are absolutely thrilled and cheered to inform you that your payment for student ${student.name} has been successfully recorded! Every step of this clearance journey represents a milestone of support towards your child's education, and we want to shower you with our warmest appreciation. Thank you for being such an amazing and dedicated partner in their learning adventure! We cheer for your student's future success!`;

      doc.fillColor(darkText).fontSize(8.5).font('Helvetica').text(greetingText, 70, cardY + 35, { width: 455, lineGap: 3 });
      
      doc.y = cardY + 135; // Reset y coordinate below the card
      doc.moveDown(1);

      // --- DETAILS GRID (Two-column layout) ---
      const gridY = doc.y;
      
      // Column 1: Student details
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Student Information', 50, gridY);
      doc.fillColor(darkText).fontSize(9.5).font('Helvetica')
         .text(`Student ID:`, 50, gridY + 20).font('Helvetica-Bold').text(student.studentId, 130, gridY + 20)
         .font('Helvetica').text(`Admission No:`, 50, gridY + 35).font('Helvetica-Bold').text(student.admissionNumber, 130, gridY + 35)
         .font('Helvetica').text(`Full Name:`, 50, gridY + 50).font('Helvetica-Bold').text(student.name, 130, gridY + 50)
         .font('Helvetica').text(`Class & Section:`, 50, gridY + 65).font('Helvetica-Bold').text(`${student.class} - ${student.section}`, 130, gridY + 65);

      // Column 2: Payment details
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Payment Information', 300, gridY);
      doc.fillColor(darkText).fontSize(9.5).font('Helvetica')
         .text(`Receipt Number:`, 300, gridY + 20).font('Helvetica-Bold').text(payment.receiptNumber, 400, gridY + 20)
         .font('Helvetica').text(`Date Collected:`, 300, gridY + 35).font('Helvetica-Bold').text(new Date(payment.paymentDate).toLocaleDateString(), 400, gridY + 35)
         .font('Helvetica').text(`Method:`, 300, gridY + 50).font('Helvetica-Bold').text(payment.paymentMethod, 400, gridY + 50)
         .font('Helvetica').text(`Reference Ref:`, 300, gridY + 65).font('Helvetica-Bold').text(payment.transactionRef || 'N/A', 400, gridY + 65);

      doc.y = gridY + 95;
      doc.moveDown(1);

      // Middle divider
      doc.strokeColor(dividerColor).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1.5);

      // --- TRANSACTION TABLE ---
      const tableStartY = doc.y;
      
      // Headers
      doc.fillColor(secondaryColor).fontSize(9.5).font('Helvetica-Bold')
         .text('Payment Category', 60, tableStartY)
         .text('Description', 210, tableStartY)
         .text('Amount Paid', 450, tableStartY, { align: 'right' });

      doc.moveDown(1);
      doc.strokeColor(dividerColor).lineWidth(0.8).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1.2);

      // Rows
      const rowY = doc.y;
      const description = `Department Clearance Payment — ${payment.feeType} Desk`;
      doc.fillColor(darkText).fontSize(9).font('Helvetica')
         .text(`${payment.feeType} Fees`, 60, rowY)
         .text(description, 210, rowY)
         .text(`₹${payment.amount.toLocaleString('en-IN')}`, 450, rowY, { align: 'right' });

      doc.moveDown(2);
      doc.strokeColor(dividerColor).lineWidth(0.8).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1.5);

      // Total block
      const totalY = doc.y;
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
         .text('Total Clearance Amount Received:', 210, totalY)
         .fillColor(accentColor).text(`₹${payment.amount.toLocaleString('en-IN')}`, 450, totalY, { align: 'right' });

      doc.moveDown(4.5);

      // --- FOOTER SIGNATURE ---
      doc.strokeColor(dividerColor).lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1.2);
      doc.fillColor(lightText).fontSize(8).font('Helvetica-Oblique').text('This is a system-generated official payment receipt. If you have any inquiries, please contact accounts@educlearance.edu.', { align: 'center', lineGap: 2 });

      doc.end();

      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Transporter setup helper.
 */
async function getTransporter() {
  const user = process.env.EMAIL_USER || 'bhushanvenkatrajah.work@gmail.com';
  const pass = process.env.EMAIL_PASS;

  if (pass && pass !== 'YOUR_GMAIL_APP_PASSWORD_HERE') {
    // Real Gmail SMTP configuration
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass
      }
    });
  } else {
    // Mock SMTP configuration for local dev preview
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
}

/**
 * Main module function to generate PDF and mail immediately.
 */
async function sendReceiptEmail(payment, student) {
  const receiptNumber = payment.receiptNumber;
  const tempDir = path.join(__dirname, '..', 'temp');
  
  // Ensure temp folder inside workspace exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filePath = path.join(tempDir, `receipt_${receiptNumber}.pdf`);
  const senderEmail = process.env.EMAIL_USER || 'bhushanvenkatrajah.work@gmail.com';
  
  // Recipients: parent email from student record AND testing override (bhushanvenkatrajah.work@gmail.com)
  const recipients = [student.email, 'bhushanvenkatrajah.work@gmail.com'].filter(Boolean);

  try {
    // 1. Generate PDF
    await generateReceiptPDF(payment, student, filePath);

    // 2. Transporter setup
    const transporter = await getTransporter();

    // 3. Compose Email
    const mailOptions = {
      from: `"EduClearance Academy" <${senderEmail}>`,
      to: recipients,
      subject: `Official Payment Receipt - ${receiptNumber}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #0b192c; font-size: 24px; margin: 0; font-weight: 800; tracking-tight: -0.025em;">EduClearance Academy</h1>
            <p style="color: #64748b; font-size: 11px; margin: 5px 0 0 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Clearance Office Receipts</p>
          </div>
          
          <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #1e3e62;">
            <h3 style="color: #1e3e62; font-size: 14px; margin: 0 0 10px 0; font-weight: 700;">Dear Parent,</h3>
            <p style="color: #334155; font-size: 13px; line-height: 1.6; margin: 0;">
              We are absolutely thrilled and cheered to inform you that your payment for student <strong>${student.name}</strong> has been successfully recorded! 
            </p>
            <p style="color: #334155; font-size: 13px; line-height: 1.6; margin: 10px 0 0 0;">
              Every step of this clearance journey represents a milestone of support towards your child's education, and we want to shower you with our warmest and most cheering appreciation. Thank you for being such an amazing and dedicated partner in their learning adventure! We cheer for your student's future success!
            </p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Receipt Number:</td>
              <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700;">${receiptNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Student Name (ID):</td>
              <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700;">${student.name} (${student.studentId})</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Clearance Desk:</td>
              <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700;">${payment.feeType} Department</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Clearance Amount:</td>
              <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: 800; font-size: 14px;">₹${payment.amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Payment Method:</td>
              <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 600;">${payment.paymentMethod}</td>
            </tr>
          </table>
          
          <div style="text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 20px; color: #94a3b8; font-size: 11px;">
            <p style="margin: 0 0 5px 0;">We have attached the official PDF receipt to this email for your records.</p>
            <p style="margin: 0;">&copy; 2026 EduClearance Academy. All rights reserved.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `receipt_${receiptNumber}.pdf`,
          path: filePath
        }
      ]
    };

    // 4. Send Email
    const info = await transporter.sendMail(mailOptions);
    console.log(`[INFO] Receipt email sent successfully for ${receiptNumber}`);

    // If mock email fallback, log preview link
    const pass = process.env.EMAIL_PASS;
    if (!pass || pass === 'YOUR_GMAIL_APP_PASSWORD_HERE') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('\n------------------------------------------------------------');
      console.log(`[MOCK EMAIL PREVIEW] A mock receipt email has been sent.`);
      console.log(`Click this URL to view the receipt and attached PDF in your browser:`);
      console.log(`\x1b[36m${previewUrl}\x1b[0m`);
      console.log('------------------------------------------------------------\n');
    }
  } catch (err) {
    console.error(`[ERROR] Failed to send receipt email for ${receiptNumber}:`, err);
  } finally {
    // 5. Clean up temporary PDF file asynchronously
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== 'ENOENT') {
        console.error(`[ERROR] Failed to delete temp PDF file ${filePath}:`, unlinkErr);
      }
    });
  }
}

module.exports = {
  sendReceiptEmail
};
