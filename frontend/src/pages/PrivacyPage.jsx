import React from "react";
import { Link } from "react-router-dom";
import LegalLayout, { List, Section } from "../components/LegalLayout";
import { LEGAL } from "../lib/legal";

const { appName, contactEmail, minimumAge } = LEGAL;
const mail = <a href={`mailto:${contactEmail}`} className="text-accent-text hover:underline">{contactEmail}</a>;

const PrivacyPage = () => (
  <LegalLayout title="Privacy Policy">
    <Section title="1. Introduction">
      <p>
        This Privacy Policy explains how {appName} ("we", "us", "our") collects, uses, shares and protects
        your information when you use our website and chat service (the "Service"). By using the Service, you
        agree to the practices described here. If you do not agree, please do not use the Service.
      </p>
    </Section>

    <Section title="2. Information we collect">
      <p><strong className="text-fg">Information you give us:</strong></p>
      <List
        items={[
          "Account details: your full name, username, email address and password. Passwords are stored only as a secure one-way hash; we never store or see your plain-text password.",
          "Profile details: your profile picture and bio, if you choose to add them.",
          "Content: messages, photos and other content you send through the Service.",
          "Connections: friend requests you send, receive, accept or decline, and your friends list.",
          "Communications: anything you send us when you contact support.",
        ]}
      />
      <p><strong className="text-fg">Information collected automatically:</strong></p>
      <List
        items={[
          "Activity: when you are online, when you were last seen, and whether messages have been read.",
          "Technical data: IP address, browser type, device information and request logs, used for security, rate limiting and troubleshooting.",
          "Local storage: a login token and your preferences (such as theme) are saved in your browser so you stay signed in. We do not use advertising or third-party tracking cookies.",
        ]}
      />
    </Section>

    <Section title="3. How we use your information">
      <List
        items={[
          "To create and manage your account and let you log in.",
          "To deliver messages and photos to the people you chat with, in real time.",
          "To show your public profile (name, username, picture, bio and last seen) so other users can find you and send friend requests.",
          "To send browser notifications for new messages, if you allow them.",
          "To keep the Service secure, prevent spam and abuse, and enforce our Terms of Service.",
          "To fix problems and improve the Service.",
          "To comply with legal obligations.",
        ]}
      />
      <p>We do not sell your personal information, and we do not use your messages for advertising.</p>
    </Section>

    <Section title="4. Who can see your information">
      <List
        items={[
          "Other users: your name, username, profile picture, bio and last-seen time are visible to other users. Your email address and friends list are not shown to them.",
          "People you chat with: messages and photos you send are visible to the recipient.",
          "Service providers: we use trusted providers to run the Service, including database hosting, image storage and delivery, and web hosting. They process data only on our behalf and under appropriate confidentiality and security obligations.",
          "Legal reasons: we may disclose information if required by law, or if we believe it is necessary to protect the rights, property or safety of our users, the public or us.",
          "Business transfers: if we are involved in a merger, acquisition or sale of assets, your information may be transferred as part of that transaction.",
        ]}
      />
    </Section>

    <Section title="5. Data retention">
      <p>
        We keep your account information and messages for as long as your account is active. You can delete your
        account at any time from Edit profile. When you do, we delete your profile, your conversations (for you
        and the people you chatted with), the photos shared in them, and your friend connections. Copies may
        remain in backups or logs for a limited time before they are removed, and we may keep some information
        where the law requires it.
      </p>
    </Section>

    <Section title="6. Security">
      <p>
        We use reasonable technical and organisational measures to protect your information, including
        encrypted connections (HTTPS), hashed passwords and access controls. However, no method of transmission
        or storage is completely secure, and we cannot guarantee absolute security. Please use a strong, unique
        password and keep it private.
      </p>
    </Section>

    <Section title="7. Your rights and choices">
      <p>Depending on where you live, you may have the right to:</p>
      <List
        items={[
          "Access the personal information we hold about you.",
          "Correct inaccurate information (you can edit your name, username, bio and photo at any time from Edit profile).",
          "Delete your account and personal information (you can do this yourself from Edit profile).",
          "Object to or restrict certain processing, or withdraw consent where processing is based on consent.",
          "Receive a copy of your information in a portable format.",
          "Complain to your local data protection authority.",
        ]}
      />
      <p>To make a request, contact us at {mail}. We may need to verify your identity before acting on it.</p>
    </Section>

    <Section title="8. Children's privacy">
      <p>
        The Service is not intended for children under {minimumAge}. We do not knowingly collect personal
        information from children under {minimumAge}. If you believe a child has given us their information,
        please contact us and we will delete it.
      </p>
    </Section>

    <Section title="9. International transfers">
      <p>
        Your information may be stored and processed in countries other than your own, where our service
        providers operate. Where required, we take steps to make sure your information receives an adequate level
        of protection.
      </p>
    </Section>

    <Section title="10. Changes to this policy">
      <p>
        We may update this Privacy Policy from time to time. When we do, we will change the "Last updated" date
        above, and for significant changes we may also notify you in the app. Continuing to use the Service after
        an update means you accept the revised policy.
      </p>
    </Section>

    <Section title="11. Contact us">
      <p>
        If you have questions about this Privacy Policy or how we handle your information, contact us at {mail}.
        See also our <Link to="/terms" className="text-accent-text hover:underline">Terms of Service</Link>.
      </p>
    </Section>
  </LegalLayout>
);

export default PrivacyPage;
