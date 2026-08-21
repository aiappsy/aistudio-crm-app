import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-8 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
        
        <h1 className="text-4xl font-bold mb-8 tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: April 14, 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="leading-relaxed">
              Aiappsy CRM ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium mb-2">Personal Data</h3>
            <p className="mb-4">
              We collect information that you provide directly to us, such as when you create an account, including your name, email address, and billing information.
            </p>
            <h3 className="text-xl font-medium mb-2">Usage Data</h3>
            <p>
              We automatically collect certain information when you visit our platform, including your IP address, browser type, operating system, and information about your interactions with the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide, maintain, and improve our services.</li>
              <li>To process transactions and send related information.</li>
              <li>To send technical notices, updates, and security alerts.</li>
              <li>To respond to your comments and questions.</li>
              <li>To monitor and analyze trends, usage, and activities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to maintain the safety of your personal information. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Your Privacy Rights (GDPR)</h2>
            <p className="mb-4">
              If you are a resident of the European Economic Area (EEA), you have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Access:</strong> The right to request copies of your personal data. You can export your data anytime from the Settings page.</li>
              <li><strong>Rectification:</strong> The right to request that we correct any information you believe is inaccurate.</li>
              <li><strong>Erasure / RTBF (Right to be Forgotten):</strong> The right to request that we erase your personal data under certain conditions. You can permanently delete your account and all associated data from the Settings &gt; Profile page.</li>
              <li><strong>Restrict Processing:</strong> The right to request that we restrict the processing of your personal data.</li>
              <li><strong>Data Portability:</strong> The right to request that we transfer the data that we have collected to another organization, or directly to you.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at <a href="https://wa.me/4740059493" className="text-primary hover:underline">+47 40059493 (WhatsApp)</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
