import { ArrowRight, Store, PackageCheck, ChartNoAxesCombined, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { site } from '../config/site.js';
import {
  ButtonLink,
  ContactLink,
  Eyebrow,
  PageIntro,
  SectionHeading,
} from '../components/ui/Elements.jsx';
import { FAQList } from '../components/ui/FAQList.jsx';
import { faqs } from '../content/faqs.js';

export default function MerchantsPage() {
  return (
    <>
      <PageIntro
        eyebrow="For local merchants"
        title={
          <>
            Your store.
            <br />A wider neighbourhood.
          </>
        }
        actions={
          <>
            <ButtonLink href={site.merchantUrl}>Open merchant dashboard</ButtonLink>
            <ButtonLink to="/merchants/pricing" variant="outline">
              Explore plans
            </ButtonLink>
          </>
        }
      >
        Connect your store with customers on PourXpress and bring your store operations together.
      </PageIntro>
      <section className="section merchant-overview">
        <div className="container merchant-overview__grid">
          <div className="merchant-art" aria-hidden="true">
            <Store size={108} strokeWidth={1} />
            <span>
              LOCAL STORE.
              <br />
              CONNECTED.
            </span>
            <div className="merchant-art__stamp">PourXpress</div>
          </div>
          <div>
            <Eyebrow>Made for your day-to-day</Eyebrow>
            <h2>
              Keep your focus
              <br />
              on your store.
            </h2>
            <p className="lede">
              A dedicated merchant dashboard gives your business its own place in the PourXpress
              platform.
            </p>
            <div className="merchant-benefits">
              {[
                {
                  icon: PackageCheck,
                  title: 'Products and orders',
                  text: 'Bring product, inventory and order management into your store workflow.',
                },
                {
                  icon: ChartNoAxesCombined,
                  title: 'A view of your business',
                  text: 'Use your merchant dashboard to keep up with store activity and sales information.',
                },
                {
                  icon: UsersRound,
                  title: 'A connected experience',
                  text: 'Be part of a platform connecting customers, merchants and riders.',
                },
              ].map((item) => (
                <div key={item.title}>
                  <item.icon size={22} aria-hidden="true" />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="section section--cream">
        <div className="container">
          <SectionHeading eyebrow="Take the next step" title="Bring your business to PourXpress.">
            Continue through the existing merchant dashboard. Our team can help with joining and
            account questions.
          </SectionHeading>
          <div className="merchant-start-grid">
            <article>
              <span className="step-label">01 / EXPLORE</span>
              <h3>Find the right plan.</h3>
              <p>Compare monthly prices and commissions before choosing your next step.</p>
              <Link className="text-link" to="/merchants/pricing">
                Compare plans <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </article>
            <article>
              <span className="step-label">02 / CONNECT</span>
              <h3>Use the merchant dashboard.</h3>
              <p>
                Visit the existing merchant site to access the available account and onboarding
                options.
              </p>
              <a className="text-link" href={site.merchantUrl}>
                Visit merchant dashboard <ArrowRight size={17} aria-hidden="true" />
              </a>
            </article>
            <article>
              <span className="step-label">03 / ASK</span>
              <h3>Talk to our team.</h3>
              <p>
                Have a question about your business or getting started? Send a merchant enquiry.
              </p>
              <a
                className="text-link"
                href={'mailto:' + site.supportEmail + '?subject=Merchant%20enquiry'}
              >
                Email merchant enquiries <ArrowRight size={17} aria-hidden="true" />
              </a>
            </article>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container faq-grid">
          <div>
            <Eyebrow>Merchant questions</Eyebrow>
            <h2>
              Let’s make
              <br />
              it clear.
            </h2>
          </div>
          <FAQList
            items={faqs
              .filter((item) => item.category === 'Merchants')
              .concat([
                {
                  question: 'Where do I sign in to my merchant account?',
                  answer:
                    'Use the merchant dashboard link on this page. It opens the existing merchant website at merchants.pourexpress.co.ke. Your merchant account is not managed through this public website.',
                },
                {
                  question: 'Does this website change my subscription?',
                  answer:
                    'No. Viewing plans here does not subscribe you, change your plan or take a payment. Continue through the existing merchant dashboard or speak with our team.',
                },
              ])}
          />
        </div>
      </section>
      <section className="section merchant-contact">
        <div className="container">
          <Eyebrow light>A conversation starts here</Eyebrow>
          <h2>Let’s talk about your store.</h2>
          <ContactLink subject="Merchant enquiry" />
        </div>
      </section>
    </>
  );
}
