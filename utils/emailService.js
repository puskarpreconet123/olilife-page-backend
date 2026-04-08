const nodemailer = require("nodemailer");
const html_to_pdf = require("html-pdf-node");

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS  // Gmail App Password (not account password)
    }
  });
}

/**
 * Generates a PDF buffer from HTML content
 */
async function generatePdfBuffer(htmlContent) {
  const file = { content: htmlContent };
  const options = { 
    format: "A4", 
    margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    printBackground: true
  };
  return html_to_pdf.generatePdf(file, options);
}

async function sendOtpEmail(to, otp) {
  const transporter = getTransporter();
  const subject = "Your Olilife verification code";
  const text = `Your Olilife verification code is: ${otp}. This code expires in 2 minutes.`;
  
  await transporter.sendMail({
    from: `"Olilife" <${process.env.EMAIL_USER}>`,
    to,
    replyTo: process.env.EMAIL_USER,
    subject,
    text,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f5f5dc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="display:inline-block;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#1b5e20,#4caf50);color:#fff;font-size:1.4rem;line-height:48px;text-align:center;">🌿</span>
          <h2 style="margin:12px 0 4px;color:#1b5e20;">Verify your email</h2>
          <p style="margin:0;color:rgba(62,39,35,0.7);font-size:0.9rem;">Use the code below to complete your Olilife signup.</p>
        </div>
        <div style="text-align:center;background:#fff;border-radius:14px;padding:28px 20px;box-shadow:0 4px 16px rgba(27,94,32,0.1);">
          <p style="margin:0 0 8px;font-size:0.82rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(62,39,35,0.5);">One-time code</p>
          <div style="font-size:2.4rem;font-weight:800;letter-spacing:0.18em;color:#1b5e20;">${otp}</div>
          <p style="margin:14px 0 0;font-size:0.82rem;color:rgba(62,39,35,0.55);">Expires in <strong>2 minutes</strong></p>
        </div>
        <p style="margin:20px 0 0;text-align:center;font-size:0.78rem;color:rgba(62,39,35,0.45);">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  });
}

