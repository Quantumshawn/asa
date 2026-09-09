const RECIPIENTS = [
  "1005588@rochesterschools.org",
  "9487701@rochesterschools.org",
  "9487601@rochesterschools.org",
  "9495101@rochesterschools.org",
  "9421601@rochesterschools.org",
  "9465501@rochesterschools.org"
];

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { name, grade, email, message, company } = req.body || {};

  // honeypot: bots fill hidden fields, real users never see them
  if (company) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!name || !grade || !email) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    res.status(500).json({ error: "Server not configured" });
    return;
  }

  const text =
    "New Mayo ASA sign-up\n\n" +
    "Name: " + name + "\n" +
    "Grade: " + grade + "\n" +
    "Email: " + email + "\n\n" +
    "Message:\n" + (message || "(none)");

  const html =
    "<h2>New Mayo ASA sign-up</h2>" +
    "<p><strong>Name:</strong> " + escapeHtml(name) + "<br>" +
    "<strong>Grade:</strong> " + escapeHtml(grade) + "<br>" +
    "<strong>Email:</strong> " + escapeHtml(email) + "</p>" +
    "<p><strong>Message:</strong><br>" + escapeHtml(message || "(none)").replace(/\n/g, "<br>") + "</p>";

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Mayo ASA Sign-Ups <onboarding@resend.dev>",
        to: RECIPIENTS,
        reply_to: email,
        subject: "New Mayo ASA sign-up: " + name,
        text: text,
        html: html
      })
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("Resend error:", resendRes.status, errBody);
      res.status(502).json({ error: "Failed to send" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Signup handler error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
