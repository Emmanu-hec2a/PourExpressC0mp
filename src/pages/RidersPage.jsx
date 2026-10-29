import { ArrowRight, Navigation, Smartphone, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AppDownloadBlock,
  ContactLink,
  Eyebrow,
  Screenshot,
  SectionHeading,
} from '../components/ui/Elements.jsx';

export default function RidersPage() {
  return (
    <>
      <section className="section rider-hero">
        <div className="container split-grid">
          <div>
            <Eyebrow>For the people who connect us</Eyebrow>
            <h1>
              Every delivery.
              <br />
              <span>A local connection.</span>
            </h1>
            <p className="lede">
              Explore the rider side of PourXpress. Keep delivery activity together in the app and
              speak with our team about getting started.
            </p>
            <AppDownloadBlock />
            <p className="small-note">
              Customers and riders use the same Google Play listing. Contact the team for rider
              access and onboarding details.
            </p>
          </div>
          <div className="rider-hero__visual">
            <Screenshot
              kind="rider"
              eager
              caption="Actual app preview with route and transaction details redacted."
            />
          </div>
        </div>
      </section>
      <section className="section section--cream">
        <div className="container">
          <SectionHeading
            eyebrow="Get to know the rider experience"
            title="Your deliveries, brought together."
          >
            The screenshot shows the rider interface. It does not represent a live route, an
            available job, or a promise of earnings.
          </SectionHeading>
          <div className="steps">
            {[
              {
                icon: Smartphone,
                title: 'Get the app',
                text: 'Open the published Google Play listing. The Android app is the same download used by customers and riders.',
              },
              {
                icon: Navigation,
                title: 'Explore rider tools',
                text: 'The rider interface brings active delivery and navigation information into the app.',
              },
              {
                icon: MessageCircle,
                title: 'Ask about getting started',
                text: 'Speak with our team about rider access, requirements and the existing onboarding process.',
              },
            ].map((step, i) => (
              <article className="step" key={step.title}>
                <div className="step__top">
                  <step.icon size={28} strokeWidth={1.5} aria-hidden="true" />
                  <span>0{i + 1}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container rider-contact">
          <div>
            <Eyebrow>Your next step</Eyebrow>
            <h2>
              Let’s talk
              <br />
              about riding.
            </h2>
            <p className="lede">
              Our team can explain the current requirements and how to get started. Downloading the
              app does not guarantee approval, work or earnings.
            </p>
            <ContactLink subject="Rider enquiry">Email rider enquiries</ContactLink>
          </div>
          <aside>
            <h3>Already have a rider account?</h3>
            <p>
              Continue using the existing app and your account. For account or delivery issues, use
              the app’s support options or contact our team.
            </p>
            <Link className="text-link" to="/contact">
              View contact options <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <p className="small-note">
              Never share your password, verification code or payment PIN.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
