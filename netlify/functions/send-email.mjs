export default async (req) => {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { name, email, message } = await req.json();

    if (!name || !message) {
        return new Response(JSON.stringify({ error: "Name and message are required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const accountId = process.env.ZOHO_ACCOUNT_ID;
    const toEmail = "hello@pulsesparklabs.com";

    if (!clientId || !clientSecret || !refreshToken || !accountId) {
        return new Response(JSON.stringify({ error: "Server configuration error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        // Get access token using refresh token
        const tokenParams = new URLSearchParams({
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
        });

        const tokenRes = await fetch(
            `https://accounts.zoho.com/oauth/v2/token?${tokenParams.toString()}`,
            { method: "POST" }
        );

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            console.error("Failed to get Zoho access token:", tokenData);
            return new Response(JSON.stringify({ error: "Failed to authenticate with email service" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Send email via Zoho Mail API
        const replyTo = email || undefined;
        const emailContent = `
            <h2>New Message from Contact Form</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email || "Not provided")}</p>
            <hr/>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message)}</p>
        `;

        const emailPayload = {
            fromAddress: toEmail,
            toAddress: toEmail,
            subject: `New Contact Form Message from ${name}`,
            content: emailContent,
            mailFormat: "html",
        };

        if (replyTo) {
            emailPayload.replyTo = replyTo;
        }

        const sendRes = await fetch(
            `https://mail.zoho.com/api/accounts/${accountId}/messages`,
            {
                method: "POST",
                headers: {
                    Authorization: `Zoho-oauthtoken ${tokenData.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(emailPayload),
            }
        );

        const sendData = await sendRes.json();

        if (sendRes.ok && sendData.status && sendData.status.code === 200) {
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        console.error("Zoho Mail API error:", sendData);
        return new Response(JSON.stringify({ error: "Failed to send email" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Send email error:", err);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

function escapeHtml(text) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

export const config = {
    path: "/api/send-email",
};