async function sendPasswordResetEmail(to, otp) {
  const transporter = getTransporter();
  const subject = "Reset your Olilife password";
  const text = `Your code to reset your Olilife password is: ${otp}. This code expires in 10 minutes.`;

  await transporter.sendMail({
    from: `"Olilife" <${process.env.EMAIL_USER}>`,
    to,
    replyTo: process.env.EMAIL_USER,
    subject,
    text,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f5f5dc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="display:inline-block;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#1b5e20,#4caf50);color:#fff;font-size:1.4rem;line-height:48px;text-align:center;">🔐</span>
          <h2 style="margin:12px 0 4px;color:#1b5e20;">Reset your password</h2>
          <p style="margin:0;color:rgba(62,39,35,0.7);font-size:0.9rem;">Use the code below to set a new password for your Olilife account.</p>
        </div>
        <div style="text-align:center;background:#fff;border-radius:14px;padding:28px 20px;box-shadow:0 4px 16px rgba(27,94,32,0.1);">
          <p style="margin:0 0 8px;font-size:0.82rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(62,39,35,0.5);">One-time code</p>
          <div style="font-size:2.4rem;font-weight:800;letter-spacing:0.18em;color:#1b5e20;">${otp}</div>
          <p style="margin:14px 0 0;font-size:0.82rem;color:rgba(62,39,35,0.55);">Expires in <strong>10 minutes</strong></p>
        </div>
        <p style="margin:20px 0 0;text-align:center;font-size:0.78rem;color:rgba(62,39,35,0.45);">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `
  });
}

async function sendDietChartEmail(to, profile, dietPlan) {
  const transporter = getTransporter();

  const titleCase = (s) => (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  let totalCalories = 0;
  dietPlan.meals.forEach(m => m.items.forEach(i => totalCalories += i.calories));

  const profileGoal = titleCase(profile?.goal || "");
  const activityLevel = titleCase(profile?.activityLevel || "");
  const generatedDate = dietPlan.generatedAt ? new Date(dietPlan.generatedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "";

  // Plain Text Version (High delivery factor)
  let emailText = `YOUR PERSONALIZED DIET CHART BY OLILIFE\n\n`;
  emailText += `Goal: ${profileGoal}\n`;
  emailText += `Activity: ${activityLevel}\n`;
  emailText += `Daily Total: ${totalCalories} kcal\n`;
  emailText += `Date: ${generatedDate}\n\n`;

  const mealsHtml = dietPlan.meals.map((meal) => {
    let mealCalories = 0;
    meal.items.forEach(i => {
      mealCalories += i.calories;
      emailText += `${meal.label.toUpperCase()}: ${i.name} (${Math.round(i.protein)}P/${Math.round(i.carbs)}C/${Math.round(i.fats)}F) - ${i.calories} kcal\n`;
    });
    emailText += `Meal Total: ${mealCalories} kcal\n\n`;

    const mealIcon = meal.label.toLowerCase().includes("breakfast") ? "🍳" :
                     meal.label.toLowerCase().includes("lunch") ? "🍱" :
                     meal.label.toLowerCase().includes("dinner") ? "🥗" :
                     meal.label.toLowerCase().includes("snack") ? "🍏" : "🍴";

    const itemsHtml = meal.items.map(item => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;color:#3e2723;font-size:0.88rem;">
          <strong style="display:block;">${item.name}</strong>
          <span style="color:rgba(62,39,35,0.55);font-size:0.78rem;">${item.portionFactor.toFixed(1)}x serving &nbsp;|&nbsp; ${Math.round(item.protein)}g P &nbsp;${Math.round(item.carbs)}g C &nbsp;${Math.round(item.fats)}g F</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;text-align:right;font-weight:700;color:#1b5e20;white-space:nowrap;">${item.calories} kcal</td>
      </tr>
    `).join("");

    return `
      <div style="margin-bottom:20px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid rgba(0,0,0,0.07);box-shadow:0 1px 4px rgba(0,0,0,0.05);">
        <div style="background:linear-gradient(135deg,#1b5e20,#2e7d32);padding:12px 16px;color:#ffffff;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;font-size:1rem;">${mealIcon} ${meal.label}</span>
          <span style="color:rgba(255,255,255,0.85);font-size:0.88rem;font-weight:600;">Target: ${meal.targetCalories} kcal</span>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${itemsHtml}
          <tr style="background:#f9f7f4;">
            <td style="padding:10px 16px;font-weight:700;color:#3e2723;font-size:0.82rem;text-transform:uppercase;letter-spacing:0.04em;">Meal Total</td>
            <td style="padding:10px 16px;text-align:right;font-weight:800;color:#1b5e20;">${mealCalories} kcal</td>
          </tr>
        </table>
      </div>
    `;
  }).join("");

  emailText += `Visit https://olilife.in for more details.`;

  const emailHtml = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f8f5f0;border-radius:16px;overflow:hidden;border:1px solid #e0ddd8;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1b5e20,#2e7d32);padding:32px 24px;text-align:center;">
        <div style="font-size:2rem;margin-bottom:8px;">🌿</div>
        <h1 style="margin:0;color:#fff;font-size:1.6rem;font-weight:800;letter-spacing:-0.01em;">Your Personalized Diet Chart</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.78);font-size:0.9rem;">Built around your unique health profile by Olilife</p>
      </div>

      <!-- Profile Summary -->
      <div style="padding:20px 24px;background:#fff;border-bottom:1px solid #ede8e0;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          ${profileGoal ? `<span style="background:rgba(27,94,32,0.08);color:#1b5e20;padding:5px 12px;border-radius:20px;font-size:0.82rem;font-weight:600;">${profileGoal}</span>` : ""}
          ${activityLevel ? `<span style="background:rgba(27,94,32,0.08);color:#1b5e20;padding:5px 12px;border-radius:20px;font-size:0.82rem;font-weight:600;">${activityLevel}</span>` : ""}
          <span style="background:rgba(27,94,32,0.08);color:#1b5e20;padding:5px 12px;border-radius:20px;font-size:0.82rem;font-weight:600;">Total: ${totalCalories} kcal/day</span>
        </div>
        ${generatedDate ? `<p style="margin:10px 0 0;font-size:0.78rem;color:rgba(62,39,35,0.45);">Generated on ${generatedDate}</p>` : ""}
        <p style="margin:16px 0 0;padding:12px;background:#fdfcf9;border:1px dashed #dcd8cf;border-radius:8px;font-size:0.85rem;color:#3e2723;">
          <strong>Note:</strong> We've attached a PDF version of this chart to this email for your convenience. You can print it or keep it on your phone for quick access!
        </p>
      </div>

      <!-- Meals -->
      <div style="padding:24px;">
        ${mealsHtml}
      </div>

      <!-- Footer -->
      <div style="padding:20px 24px;text-align:center;background:#fff;border-top:1px solid #ede8e0;">
        <p style="margin:0;font-size:0.78rem;color:rgba(62,39,35,0.45);">
          This chart was generated by Olilife. Visit <a href="https://olilife.in" style="color:#1b5e20;text-decoration:none;font-weight:600;">olilife.in</a> to update your plan.
        </p>
      </div>
    </div>
  `;

  // Generate PDF buffer
  const pdfBuffer = await generatePdfBuffer(emailHtml);

  await transporter.sendMail({
    from: `"Olilife" <${process.env.EMAIL_USER}>`,
    to,
    replyTo: process.env.EMAIL_USER,
    subject: "Your Olilife Personalized Diet Chart",
    text: emailText,
    html: emailHtml,
    attachments: [
      {
        filename: "Olilife-Diet-Chart.pdf",
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  });
}

module.exports = { sendOtpEmail, sendPasswordResetEmail, sendDietChartEmail };

