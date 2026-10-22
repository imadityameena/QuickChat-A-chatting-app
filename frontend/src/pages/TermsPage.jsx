import React from "react";
import { Link } from "react-router-dom";
import LegalLayout, { List, Section } from "../components/LegalLayout";
import { LEGAL } from "../lib/legal";

const { appName, contactEmail, minimumAge } = LEGAL;
const mail = <a href={`mailto:${contactEmail}`} className="text-accent-text hover:underline">{contactEmail}</a>;
const privacyLink = <Link to="/privacy" className="text-accent-text hover:underline">Privacy Policy</Link>;

const TermsPage = () => (
  <LegalLayout title="Terms of Service">
    <Section title="1. Acceptance of terms">
      <p>
        These Terms of Service ("Terms") govern your use of {appName} (the "Service"). By creating an account or
        using the Service, you agree to these Terms and to our {privacyLink}. If you do not agree, do not use the
        Service.
      </p>
    </Section>

    <Section title="2. Eligibility">
      <p>
        You must be at least {minimumAge} years old, or the minimum age required to use online services in your
        country, to use the Service. If you are under the age of majority where you live, you may only use the
        Service with the permission of a parent or legal guardian.
      </p>
    </Section>

    <Section title="3. Your account">
      <List
        items={[
          "You must provide accurate information when you sign up and keep it up to date.",
          "You are responsible for keeping your password secure and for all activity on your account.",
          "You may not impersonate another person, or create an account for anyone other than yourself without permission.",
          "Usernames must not be offensive, misleading or infringe someone else's rights. We may reclaim or change a username that breaks these Terms.",
          "Tell us right away if you think your account has been accessed without your permission.",
        ]}
      />
    </Section>

    <Section title="4. Acceptable use">
      <p>You agree not to use the Service to:</p>
      <List
        items={[
          "Harass, bully, threaten, stalk or intimidate anyone.",
          "Send spam, unsolicited messages or mass friend requests.",
          "Share content that is illegal, hateful, sexually explicit involving minors, violent, or that promotes self-harm.",
          "Share someone else's private information or intimate images without their consent.",
          "Infringe anyone's copyright, trademark, privacy or other rights.",
          "Upload viruses or malicious code, or try to gain unauthorised access to the Service, other accounts or our systems.",
          "Scrape, crawl or collect data from the Service using automated means, or interfere with its normal operation.",
          "Break any applicable law or regulation.",
        ]}
      />
    </Section>

    <Section title="5. Your content">
      <p>
        You keep ownership of the messages, photos and other content you share ("Your Content"). By sharing it,
        you give us a worldwide, non-exclusive, royalty-free licence to store, process, transmit and display Your
        Content only as needed to operate and provide the Service to you and the people you chat with.
      </p>
      <p>
        You are solely responsible for Your Content and confirm that you have the rights needed to share it. We do
        not review messages before they are sent, but we may remove content or take action on accounts that break
        these Terms.
      </p>
    </Section>

    <Section title="6. Friend requests and messaging">
      <p>
        You can only chat with people who have accepted your friend request. Other users may decline your
        requests or remove you as a friend at any time. Please respect people's choices and do not try to contact
        someone who has made clear they do not want to hear from you.
      </p>
    </Section>

    <Section title="7. Suspension and termination">
      <p>
        You may stop using the Service at any time and can delete your account from Edit profile, or by
        contacting {mail}.
        We may suspend or terminate your account, with or without notice, if you break these Terms, if required
        by law, or to protect the Service or other users. Sections that by their nature should survive
        termination (such as ownership, disclaimers and limitation of liability) will continue to apply.
      </p>
    </Section>

    <Section title="8. Our intellectual property">
      <p>
        The Service, including its design, logo, software and features, belongs to {appName} and its licensors and
        is protected by intellectual property laws. These Terms do not give you any right to use our name, logo or
        branding.
      </p>
    </Section>

    <Section title="9. Availability and changes to the Service">
      <p>
        We work to keep the Service running smoothly, but we do not promise it will always be available, error
        free or secure. We may change, suspend or discontinue any part of the Service at any time. Messages and
        photos may occasionally be lost, so please keep your own copies of anything important.
      </p>
    </Section>

    <Section title="10. Disclaimer of warranties">
      <p>
        The Service is provided "as is" and "as available", without warranties of any kind, whether express or
        implied, including warranties of merchantability, fitness for a particular purpose and non-infringement,
        to the fullest extent permitted by law. We are not responsible for the conduct of any user or for content
        shared by users.
      </p>
    </Section>

    <Section title="11. Limitation of liability">
      <p>
        To the fullest extent permitted by law, {appName} and its team will not be liable for any indirect,
        incidental, special, consequential or punitive damages, or any loss of data, profits or goodwill, arising
        from your use of, or inability to use, the Service. Our total liability for any claim relating to the
        Service will not exceed the greater of the amount you paid us in the past twelve months or USD 50.
      </p>
    </Section>

    <Section title="12. Indemnity">
      <p>
        You agree to defend and hold harmless {appName} and its team from any claims, damages or expenses
        (including reasonable legal fees) arising from Your Content, your use of the Service, or your breach of
        these Terms.
      </p>
    </Section>

    <Section title="13. Changes to these Terms">
      <p>
        We may update these Terms from time to time. When we do, we will change the "Last updated" date above,
        and for significant changes we may also notify you in the app. Continuing to use the Service after an
        update means you accept the revised Terms.
      </p>
    </Section>

    <Section title="14. Governing law">
      <p>
        These Terms are governed by the laws of the country in which {appName} is operated, without regard to its
        conflict of law rules. Any disputes will be handled by the courts of that jurisdiction, unless the law
        where you live gives you the right to bring a claim locally.
      </p>
    </Section>

    <Section title="15. Contact us">
      <p>If you have questions about these Terms, contact us at {mail}.</p>
    </Section>
  </LegalLayout>
);

export default TermsPage;
