import { Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/layout/SiteLayout.jsx';
import { publication } from './config/site.js';
import HomePage from './pages/HomePage.jsx';
import AppPage from './pages/AppPage.jsx';
import MerchantsPage from './pages/MerchantsPage.jsx';
import MerchantPricingPage from './pages/MerchantPricingPage.jsx';
import RidersPage from './pages/RidersPage.jsx';
import HelpPage from './pages/HelpPage.jsx';
import {
  AboutPage,
  ContactPage,
  ResponsibleDeliveryPage,
  NotFoundPage,
} from './pages/CompanyPages.jsx';
import { PrivacyPage, TermsPage } from './pages/LegalPages.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route caseSensitive path="app" element={<AppPage />} />
        <Route caseSensitive path="merchants" element={<MerchantsPage />} />
        {publication.pricing && (
          <Route caseSensitive path="merchants/pricing" element={<MerchantPricingPage />} />
        )}
        <Route caseSensitive path="riders" element={<RidersPage />} />
        <Route caseSensitive path="help" element={<HelpPage />} />
        <Route caseSensitive path="about" element={<AboutPage />} />
        <Route caseSensitive path="contact" element={<ContactPage />} />
        {publication.responsibleDelivery && (
          <Route caseSensitive path="responsible-delivery" element={<ResponsibleDeliveryPage />} />
        )}
        <Route caseSensitive path="privacy" element={<PrivacyPage />} />
        <Route caseSensitive path="terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
