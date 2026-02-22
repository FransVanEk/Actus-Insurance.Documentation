'use client'

import Link from "next/link";
import { useState } from "react";
import { CheckCircleIcon, DocumentTextIcon, ShieldCheckIcon, CurrencyDollarIcon, BuildingOfficeIcon, HeartIcon } from "@heroicons/react/24/outline";

type TabType = 'framework' | 'financial' | 'insurance';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('framework');

  const tabs = {
    framework: {
      title: 'ACTUS Framework', 
      icon: BuildingOfficeIcon,
      description: 'Core framework architecture, implementation, and technical specifications',
      features: [
        'Core Concepts & Architecture',
        'Implementation Guidelines',
        'Technical Specifications',
        'System Integration Patterns'
      ],
      href: '/docs/framework'
    },
    financial: {
      title: 'ACTUS Financial',
      icon: CurrencyDollarIcon,
      description: 'Financial contract modeling, risk management, and banking applications',
      features: [
        'Contract Types & Portfolio Modeling',
        'Risk Management & Analytics', 
        'Banking & Investment Applications',
        'Regulatory Reporting (Basel III/IV, IFRS 9)'
      ],
      href: '/docs/financial'
    },
    insurance: {
      title: 'ACTUS Insurance',
      icon: HeartIcon, 
      description: 'Insurance contract modeling, actuarial applications, and regulatory compliance',
      features: [
        'Life & Annuity Contract Modeling',
        'Property & Casualty Applications',
        'Actuarial Analysis & Reserving',
        'Solvency II & IFRS 17 Compliance'
      ],
      href: '/docs/insurance'
    }
  };

  const currentTab = tabs[activeTab];
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0D2038 0%, #1A3550 60%, #0D2038 100%)' }}>`
      {/* Header */}
      <header className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <img src="/logo_A_dark.svg" alt="ACTUS Logo" className="h-12 w-10 object-contain" />
              <span className="ml-3 text-2xl font-bold text-white">
                ACTUS Documentation
              </span>
            </div>
            <Link
              href={currentTab.href}
              className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
              style={{ backgroundColor: '#D4891A' }}
            >
              View {currentTab.title}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">`
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              ACTUS Documentation
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8" style={{ color: '#9FB8D0' }}>
              Comprehensive documentation for the ACTUS standard across Financial, Framework, and Insurance applications.
              Professional resources for auditors, bankers, actuaries, and technology implementers.
            </p>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="border-b" style={{ borderColor: '#D4891A40' }}>
            <nav className="-mb-px flex space-x-8 justify-center" aria-label="Tabs">
              {Object.entries(tabs).map(([key, tab]) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as TabType)}
                    className="flex items-center space-x-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors"
                    style={activeTab === key
                      ? { borderColor: '#D4891A', color: '#D4891A' }
                      : { borderColor: 'transparent', color: '#9FB8D0' }
                    }
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-16 min-h-[500px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full">
              {/* Content Description */}
              <div className="flex flex-col h-full">
                <div className="flex items-center space-x-3 mb-6">
                  <currentTab.icon className="h-8 w-8" style={{ color: '#D4891A' }} />
                  <h2 className="text-3xl font-bold text-white">
                    {currentTab.title}
                  </h2>
                </div>
                <p className="text-lg mb-8 min-h-[60px] flex items-start" style={{ color: '#9FB8D0' }}>
                  {currentTab.description}
                </p>
                
                <div className="min-h-[160px] mb-8">
                  <ul className="space-y-4">
                    {currentTab.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircleIcon className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0" style={{ color: '#D4891A' }} />
                        <span className="text-white">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex items-center space-x-4 mt-auto">
                  <Link
                    href={currentTab.href}
                    className="inline-flex items-center rounded-md px-6 py-3 text-lg font-semibold text-white shadow-sm transition-colors"
                    style={{ backgroundColor: '#D4891A' }}
                  >
                    Explore {currentTab.title}
                  </Link>
                </div>
              </div>

              {/* Visual Element */}
              <div className="rounded-2xl p-8 lg:p-12 flex items-center justify-center" style={{ backgroundColor: '#1A3550', border: '1px solid #D4891A40' }}>
                <div className="text-center">
                  <currentTab.icon className="h-24 w-24 mx-auto mb-6" style={{ color: '#D4891A' }} />
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Professional Documentation
                  </h3>
                  <p style={{ color: '#9FB8D0' }}>
                    Comprehensive, standardized documentation designed for professional use in
                    {activeTab === 'framework' && ' system architecture, implementation, and technical development'}
                    {activeTab === 'financial' && ' banking, investment management, and financial services'}
                    {activeTab === 'insurance' && ' actuarial analysis, insurance modeling, and regulatory compliance'}
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#0D2038', borderTop: '1px solid #D4891A40' }}>
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <p className="text-xs" style={{ color: '#9FB8D0' }}>
              Maintained by Frans van Ek © 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
