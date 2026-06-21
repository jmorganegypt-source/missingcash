import { CheckCircle2, ExternalLink, Phone, Shield, Star, Sparkles, ArrowRight, Car, Anchor, Home, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";

const BASE = import.meta.env.BASE_URL;
const STRATTON_LOGO = `${BASE}stratton-logo.png`;
const MIA_AVATAR    = `${BASE}mia-avatar.png`;

const STRATTON_QUOTE_URL =
  "https://app.strattonfinance.com.au/?rcid=9b783c62-5435-4f78-bfbc-8dc1681dfd41&utm_channel=Referrers&utm_source=MissingCash&utm_medium=Website_Integration&utm_campaign=Erin_Crofton";

function openMia(message?: string) {
  window.dispatchEvent(new CustomEvent("mia:open", { detail: { message } }));
}

const LOAN_CONFIG = {
  car: {
    label: "Car Loan",
    Icon: Car,
    rate: 7.99,
    min: 5_000,
    max: 100_000,
    defaultAmt: 25_000,
    step: 1_000,
    terms: [1, 2, 3, 4, 5],
    defaultTerm: 3,
  },
  boat: {
    label: "Boat Loan",
    Icon: Anchor,
    rate: 8.99,
    min: 10_000,
    max: 150_000,
    defaultAmt: 40_000,
    step: 1_000,
    terms: [2, 3, 5, 7],
    defaultTerm: 3,
  },
  home: {
    label: "Home Loan",
    Icon: Home,
    rate: 6.49,
    min: 100_000,
    max: 1_000_000,
    defaultAmt: 500_000,
    step: 10_000,
    terms: [10, 15, 20, 25, 30],
    defaultTerm: 25,
  },
  personal: {
    label: "Personal Loan",
    Icon: CreditCard,
    rate: 10.99,
    min: 2_000,
    max: 50_000,
    defaultAmt: 15_000,
    step: 500,
    terms: [1, 2, 3, 4, 5],
    defaultTerm: 3,
  },
} as const;

type LoanType = keyof typeof LOAN_CONFIG;

function calcMonthly(principal: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function fmtAUD(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-AU");
}

export default function Finance() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [consent, setConsent]             = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [loanType, setLoanType]           = useState<LoanType>("car");
  const [loanAmount, setLoanAmount]       = useState<number>(LOAN_CONFIG.car.defaultAmt);
  const [preferredTerm, setPreferredTerm] = useState<number>(LOAN_CONFIG.car.defaultTerm);
  const [showEstimate, setShowEstimate]   = useState(false);

  usePageSEO({
    title: "Stratton Finance Wanneroo, Perth | Car Loans & Personal Finance — MissingCash",
    description:
      "Get competitive car loans, personal loans and commercial finance through Stratton Finance Wanneroo. Speak with Erin Crofton (08) 9446 9893. ACL 364340 · 40+ lenders · award-winning broker.",
    keywords:
      "Stratton Finance, Stratton Finance Wanneroo, Stratton Finance Perth, Erin Crofton, car loans Perth, car finance Perth, personal loans WA, commercial finance Perth, asset finance, finance broker Perth, MissingCash finance",
    canonical: "https://www.missingcash.com.au/finance",
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id   = "finance-jsonld";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FinancialService",
      name: "Stratton Finance Wanneroo (via MissingCash)",
      description: "Car loans, personal loans, commercial and asset finance from Stratton Finance.",
      url: "https://www.missingcash.com.au/finance",
      telephone: "+61894469893",
      areaServed: "AU",
      address: { "@type": "PostalAddress", addressLocality: "Wanneroo", addressRegion: "WA", addressCountry: "AU" },
      employee: { "@type": "Person", name: "Erin Crofton", jobTitle: "Finance Consultant" },
      makesOffer: [
        { "@type": "Offer", name: "Car Finance" },
        { "@type": "Offer", name: "Personal Loans" },
        { "@type": "Offer", name: "Commercial Finance" },
        { "@type": "Offer", name: "Asset Finance" },
      ],
    });
    document.head.appendChild(script);
    return () => { document.getElementById("finance-jsonld")?.remove(); };
  }, []);

  useEffect(() => {
    const cfg = LOAN_CONFIG[loanType];
    setLoanAmount(cfg.defaultAmt);
    setPreferredTerm(cfg.defaultTerm);
    setShowEstimate(false);
  }, [loanType]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!consent) return;
    setSubmitting(true);
    setSubmitError(null);

    const fd = new FormData
