'use client';

import { useState } from 'react';
import { Container, Button, Card, CardContent } from '@/components/ui';

export default function ForgeSightDemoPage() {
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    useCase: '',
    monthlyVolume: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.role) {
      newErrors.role = 'Please select your role';
    }

    if (!formData.useCase) {
      newErrors.useCase = 'Please select your primary use case';
    }

    if (!formData.monthlyVolume) {
      newErrors.monthlyVolume = 'Please select your monthly volume';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Store lead data in localStorage
    localStorage.setItem(
      'madfam_demo_forgesight',
      JSON.stringify({
        ...formData,
        timestamp: new Date().toISOString(),
      })
    );

    // TODO: Send to backend/CRM
    // console.log('Forge Sight demo lead captured:', formData);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Redirect to Forge Sight with tracking params
    const trackingParams = new URLSearchParams({
      source: 'madfam-demo-prep',
      role: formData.role,
      use_case: formData.useCase,
      volume: formData.monthlyVolume,
    });

    window.location.href = `https://www.forgesight.quest?${trackingParams.toString()}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Hero Section */}
      <section className="pt-24 pb-12">
        <Container>
          <div className="max-w-4xl mx-auto text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="text-xl">🏭</span>
              Product Demo
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-neutral-900 mb-6">
              Experience Forge Sight&apos;s Pricing Intelligence
            </h1>
            <p className="text-xl text-neutral-600 leading-relaxed">
              Before you explore the demo, let&apos;s personalize your experience with a few quick
              questions. This helps us show you the most relevant features for your manufacturing
              needs.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="font-semibold text-neutral-900 mb-2">Instant Pricing</h3>
              <p className="text-sm text-neutral-600">
                Get accurate quotes for 3D printing and digital fabrication in seconds
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-semibold text-neutral-900 mb-2">Market Intelligence</h3>
              <p className="text-sm text-neutral-600">
                Compare pricing across materials, processes, and regional suppliers
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-semibold text-neutral-900 mb-2">Process Optimization</h3>
              <p className="text-sm text-neutral-600">
                Identify cost-saving opportunities and optimal manufacturing methods
              </p>
            </div>
          </div>

          {/* Demo Prep Form */}
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    Personalize Your Demo Experience
                  </h2>
                  <p className="text-neutral-600">
                    Takes less than 1 minute • We&apos;ll send you relevant resources after the demo
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Work Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="you@company.com"
                      required
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  {/* Role */}
                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Your Role *
                    </label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.role ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select your role...</option>
                      <option value="designer">Product Designer / Engineer</option>
                      <option value="procurement">Procurement / Buyer</option>
                      <option value="operations">Operations / Production Manager</option>
                      <option value="executive">Executive / Founder</option>
                      <option value="fabrication">Fabrication Shop Owner</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                  </div>

                  {/* Use Case */}
                  <div>
                    <label
                      htmlFor="useCase"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Primary Use Case *
                    </label>
                    <select
                      id="useCase"
                      value={formData.useCase}
                      onChange={e => setFormData({ ...formData, useCase: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.useCase ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">What&apos;s your primary interest?</option>
                      <option value="rapid-prototyping">Rapid Prototyping</option>
                      <option value="production">Low-Volume Production</option>
                      <option value="cost-estimation">Cost Estimation & Quoting</option>
                      <option value="supplier-sourcing">Supplier Sourcing</option>
                      <option value="material-selection">Material & Process Selection</option>
                      <option value="other">Other / Just Exploring</option>
                    </select>
                    {errors.useCase && (
                      <p className="mt-1 text-sm text-red-600">{errors.useCase}</p>
                    )}
                  </div>

                  {/* Monthly Volume */}
                  <div>
                    <label
                      htmlFor="monthlyVolume"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Monthly Parts Volume *
                    </label>
                    <select
                      id="monthlyVolume"
                      value={formData.monthlyVolume}
                      onChange={e => setFormData({ ...formData, monthlyVolume: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.monthlyVolume ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select monthly parts volume...</option>
                      <option value="1-10">1-10 parts/month</option>
                      <option value="11-50">11-50 parts/month</option>
                      <option value="51-200">51-200 parts/month</option>
                      <option value="201-500">201-500 parts/month</option>
                      <option value="501+">500+ parts/month</option>
                      <option value="variable">Variable / Project-based</option>
                    </select>
                    {errors.monthlyVolume && (
                      <p className="mt-1 text-sm text-red-600">{errors.monthlyVolume}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Launching Demo...' : 'Launch Forge Sight Demo'}
                      <svg
                        className="w-5 h-5 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </Button>
                  </div>

                  {/* Trust Signals */}
                  <div className="pt-4 border-t border-neutral-200">
                    <div className="flex items-start gap-3 text-sm text-neutral-600">
                      <svg
                        className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-neutral-900">What happens next?</p>
                        <ul className="mt-1 space-y-1">
                          <li>✓ Instant access to interactive demo</li>
                          <li>✓ Personalized pricing benchmarks</li>
                          <li>✓ Optional technical consultation</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 text-center">
                    🔒 Your information is secure. We&apos;ll only use it to personalize your demo
                    experience and send relevant follow-up resources.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Social Proof */}
          <div className="max-w-2xl mx-auto mt-8 text-center">
            <p className="text-sm text-neutral-600 mb-4">
              Trusted by design teams and fabrication shops across LATAM
            </p>
            <div className="flex items-center justify-center gap-8 opacity-50">
              <div className="h-12 w-24 bg-neutral-200 rounded flex items-center justify-center">
                <span className="text-xs text-neutral-500">Client</span>
              </div>
              <div className="h-12 w-24 bg-neutral-200 rounded flex items-center justify-center">
                <span className="text-xs text-neutral-500">Logo</span>
              </div>
              <div className="h-12 w-24 bg-neutral-200 rounded flex items-center justify-center">
                <span className="text-xs text-neutral-500">Here</span>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
