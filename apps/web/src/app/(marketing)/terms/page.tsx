import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service — DemurrageOS" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 12px" }}>{title}</h2>
      <div style={{ fontSize: 15, color: "rgba(232,232,240,0.6)", lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "72px 24px 96px" }}>
      <p style={{ fontSize: 13, color: "rgba(232,232,240,0.3)", marginBottom: 12 }}>Last updated: September 2024</p>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", margin: "0 0 8px", lineHeight: 1.1 }}>Terms of Service</h1>
      <p style={{ fontSize: 16, color: "rgba(232,232,240,0.45)", margin: "0 0 48px", lineHeight: 1.7 }}>
        By using DemurrageOS, you agree to these terms. Please read them carefully.
      </p>

      <Section title="1. Who We Are">
        <p>DemurrageOS is a container demurrage and detention management platform built for Custom House Agents (CHAs), freight forwarders, and importers operating in India. The platform is developed and maintained by Ansh, Hari, Arya, and Dhyan.</p>
      </Section>

      <Section title="2. Acceptance">
        <p>By creating an account or using the platform, you confirm that you are authorised to act on behalf of your organisation and agree to these Terms. If you do not agree, do not use the platform.</p>
      </Section>

      <Section title="3. Your Data">
        <p>All container data, client data, and operational data you upload to DemurrageOS remains your property. We do not sell, share, or use your business data for any purpose other than providing the service to you. You can delete your account and all associated data at any time by contacting us.</p>
      </Section>

      <Section title="4. Accuracy of Calculations">
        <p>DemurrageOS provides demurrage and detention calculations for informational and operational planning purposes. While we strive for accuracy, calculations are based on the tariff data you configure and the events recorded in the system. <strong style={{ color: "rgba(232,232,240,0.8)" }}>DemurrageOS is not liable for financial losses arising from incorrect calculations or data entry errors.</strong> Always verify critical financial amounts with your carrier or port before making payments.</p>
      </Section>

      <Section title="5. Demo Mode">
        <p>The platform includes a demo mode with synthetic container and client data. Demo data is not connected to any real shipping line, port, or CFS operator. It is provided solely to illustrate platform capabilities.</p>
      </Section>

      <Section title="6. Acceptable Use">
        <p>You agree not to: attempt to reverse-engineer the platform; use it to store or transmit unlawful content; share credentials with unauthorised parties; or use automated tools to scrape data without written permission.</p>
      </Section>

      <Section title="7. Service Availability">
        <p>We aim for high availability but do not guarantee uninterrupted service. We are not responsible for losses caused by downtime, data loss, or system errors during the current beta phase.</p>
      </Section>

      <Section title="8. Changes to Terms">
        <p>We may update these terms. We will notify registered users by email at least 7 days before material changes take effect. Continued use after that date constitutes acceptance.</p>
      </Section>

      <Section title="9. Contact">
        <p>Questions about these terms? Reach us at <a href="mailto:hello@demurrageos.app" style={{ color: "#f59e0b", textDecoration: "none" }}>hello@demurrageos.app</a></p>
      </Section>
    </div>
  );
}
