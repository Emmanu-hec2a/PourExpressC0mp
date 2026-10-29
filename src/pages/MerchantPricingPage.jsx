import { ArrowUpRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { site } from '../config/site.js';
import { plans } from '../content/pricing.js';
import { ContactLink, PageIntro } from '../components/ui/Elements.jsx';

export default function MerchantPricingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Merchant plans & pricing"
        title={
          <>
            A plan for your
            <br />
            next chapter.
          </>
        }
      >
        Monthly pricing and commission rates, clearly laid out. Choose your next step through the
        existing merchant dashboard.
      </PageIntro>
      <section className="section pricing-section">
        <div className="container">
          <div className="pricing-grid">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={'pricing-card' + (plan.featured ? ' pricing-card--featured' : '')}
              >
                {plan.featured && <span className="plan-label">Lower commission</span>}
                <h2>{plan.name}</h2>
                <p>{plan.description}</p>
                <div className="plan-price">
                  {plan.monthly !== null ? (
                    <>
                      <span>KES</span>
                      <strong>{plan.monthly}</strong>
                      <small>/ month</small>
                    </>
                  ) : (
                    <strong>Let’s talk</strong>
                  )}
                </div>
                <div className="plan-commission">
                  <Check size={17} aria-hidden="true" />
                  <span>
                    <strong>{plan.commission}</strong>{' '}
                    {plan.monthly !== null ? 'commission rate' : 'commission'}
                  </span>
                </div>
                <a
                  className={'button button--' + (plan.featured ? 'light' : 'outline')}
                  href={
                    plan.monthly === null
                      ? 'mailto:' + site.supportEmail + '?subject=Enterprise%20merchant%20enquiry'
                      : site.merchantUrl
                  }
                >
                  {plan.action}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
                <span className="plan-action-note">
                  {plan.monthly !== null ? 'Opens the merchant dashboard' : 'Opens your email app'}
                </span>
              </article>
            ))}
          </div>
          <p className="pricing-note">
            Commission is separate from the monthly plan price. Enterprise pricing and commission
            are agreed with the team. Confirm the applicable details before subscribing in the
            merchant dashboard.
          </p>
          <div className="pricing-explainer">
            <div>
              <h2>Monthly plan + commission.</h2>
              <p>
                A paid monthly plan does not remove commission. Free has no monthly plan charge and
                a 10% commission rate. Base is KES 3,000 per month with 8%; Pro is KES 5,000 per
                month with 5%.
              </p>
            </div>
            <div>
              <h3>Questions before you choose?</h3>
              <p>
                Ask our team about your requirements, plan features and applicable conditions. No
                trial, tax treatment or additional entitlement is implied here.
              </p>
              <ContactLink subject="Merchant pricing enquiry">Ask about a plan</ContactLink>
              <Link className="text-link" to="/terms">
                Read the terms <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
