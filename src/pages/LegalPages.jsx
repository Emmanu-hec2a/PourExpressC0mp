import { PageIntro } from '../components/ui/Elements.jsx';
import { Link } from 'react-router-dom';

// Existing clauses retained. Fees updated with owner permission on 28 October;
// public brand spelling standardized with owner permission on 29 October 2026.
export function PrivacyPage() {
  return (
    <>
      <PageIntro eyebrow="The important details" title="Privacy policy">
        Last updated: June 2026
      </PageIntro>
      <section className="section">
        <div className="container legal-content prose-content">
          <section>
            <h2>1. Information Collection</h2>
            <p>
              We collect information necessary to provide our logistics and commerce services,
              including merchant data, GPS coordinates for delivery, and transaction history
              verified via M-PESA.
            </p>
          </section>
          <section>
            <h2>2. Usage of Data</h2>
            <p>
              Your data is used to optimize delivery routes, facilitate secure payments, and ensure
              behavioral compliance across the PourXpress ecosystem.
            </p>
          </section>
          <section>
            <h2>3. TipsyTrust™ Security</h2>
            <p>
              All sensitive information is processed through our bank-grade secure infrastructure
              with multi-tenant isolation, ensuring your business data remains private and
              protected.
            </p>
          </section>
          <Link className="text-link" to="/contact">
            Contact PourXpress about privacy
          </Link>
        </div>
      </section>
    </>
  );
}

export function TermsPage() {
  return (
    <>
      <PageIntro eyebrow="The important details" title="Terms of service">
        Commercial wording updated: 28 October 2026. Other existing sections retained.
      </PageIntro>
      <section className="section">
        <div className="container legal-content prose-content">
          <section>
            <h2>1. Service Agreement</h2>
            <p>
              By using PourXpress, you agree to comply with Kenya's liquor retail regulations and
              our behavioral compliance standards.
            </p>
          </section>
          <section>
            <h2>2. Merchant Obligations</h2>
            <p>
              Merchants must maintain valid licensing and adhere to our 3-tier age verification
              system (TipsyTrust™) to ensure legal safety across the platform.
            </p>
          </section>
          <section>
            <h2>3. Fees &amp; Commissions</h2>
            <p>
              The Free plan has no monthly plan charge and a 10% commission rate. Base is KES 3,000
              per month with an 8% commission rate. Pro is KES 5,000 per month with a 5% commission
              rate. Enterprise has custom monthly pricing and a negotiable commission agreed with
              the PourXpress team. Commission applies separately from the monthly plan price.
            </p>
            <p>
              Confirm the applicable plan details and conditions through the existing merchant
              dashboard or with our team before subscribing. Viewing this website does not change an
              existing subscription or initiate a payment.
            </p>
            <Link className="text-link" to="/merchants/pricing">
              View merchant plans and pricing
            </Link>
          </section>
        </div>
      </section>
    </>
  );
}
