'use client';

import Script from 'next/script';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Agent Croww',
  description: 'Commission-based digital marketplace for courses, e-books, templates, and digital products in India.',
  url: 'https://agentcroww.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://agentcroww.com/products?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

const organizationData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Agent Croww',
  alternativeName: 'AgentCroww',
  url: 'https://agentcroww.com',
  logo: 'https://agentcroww.com/images/icon.jpeg',
  description: 'India\'s leading commission-based marketplace for digital products.',
  email: 'team@agentcroww.com',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'IN',
    addressRegion: 'Maharashtra',
  },
  sameAs: [
    'https://www.instagram.com/agentcroww',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'team@agentcroww.com',
    contactType: 'customer support',
    availableLanguage: ['English', 'Hindi'],
    responseTime: 'P2D',
  },
};

const marketplaceData = {
  '@context': 'https://schema.org',
  '@type': 'Marketplace',
  name: 'Agent Croww',
  description: 'Commission-based marketplace connecting vendors, sellers, and customers for digital products.',
  url: 'https://agentcroww.com',
  operator: {
    '@type': 'Organization',
    name: 'Rookus',
  },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'INR',
    description: 'Digital products including courses, e-books, templates, software, and digital assets.',
  },
};

export default function StructuredData() {
  return (
    <>
      <Script
        id="structured-data-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <Script
        id="structured-data-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationData),
        }}
      />
      <Script
        id="structured-data-marketplace"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(marketplaceData),
        }}
      />
    </>
  );
}
