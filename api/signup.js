// TEMP: testing with one recipient only - restore the full list below before real use
const RECIPIENTS = [
  "1005588@rochesterschools.org"
  // "9487701@rochesterschools.org",
  // "9487601@rochesterschools.org",
  // "9495101@rochesterschools.org",
  // "9421601@rochesterschools.org",
  // "9465501@rochesterschools.org"
];

const CLASSROOM_LINK = "https://classroom.google.com/c/ODcyNjUzNDMzODA2?cjc=7yhxbhob";
const CLASSROOM_CODE = "7yhxbhob";

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

async function sendEmail(payload) {
  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!resendRes.ok) {
    const errBody = await resendRes.text();
    throw new Error("Resend error " + resendRes.status + ": " + errBody);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { name, grade, studentId, message, company } = req.body || {};

  // honeypot: bots fill hidden fields, real users never see them
  if (company) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!name || !grade || !studentId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    res.status(500).json({ error: "Server not configured" });
    return;
  }

  const studentEmail = studentId.replace(/\s+/g, "") + "@rochesterschools.org";
  const firstName = name.trim().split(/\s+/)[0];

  // 1) notify the officer team - this one has to succeed for the request to count as OK
  const officerText =
    "New Mayo ASA sign-up\n\n" +
    "Name: " + name + "\n" +
    "Grade: " + grade + "\n" +
    "Student ID: " + studentId + " (" + studentEmail + ")\n\n" +
    "Message:\n" + (message || "(none)");

  const officerHtml =
    "<h2>New Mayo ASA sign-up</h2>" +
    "<p><strong>Name:</strong> " + escapeHtml(name) + "<br>" +
    "<strong>Grade:</strong> " + escapeHtml(grade) + "<br>" +
    "<strong>Student ID:</strong> " + escapeHtml(studentId) + " (" + escapeHtml(studentEmail) + ")</p>" +
    "<p><strong>Message:</strong><br>" + escapeHtml(message || "(none)").replace(/\n/g, "<br>") + "</p>";

  try {
    await sendEmail({
      from: "Mayo ASA Sign-Ups <signups@mayoasa.com>",
      to: RECIPIENTS,
      reply_to: studentEmail,
      subject: "New Mayo ASA sign-up: " + name,
      text: officerText,
      html: officerHtml
    });
  } catch (err) {
    console.error("Officer notification failed:", err);
    res.status(502).json({ error: "Failed to send" });
    return;
  }

  // 2) welcome the student and drop them the Classroom link - best-effort,
  // doesn't fail the request if it doesn't go through
  try {
    await sendEmail({
      from: "Mayo ASA <hello@mayoasa.com>",
      to: [studentEmail],
      subject: "Welcome to Mayo ASA!",
      text:
        "Hey " + firstName + ",\n\n" +
        "Thanks for signing up for Mayo ASA! Here's our Google Classroom, join it so you don't miss anything:\n" +
        CLASSROOM_LINK + "\n" +
        "(or use class code " + CLASSROOM_CODE + " if the link doesn't work)\n\n" +
        "We meet Fridays, 4:30-5:30 PM in Room 2131. Come by whenever!\n\n" +
        "See you soon,\nMayo ASA",
      html:
        "<p>Hey " + escapeHtml(firstName) + ",</p>" +
        "<p>Thanks for signing up for Mayo ASA! Here's our Google Classroom, join it so you don't miss anything:<br>" +
        "<a href=\"" + escapeHtml(CLASSROOM_LINK) + "\">" + escapeHtml(CLASSROOM_LINK) + "</a><br>" +
        "(or use class code <strong>" + escapeHtml(CLASSROOM_CODE) + "</strong> if the link doesn't work)</p>" +
        "<p>We meet Fridays, 4:30&ndash;5:30 PM in Room 2131. Come by whenever, no commitment needed.</p>" +
        "<p>See you soon,<br>Mayo ASA</p>"
    });
  } catch (err) {
    console.error("Student welcome email failed (non-fatal):", err);
  }

  res.status(200).json({ ok: true });
};
