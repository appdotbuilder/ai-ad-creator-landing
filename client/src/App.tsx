
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { CreateLeadInput, CreateNewsletterSubscriptionInput, CreateAnalyticsEventInput } from '../../server/src/schema';

function App() {
  const [leadFormData, setLeadFormData] = useState<CreateLeadInput>({
    email: '',
    first_name: null,
    last_name: null,
    company: null,
    phone: null,
    interest_level: 'medium',
    source: 'landing_page',
    utm_campaign: null,
    utm_source: null,
    utm_medium: null,
    notes: null
  });

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Track page view on load
  const trackPageView = useCallback(async () => {
    try {
      const eventData: CreateAnalyticsEventInput = {
        event_type: 'page_view',
        event_data: JSON.stringify({ page: 'landing_page' }),
        user_agent: navigator.userAgent,
        ip_address: null, // Will be populated by backend if available
        referrer: document.referrer || null,
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium')
      };
      await trpc.createAnalyticsEvent.mutate(eventData);
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }, []);

  useEffect(() => {
    trackPageView();
    
    // Extract UTM parameters and set them in the lead form
    const urlParams = new URLSearchParams(window.location.search);
    setLeadFormData((prev: CreateLeadInput) => ({
      ...prev,
      utm_campaign: urlParams.get('utm_campaign'),
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium')
    }));
  }, [trackPageView]);

  const trackEvent = async (eventType: string, eventData?: Record<string, unknown>) => {
    try {
      const analyticsData: CreateAnalyticsEventInput = {
        event_type: eventType,
        event_data: eventData ? JSON.stringify(eventData) : null,
        user_agent: navigator.userAgent,
        ip_address: null,
        referrer: document.referrer || null,
        utm_campaign: leadFormData.utm_campaign,
        utm_source: leadFormData.utm_source,
        utm_medium: leadFormData.utm_medium
      };
      await trpc.createAnalyticsEvent.mutate(analyticsData);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLead(true);
    setSubmitMessage('');

    try {
      await trackEvent('lead_form_submit', { email: leadFormData.email });
      await trpc.createLead.mutate(leadFormData);
      
      setSubmitMessage('🎉 Thank you! We\'ll be in touch soon to show you how AI can transform your advertising!');
      setLeadFormData((prev: CreateLeadInput) => ({
        ...prev,
        email: '',
        first_name: null,
        last_name: null,
        company: null,
        phone: null,
        notes: null
      }));
      await trackEvent('lead_form_success');
    } catch (error) {
      console.error('Failed to submit lead:', error);
      setSubmitMessage('Something went wrong. Please try again.');
      await trackEvent('lead_form_error', { error: String(error) });
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNewsletter(true);

    try {
      const subscriptionData: CreateNewsletterSubscriptionInput = { email: newsletterEmail };
      await trpc.createNewsletterSubscription.mutate(subscriptionData);
      setNewsletterEmail('');
      await trackEvent('newsletter_signup', { email: newsletterEmail });
      // Show success feedback (you could add a toast notification here)
    } catch (error) {
      console.error('Failed to subscribe to newsletter:', error);
      await trackEvent('newsletter_signup_error', { error: String(error) });
    } finally {
      setIsSubmittingNewsletter(false);
    }
  };

  const handleCTAClick = async (ctaType: string) => {
    await trackEvent('cta_click', { type: ctaType });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AdGenius</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            🚀 Beta Launch
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
          ✨ AI-Powered Advertising Platform
        </Badge>
        
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Turn Your Products Into
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> High-Converting Ads</span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Upload your product feeds, services, or ideas and watch our AI create compelling advertisements. 
          Manage everything in a familiar Excel-like interface that marketers love.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
            onClick={() => {
              handleCTAClick('hero_cta');
              document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            🎯 Get Early Access
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="border-2 border-gray-300 hover:border-blue-600 px-8 py-3 text-lg"
            onClick={() => handleCTAClick('demo_request')}
          >
            📹 Watch Demo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">10x</div>
            <div className="text-gray-600">Faster Ad Creation</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">85%</div>
            <div className="text-gray-600">Higher Conversion Rates</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">$50K+</div>
            <div className="text-gray-600">Average Monthly Savings</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale Your Advertising
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From product feeds to high-performing ads in minutes, not hours
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <CardTitle className="text-xl">AI Content Generation</CardTitle>
                <CardDescription>
                  Advanced AI analyzes your products and creates compelling ad copy, headlines, and descriptions that convert
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <CardTitle className="text-xl">Excel-Like Interface</CardTitle>
                <CardDescription>
                  Familiar spreadsheet experience with powerful bulk editing, filtering, and sorting capabilities
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <CardTitle className="text-xl">Multi-Platform Export</CardTitle>
                <CardDescription>
                  Export ads directly to Google Ads, Facebook Ads, Amazon, and 20+ other advertising platforms
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <CardTitle className="text-xl">Feed Integration</CardTitle>
                <CardDescription>
                  Connect product feeds, service catalogs, or idea lists from any source with real-time synchronization
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <CardTitle className="text-xl">Performance Analytics</CardTitle>
                <CardDescription>
                  Track ad performance across all platforms with detailed analytics and optimization recommendations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <CardTitle className="text-xl">Team Collaboration</CardTitle>
                <CardDescription>
                  Work together with your team in real-time with role-based permissions and approval workflows
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              From data to dollars in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Upload Your Data</h3>
              <p className="text-gray-600">
                Import product feeds, service lists, or idea collections from CSV, Excel, APIs, or direct integrations
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">AI Creates Ads</h3>
              <p className="text-gray-600">
                Our AI analyzes your data and generates high-converting ad copy, headlines, and creative variations
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Launch & Scale</h3>
              <p className="text-gray-600">
                Export to your preferred ad platforms and watch your campaigns perform better than ever
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Form Section */}
      <section id="lead-form" className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-none shadow-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  🚀 Get Early Access
                </CardTitle>
                <CardDescription className="text-lg">
                  Join 500+ marketers already using AI to transform their advertising
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="First name"
                      value={leadFormData.first_name || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLeadFormData((prev: CreateLeadInput) => ({ ...prev, first_name: e.target.value || null }))
                      }
                    />
                    <Input
                      placeholder="Last name"
                      value={leadFormData.last_name || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLeadFormData((prev: CreateLeadInput) => ({ ...prev, last_name: e.target.value || null }))
                      }
                    />
                  </div>
                  
                  <Input
                    type="email"
                    placeholder="Work email address"
                    value={leadFormData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLeadFormData((prev: CreateLeadInput) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Company name"
                      value={leadFormData.company || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLeadFormData((prev: CreateLeadInput) => ({ ...prev, company: e.target.value || null }))
                      }
                    />
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      value={leadFormData.phone || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLeadFormData((prev: CreateLeadInput) => ({ ...prev, phone: e.target.value || null }))
                      }
                    />
                  </div>

                  <Select
                    value={leadFormData.interest_level || 'medium'}
                    onValueChange={(value: 'low' | 'medium' | 'high') =>
                      setLeadFormData((prev: CreateLeadInput) => ({ ...prev, interest_level: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How interested are you?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Very interested - Let's talk ASAP!</SelectItem>
                      <SelectItem value="medium">Interested - Tell me more</SelectItem>
                      <SelectItem value="low">Just exploring options</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Tell us about your current advertising challenges or goals (optional)"
                    value={leadFormData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setLeadFormData((prev: CreateLeadInput) => ({ ...prev, notes: e.target.value || null }))
                    }
                    rows={3}
                  />

                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isSubmittingLead}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg"
                  >
                    {isSubmittingLead ? '⏳ Submitting...' : '🎯 Get Early Access'}
                  </Button>

                  {submitMessage && (
                    <div className={`text-center p-4 rounded-lg ${
                      submitMessage.includes('🎉') 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {submitMessage}
                    </div>
                  )}
                </form>

                <div className="text-center mt-6 text-sm text-gray-500">
                  🔒 We respect your privacy. No spam, unsubscribe anytime.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="text-xl font-bold">AdGenius</span>
              </div>
              <p className="text-gray-400">
                Transform your advertising with AI-powered content generation and Excel-like management.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Stay Updated</h4>
              <p className="text-gray-400 mb-4">Get the latest product updates and marketing tips.</p>
              
              <form onSubmit={handleNewsletterSubmit} className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewsletterEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={isSubmittingNewsletter}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmittingNewsletter ? '⏳' : '📧'}
                </Button>
              </form>
            </div>
          </div>
          
          <Separator className="my-8 bg-gray-800" />
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 AdGenius. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
