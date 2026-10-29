import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AppDownloadBlock,
  DownloadSection,
  Eyebrow,
  Screenshot,
  SectionHeading,
  OfficialPlayBadge,
} from '../components/ui/Elements.jsx';
import { FAQList } from '../components/ui/FAQList.jsx';
import { faqs } from '../content/faqs.js';

export default function AppPage() {
  return (
    <>
      <section className="section app-hero">
        <div className="container split-grid">
          <div>
            <Eyebrow>Meet your next local favourite</Eyebrow>
            <h1>
              A whole lot of local.
              <br />
              <span>One little app.</span>
            </h1>
            <p className="lede">
              Find drinks stores, choose your favourites, and keep up with your order. PourXpress
              brings it together.
            </p>
            <AppDownloadBlock />
            <p className="small-note">
              Android is available now. The App Store release is coming soon; no release date has
              been announced.
            </p>
          </div>
          <div className="app-hero__screens">
            <Screenshot kind="home" eager />
            <Screenshot kind="stores" />
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="See the experience" title="A clearer picture of your order.">
            Real app previews. Example prices and store content are not live website listings.
          </SectionHeading>
          <div className="product-feature-grid">
            <article>
              <Screenshot kind="stores" />
              <h3>Discover your stores</h3>
              <p>Choose a location to see the stores and products available to you.</p>
            </article>
            <article>
              <Screenshot kind="tracking" />
              <h3>Follow every milestone</h3>
              <p>
                See your order’s progress in the app. Transaction and location details are hidden in
                this preview.
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="section app-availability">
        <div className="container availability-grid">
          <div>
            <Eyebrow>Ready when you are</Eyebrow>
            <h2>
              Get PourXpress
              <br />
              on Android.
            </h2>
            <ul className="check-list">
              <li>
                <Check size={18} aria-hidden="true" />
                Published on Google Play
              </li>
              <li>
                <Check size={18} aria-hidden="true" />
                The same app for customers and riders
              </li>
              <li>
                <Check size={18} aria-hidden="true" />
                App Store coming soon
              </li>
            </ul>
            <OfficialPlayBadge />
          </div>
          <figure className="download-qr">
            <img
              src="/images/android-download-qr.svg"
              alt="QR code linking to the PourXpress Android app on Google Play"
              width="190"
              height="190"
              loading="lazy"
            />
            <figcaption>
              On a computer?
              <br />
              Scan to open Google Play on your Android phone.
            </figcaption>
          </figure>
        </div>
      </section>
      <section className="section faq-section">
        <div className="container faq-grid">
          <div>
            <Eyebrow>App questions</Eyebrow>
            <h2>Good to know.</h2>
            <Link className="text-link" to="/help">
              More help <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <FAQList items={faqs.slice(0, 5)} />
        </div>
      </section>
      <DownloadSection />
    </>
  );
}
