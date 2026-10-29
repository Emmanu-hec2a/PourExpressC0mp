import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { faqs } from '../content/faqs.js';
import { FAQList } from '../components/ui/FAQList.jsx';
import { PageIntro } from '../components/ui/Elements.jsx';

export default function HelpPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const categories = ['All', ...new Set(faqs.map((item) => item.category))];
  const matched = faqs.filter(
    (item) =>
      (category === 'All' || item.category === category) &&
      (item.question + ' ' + item.answer)
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <>
      <PageIntro
        eyebrow="The help centre"
        title={
          <>
            A little help.
            <br />A clearer next step.
          </>
        }
      >
        Find answers about the app, orders and delivery. For anything specific to your account,
        reach out through the app or contact our team.
      </PageIntro>
      <section className="section help-section">
        <div className="container help-container">
          <label className="help-search">
            <span className="sr-only">Search help</span>
            <Search size={20} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search help"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the FAQs"
            />
          </label>
          <div className="help-categories" role="group" aria-label="Filter help topics">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="search-status" role="status" aria-live="polite">
            {matched.length} {matched.length === 1 ? 'answer' : 'answers'}
            {query ? ' matching your search' : ''}
          </p>
          {matched.length ? (
            <FAQList items={matched} />
          ) : (
            <div className="no-results">
              <h2>No matching answers yet.</h2>
              <p>Try another word or contact our support team.</p>
              <button
                className="button button--outline"
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategory('All');
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          <div className="help-contact">
            <div>
              <h2>Need a hand with something else?</h2>
              <p>Talk to our team using our published email and WhatsApp channels.</p>
            </div>
            <Link to="/contact" className="button button--primary">
              Contact support <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
