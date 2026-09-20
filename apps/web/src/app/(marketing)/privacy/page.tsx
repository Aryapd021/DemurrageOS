import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — DemurrageOS" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 12px" }}>{title}</h2>
      <div style={{ fontSize: 15, color: "rgba(232,232,240,0.6)", lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "72px 24px 96px" }}>
      <p style={{ fontSize: 13, color: "rgba(232,232,240,0.3)", marginBottom: 12 }}>Last updated: September 2024</p>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", margin: "0 0 8px", lineHeight: 1.1 }}>Privacy Policy</h1>
      <p style={{ fontSize: 16, color: "rgba(232,232,240,0.45)", margin: "0 0 48px", lineHeight: 1.7 }}>
        Your privacy matters. Here's exactly what we collect, why, and what we never do with it.
      </p>

      <Section title="1. What We Collect">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li><strong style={{ color: "rgba(232,232,240,0.8)" }}>Account data:</strong> Your name, work email, and organisation name when you register.</li>
          <li><strong style={{ color: "rgba(232,232,240,0.8)" }}>Operational data:</strong> Container records, event timelines, client names, tariff configurations, and documents you upload.</li>
          <li><strong style={{ color: "rgba(232,232,240,0.8)" }}>Usage data:</strong> Pages visited, features used, and error logs — for debugging and improving the product.</li>
          <li><strong style={{ color: "rgba(232,232,240,0.8)" }}>Session data:</strong> A secure HTTP-only cookie that keeps you logged in.</li>
        </ul>
      </Section>

      <Section title="2. What We Never Do">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>We do <strong style={{ color: "#ef4444" }}>not</strong> sell your data to any third party.</li>
          <li>We do <strong style={{ color: "#ef4444" }}>not</strong> use your container or client data to train AI models without your explicit consent.</li>
          <li>We do <strong style={{ color: "#ef4444" }}>not</strong> share your data with shipping lines, ports, or freight brokers.</li>
          <li>We do <strong style={{ color: "#ef4444" }}>not</strong> store plain-text passwords. All passwords are hashed using bcrypt.</li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Data">
        <p>Your data is used solely to: provide the DemurrageOS service; send you operational alerts and task notifications you configure; send account and security emails (verification, password reset); and improve the platform based on anonymised usage patterns.</p>
      </Section>

      <Section title="4. Data Storage & Security">
        <p>All data is stored in a PostgreSQL database hosted on a secure cloud provider. Data in transit is encrypted using TLS 1.2+. Session tokens are stored as HTTP-only cookies and are never accessible to JavaScript. We apply role-based access control — your organisation's data is completely isolated from other organisations.</p>
      </Section>

      <Section title="5. Cookies">
        <p>We use one first-party HTTP-only session cookie to maintain your login state. We do not use advertising cookies or third-party tracking pixels. Usage analytics (if any) are anonymised and aggregated.</p>
      </Section>

      <Section title="6. Data Retention & Deletion">
        <p>Your data is retained for as long as your account is active. To delete your account and all associated data, email us at <a href="mailto:hello@demurrageos.app" style={{ color: "#f59e0b", textDecoration: "none" }}>hello@demurrageos.app</a>. Deletion is completed within 30 days. Certain audit logs may be retained for up to 90 days per legal requirements.</p>
      </Section>

      <Section title="7. Third-Party Services">
        <p>We may use the following third-party services: an email delivery provider (e.g. Resend or SendGrid) for transactional emails; error monitoring (Sentry) for crash reporting — only anonymised stack traces are sent. No business data is transmitted to these services.</p>
      </Section>

      <Section title="8. Contact">
        <p>For any privacy questions or data requests, contact us at <a href="mailto:hello@demurrageos.app" style={{ color: "#f59e0b", textDecoration: "none" }}>hello@demurrageos.app</a></p>
      </Section>
    </div>
  );
}
