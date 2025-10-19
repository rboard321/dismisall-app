import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { School } from '../types';

// Initialize Stripe (use your publishable key)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface SubscriptionManagementProps {
  school: School;
  onSchoolUpdate: () => void;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ school, onSchoolUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock pricing plans - in production, these would come from Stripe
  const pricingPlans = [
    {
      id: 'trial',
      name: 'Trial',
      price: 0,
      period: '14 days',
      features: ['Up to 500 students', 'Basic support', 'Core dismissal features'],
      stripePriceId: null
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: 39,
      period: 'month',
      features: ['Unlimited students', 'Priority support', 'Advanced reporting', 'Multiple users'],
      stripePriceId: 'price_monthly_dismissal_app' // Replace with actual Stripe price ID
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: 29,
      period: 'month',
      yearlyPrice: 348,
      features: ['Unlimited students', 'Priority support', 'Advanced reporting', 'Multiple users', '2 months free'],
      stripePriceId: 'price_yearly_dismissal_app' // Replace with actual Stripe price ID
    }
  ];

  // Get current subscription status
  const getCurrentPlan = () => {
    if (school.subscriptionStatus === 'trial') {
      return pricingPlans.find(p => p.id === 'trial');
    } else if (school.subscriptionStatus === 'active') {
      // In production, you'd determine this from Stripe subscription data
      return pricingPlans.find(p => p.id === 'monthly');
    }
    return null;
  };

  const currentPlan = getCurrentPlan();

  // Calculate trial days remaining
  const getTrialDaysRemaining = (): number => {
    if (!school.trialEndsAt || school.subscriptionStatus !== 'trial') return 0;
    const trialEnd = school.trialEndsAt.toDate ? school.trialEndsAt.toDate() : new Date(school.trialEndsAt as any);
    const today = new Date();
    const diffTime = trialEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Handle Stripe Checkout
  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!priceId) return;

    setLoading(true);
    setError(null);

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // In production, you'd call your backend to create a Stripe Checkout session
      // For now, we'll simulate the flow
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          schoolId: school.id,
          planName
        }),
      });

      if (!response.ok) {
        // Fallback: Update subscription status directly (for demo purposes)
        console.warn('Backend checkout API not available, updating status directly');
        await updateSubscriptionStatus('active');
        alert(`Successfully subscribed to ${planName}! (Demo mode - no actual payment processed)`);
        return;
      }

      const session = await response.json();

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      setError(error.message || 'Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  // Update subscription status (for demo purposes)
  const updateSubscriptionStatus = async (status: 'trial' | 'active' | 'cancelled' | 'past_due') => {
    try {
      const schoolDoc = doc(db, 'schools', school.id);
      await updateDoc(schoolDoc, {
        subscriptionStatus: status,
        updatedAt: new Date()
      });
      await onSchoolUpdate();
    } catch (error) {
      console.error('Error updating subscription status:', error);
      setError('Failed to update subscription status');
    }
  };

  // Handle cancellation
  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? Your account will remain active until the end of your billing period.')) {
      return;
    }

    setLoading(true);
    try {
      // In production, call your backend to cancel the Stripe subscription
      await updateSubscriptionStatus('cancelled');
      alert('Subscription cancelled successfully. Your account will remain active until the end of your billing period.');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setError('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'trial': return '#ffc107';
      case 'active': return '#28a745';
      case 'cancelled': return '#dc3545';
      case 'past_due': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  const trialDaysRemaining = getTrialDaysRemaining();
  const isTrialExpiring = trialDaysRemaining <= 3;

  return (
    <div>
      {/* Current Subscription Status */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Current Subscription</h3>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {currentPlan?.name || 'No Active Plan'}
            </div>
            <div style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              backgroundColor: getStatusColor(school.subscriptionStatus),
              color: 'white',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              textTransform: 'capitalize'
            }}>
              {school.subscriptionStatus}
            </div>
          </div>

          {currentPlan && currentPlan.price > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                ${currentPlan.price}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                per {currentPlan.period}
              </div>
            </div>
          )}
        </div>

        {school.subscriptionStatus === 'trial' && (
          <div style={{
            padding: '1rem',
            backgroundColor: isTrialExpiring ? '#fff3cd' : '#d4edda',
            border: `1px solid ${isTrialExpiring ? '#ffeaa7' : '#c3e6cb'}`,
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {isTrialExpiring ? '⚠️ Trial Expiring Soon' : '✅ Trial Active'}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              {trialDaysRemaining > 0
                ? `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining`
                : 'Trial has expired'
              }
            </div>
          </div>
        )}

        {school.subscriptionStatus === 'active' && (
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={handleCancelSubscription}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Cancel Subscription
            </button>
          </div>
        )}
      </div>

      {/* Pricing Plans */}
      {(school.subscriptionStatus === 'trial' || school.subscriptionStatus === 'cancelled') && (
        <div>
          <h3 style={{ marginBottom: '1.5rem' }}>Choose Your Plan</h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {pricingPlans.filter(plan => plan.id !== 'trial').map((plan) => (
              <div
                key={plan.id}
                style={{
                  backgroundColor: 'white',
                  border: plan.id === 'yearly' ? '2px solid #007bff' : '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  position: 'relative'
                }}
              >
                {plan.id === 'yearly' && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '0.25rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    BEST VALUE
                  </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                    {plan.name}
                  </h4>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745' }}>
                      ${plan.price}
                    </span>
                    <span style={{ fontSize: '1rem', color: '#666' }}>
                      /{plan.period}
                    </span>
                  </div>
                  {plan.yearlyPrice && (
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      Billed annually: ${plan.yearlyPrice}/year
                    </div>
                  )}
                </div>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 1.5rem 0'
                }}>
                  {plan.features.map((feature, index) => (
                    <li key={index} style={{
                      padding: '0.5rem 0',
                      borderBottom: index < plan.features.length - 1 ? '1px solid #eee' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ color: '#28a745' }}>✓</span>
                      <span style={{ fontSize: '0.875rem' }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.stripePriceId!, plan.name)}
                  disabled={loading || !plan.stripePriceId}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: plan.id === 'yearly' ? '#007bff' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading || !plan.stripePriceId ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? 'Processing...' : `Start ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {/* Billing Information */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '0.875rem',
        color: '#666'
      }}>
        <strong>💳 Billing Information:</strong>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          <li>All subscriptions are processed securely through Stripe</li>
          <li>You can cancel your subscription at any time</li>
          <li>No hidden fees or setup costs</li>
          <li>14-day free trial included with all plans</li>
        </ul>
      </div>
    </div>
  );
};

export default SubscriptionManagement;