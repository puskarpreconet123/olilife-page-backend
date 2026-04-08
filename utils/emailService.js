const nodemailer = require("nodemailer");

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS  // Gmail App Password (not account password)
    }
  });
}

async function sendOtpEmail(to, otp) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Olilife" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Olilife verification code",
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
  await transporter.sendMail({
    from: `"Olilife" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your Olilife password",
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

  const mealsHtml = dietPlan.meals.map((meal) => {
    let mealCalories = 0;
    meal.items.forEach(i => mealCalories += i.calories);

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
        <div style="background:linear-gradient(135deg,#1b5e20,#2e7d32);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#fff;font-weight:700;font-size:1rem;">${mealIcon} ${meal.label}</span>
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

  const profileGoal = titleCase(profile?.goal || "");
  const activityLevel = titleCase(profile?.activityLevel || "");
  const generatedDate = dietPlan.generatedAt ? new Date(dietPlan.generatedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "";

  await transporter.sendMail({
    from: `"Olilife" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Olilife Personalized Diet Chart 🌿",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f8f5f0;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1b5e20,#2e7d32);padding:32px 24px;text-align:center;border-radius:16px 16px 0 0;">
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
        </div>

        <!-- Meals -->
        <div style="padding:20px 24px;">
          ${mealsHtml}
        </div>

        <!-- Footer -->
        <div style="padding:20px 24px;text-align:center;background:#fff;border-radius:0 0 16px 16px;border-top:1px solid #ede8e0;">
          <p style="margin:0;font-size:0.78rem;color:rgba(62,39,35,0.45);">This chart was sent by your Olilife admin. Visit <a href="https://olilife.in" style="color:#1b5e20;">olilife.in</a> to update your plan.</p>
        </div>
      </div>
    `
  });
}

module.exports = { sendOtpEmail, sendPasswordResetEmail, sendDietChartEmail };

