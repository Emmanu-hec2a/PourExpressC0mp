import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, MessageCircle, Store, Bike, ShoppingBag } from 'lucide-react';
import { site } from '../config/site.js';
import { ButtonLink, DownloadSection, Eyebrow, PageIntro } from '../components/ui/Elements.jsx';

export function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="Our story"
        title={
          <>
            Good things happen
            <br />
            closer to home.
          </>
        }
      >
        PourXpress connects customers, local drinks merchants and riders in Kenya. We bring those
        different parts of the experience together.
      </PageIntro>
      <section className="section">
        <div className="container about-story">
          <div>
            <Eyebrow>Why we’re here</Eyebrow>
            <h2>
              Built around
              <br />
              local connections.
            </h2>
            <p className="lede">
              Finding a store, managing an order and making a delivery are connected jobs.
              PourXpress gives customers, merchants and riders their own place in the same
              platform.
            </p>
            <p>
              Founded by Emmanuel Odongo, PourXpress grew from a practical interest in helping
              local merchants take part in digital commerce.
            </p>
            <ButtonLink to="/app" variant="outline">
              Meet the app
            </ButtonLink>
          </div>
          <figure className="brand-editorial">
            <img
              src="/images/brand-editorial.jpg"
              alt="Illustrative still life with a forest-green delivery tote and unbranded glass bottles."
              width="1536"
              height="1024"
              loading="lazy"
            />
            <figcaption>Illustrative brand image, not a product listing.</figcaption>
          </figure>
        </div>
      </section>
      <section className="section section--cream">
        <div className="container">
          <div className="about-values">
            <article>
              <span>01</span>
              <h2>Local first.</h2>
              <p>Keep the experience rooted in the stores and people around you.</p>
            </article>
            <article>
              <span>02</span>
              <h2>Clearer choices.</h2>
              <p>Make product, order and pricing information easier to understand.</p>
            </article>
            <article>
              <span>03</span>
              <h2>Connected people.</h2>
              <p>Build for customers, merchants and riders as parts of one experience.</p>
            </article>
          </div>
        </div>
      </section>
      <DownloadSection />
    </>
  );
}

export function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Let’s connect"
        title={
          <>
            The right people.
            <br />A real conversation.
          </>
        }
      >
        Questions about an order, your store or getting started as a rider? Here are the ways to
        reach PourXpress.
      </PageIntro>
      <section className="section">
        <div className="container">
          <div className="contact-channels">
            <a href={'mailto:' + site.supportEmail}>
              <Mail size={30} aria-hidden="true" />
              <span className="eyebrow">Open your email app</span>
              <h2>Email our team.</h2>
              <p>{site.supportEmail}</p>
              <span className="text-link">
                Send an email <ArrowUpRight size={18} aria-hidden="true" />
              </span>
            </a>
            <a href={site.whatsappUrl}>
              <MessageCircle size={30} aria-hidden="true" />
              <span className="eyebrow">Continue to WhatsApp</span>
              <h2>Start a conversation.</h2>
              <p>{site.phoneDisplay}</p>
              <span className="text-link">
                Open WhatsApp <ArrowUpRight size={18} aria-hidden="true" />
              </span>
            </a>
          </div>
          <div className="contact-audiences">
            {[
              {
                icon: ShoppingBag,
                title: 'Customers',
                text: 'For order-specific help, start with the support options in the app. You can also contact our team.',
                to: '/help',
                action: 'Browse customer help',
              },
              {
                icon: Store,
                title: 'Merchants',
                text: 'Existing merchants can continue using their merchant dashboard. New business enquiries are welcome by email.',
                to: '/merchants',
                action: 'Visit the merchant page',
              },
              {
                icon: Bike,
                title: 'Riders',
                text: 'Ask about rider access, requirements or using your existing account.',
                to: '/riders',
                action: 'Visit the rider page',
              },
            ].map((item) => (
              <article key={item.title}>
                <item.icon size={24} aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link className="text-link" to={item.to}>
                  {item.action}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
          <p className="contact-safety">
            Keep your credentials private. Our support conversations should never require your
            password, one-time verification code or M-PESA PIN. Opening email or WhatsApp is not the
            same as submitting a ticket on this website.
          </p>
        </div>
      </section>
    </>
  );
}

export function ResponsibleDeliveryPage() {
  return (
    <>
      <PageIntro
        eyebrow="Responsible delivery"
        title={
          <>
            Thoughtful orders.
            <br />
            Responsible choices.
          </>
        }
      >
        PourXpress is for adults. Understand the steps shown in the app before placing an order and
        receiving your delivery.
      </PageIntro>
      <section className="section">
        <div className="container policy-layout">
          <aside>
            <p>On this page</p>
            <a href="#adult-orders">Adult ordering</a>
            <a href="#delivery-checks">Age and ID checks</a>
            <a href="#questions">Questions and support</a>
          </aside>
          <div className="prose-content">
            <section id="adult-orders">
              <h2>Order responsibly.</h2>
              <p>
                Use the service responsibly and follow the requirements presented during your order.
                The website does not replace any age or identity checks in the production app or at
                delivery.
              </p>
            </section>
            <section id="delivery-checks">
              <h2>Follow the age and ID checks.</h2>
              <p>
                Review the instructions shown in the app and be ready for the checks required when
                your delivery arrives. If you are unsure what identification or other steps are
                needed, contact support before you order.
              </p>
              <p>
                Do not send identification documents through public website forms. This website does
                not collect identity uploads.
              </p>
            </section>
            <section id="questions">
              <h2>Ask before you order.</h2>
              <p>
                Our support team can clarify the process. This page does not promise eligibility,
                delivery approval, a refund, or a legal certification.
              </p>
              <ButtonLink to="/contact">Contact our team</ButtonLink>
              <Link className="text-link" to="/terms">
                Read the terms of service <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}

export function NotFoundPage() {
  return (
    <section className="section not-found">
      <div className="container">
        <Eyebrow>A small detour</Eyebrow>
        <span className="error-number" aria-hidden="true">
          404
        </span>
        <h1>
          This page isn’t
          <br />
          on the route.
        </h1>
        <p className="lede">
          The address may have changed, or the page might not exist. Let’s get you somewhere useful.
        </p>
        <div className="page-intro__actions">
          <ButtonLink to="/">Back to home</ButtonLink>
          <ButtonLink to="/help" variant="outline">
            Find some help
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
