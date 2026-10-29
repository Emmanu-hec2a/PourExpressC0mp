import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  MapPin,
  ShoppingBag,
  Wallet,
  Route,
  Store,
  Bike,
  ShieldCheck,
} from 'lucide-react';
import {
  AppDownloadBlock,
  ButtonLink,
  DownloadSection,
  Eyebrow,
  Screenshot,
  SectionHeading,
} from '../components/ui/Elements.jsx';
import { FAQList } from '../components/ui/FAQList.jsx';
import { faqs } from '../content/faqs.js';

export default function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <Eyebrow>Local favourites. Now on Android.</Eyebrow>
            <h1>
              Your favourite
              <br />
              {' '}
              drinks.
              <br />
              <span>A little closer.</span>
            </h1>
            <p className="hero-description">
              Good choices start close to home. Discover local drinks stores, order in the app, and
              follow your delivery with PourXpress.
            </p>
            <AppDownloadBlock />
            <div className="hero-note">
              <Check size={16} aria-hidden="true" />
              <span>Pay with M-PESA. Follow your order in the app.</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-orbit" aria-hidden="true" />
            <div className="hero-visual__label">
              <span className="mini-dot" />
              Your neighbourhood, in your pocket
            </div>
            <Screenshot kind="home" eager />
            <div className="hero-visual__foot">
              <span>THE POUREXPRESS APP</span>
              <span>Discover. Order. Follow.</span>
            </div>
          </div>
        </div>
        <div className="container hero-bottom">
          <span>One connected platform</span>
          <div>
            <span>
              <ShoppingBag size={17} aria-hidden="true" />
              For customers
            </span>
            <span>
              <Store size={17} aria-hidden="true" />
              For merchants
            </span>
            <span>
              <Bike size={17} aria-hidden="true" />
              For riders
            </span>
          </div>
          <a href="#how-it-works" className="text-link">
            See how it works <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section id="how-it-works" className="section how-section">
        <div className="container">
          <SectionHeading
            eyebrow="Keep it simple"
            title={
              <>
                From a local store
                <br />
                to your door.
              </>
            }
          >
            Your order, brought together in one app.
          </SectionHeading>
          <div className="steps">
            {[
              {
                icon: MapPin,
                number: '01',
                title: 'Find your local',
                body: 'Choose your delivery location and explore the stores and products available near you.',
              },
              {
                icon: Wallet,
                number: '02',
                title: 'Make it your order',
                body: 'Choose your favourites, review the total and follow the M-PESA steps at checkout.',
              },
              {
                icon: Route,
                number: '03',
                title: 'Follow along',
                body: 'Keep up with your order, from confirmation through delivery updates, right in the app.',
              },
            ].map((step) => (
              <article className="step" key={step.number}>
                <div className="step__top">
                  <step.icon size={28} strokeWidth={1.5} aria-hidden="true" />
                  <span>{step.number}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="section discovery-section">
        <div className="container discovery-grid">
          <div className="discovery-art">
            <Screenshot kind="stores" />
            <span className="photo-caption">App preview · example store content</span>
          </div>
          <div className="discovery-copy">
            <Eyebrow>A more local way to order</Eyebrow>
            <h2>
              Discover what’s
              <br />
              around the corner.
            </h2>
            <p className="lede">
              Explore nearby stores, find something you like, and keep the details of your order in
              one place.
            </p>
            <ul className="check-list">
              <li>
                <Check aria-hidden="true" size={18} />
                Store discovery based on your chosen location
              </li>
              <li>
                <Check aria-hidden="true" size={18} />
                Products and prices shown in the app
              </li>
              <li>
                <Check aria-hidden="true" size={18} />
                Order status and delivery updates
              </li>
            </ul>
            <ButtonLink to="/app" variant="outline">
              Explore the app
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="section reassurance-section">
        <div className="container reassurance-grid">
          <div className="reassurance-icon">
            <ShieldCheck size={44} strokeWidth={1.3} aria-hidden="true" />
          </div>
          <div>
            <Eyebrow>A thoughtful delivery experience</Eyebrow>
            <h2>
              Good service.
              <br />
              Responsible choices.
            </h2>
          </div>
          <div>
            <p>
              PourXpress is for adults. Follow the age and ID checks shown in the app and at
              delivery. Have a question? Our support team can help.
            </p>
            <Link to="/responsible-delivery" className="text-link">
              About responsible delivery <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section id="pricing" className="section community-section">
        <div className="container">
          <SectionHeading
            eyebrow="There’s a place for you here"
            title="Local stores. Shared opportunity."
          >
            Customers, merchants and riders make the PourXpress experience possible.
          </SectionHeading>
          <div className="audience-grid">
            <article className="audience-panel audience-panel--merchant">
              <div className="audience-panel__icon">
                <Store size={29} aria-hidden="true" />
              </div>
              <p className="eyebrow">For merchants</p>
              <h3>
                Your store.
                <br />A wider neighbourhood.
              </h3>
              <p>Connect with customers and bring your store’s day-to-day operations together.</p>
              <ButtonLink to="/merchants" variant="light">
                Explore merchant tools
              </ButtonLink>
              <Link className="text-link text-link--light" to="/merchants/pricing">
                View plans and pricing <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>
            <article className="audience-panel audience-panel--rider">
              <div className="audience-panel__icon">
                <Bike size={30} aria-hidden="true" />
              </div>
              <p className="eyebrow">For riders</p>
              <h3>
                Be part of
                <br />
                the local connection.
              </h3>
              <p>Explore the rider experience and speak with our team about getting started.</p>
              <ButtonLink to="/riders" variant="outline">
                Explore the rider app
              </ButtonLink>
            </article>
          </div>
        </div>
      </section>

      <section className="section faq-section">
        <div className="container faq-grid">
          <div>
            <Eyebrow>A few helpful answers</Eyebrow>
            <h2>
              Before you
              <br />
              get started.
            </h2>
            <Link to="/help" className="text-link">
              Visit the help centre <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <FAQList items={faqs.slice(0, 5)} />
        </div>
      </section>
      <DownloadSection />
    </>
  );
}
