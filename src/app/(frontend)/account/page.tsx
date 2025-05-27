'use client'

import { useEffect, useState } from 'react';
import { useUserContext } from '@/context/UserContext';
import { Button } from '@/components/ui/button';

export default function Account() {
  const { currentUser, isLoading: isUserLoading } = useUserContext();
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionInfo = () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    fetch(`/api/revenuecat-customer?app_user_id=${currentUser.id}`)
      .then(async (res) => {
        if (!res.ok) {
          let errorData;
          try {
            errorData = await res.json();
          } catch {
            errorData = { message: await res.text() };
          }
          throw new Error(errorData.error || 'Failed to fetch subscription info');
        }
        return res.json();
      })
      .then((data) => setSubscriptionInfo(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!currentUser || isUserLoading) return;
    fetchSubscriptionInfo();
  }, [currentUser, isUserLoading]);

  if (isUserLoading || loading) return <div>Loading...</div>;
  if (error) return <div className="text-error">Error: {error}</div>;
  if (!currentUser) return <div>Please log in to view your account.</div>;

  if (
    subscriptionInfo &&
    subscriptionInfo.object === 'error' &&
    subscriptionInfo.type === 'resource_missing'
  ) {
    return (
            // Manage subscriptions screen is displayed
      <div>
        <h1>Account</h1>
        <h2>User Info</h2>
        <pre>{JSON.stringify(currentUser, null, 2)}</pre>
        <h2>RevenueCat Subscription Info</h2>
        <div>No subscription found for this user.</div>
      </div>
      
    );
  }

  return (
    <div>
      <h1>Account</h1>
      <Button onClick={fetchSubscriptionInfo}>Refresh Subscription Info</Button>
      <h2>User Info</h2>
      <pre>{JSON.stringify(currentUser, null, 2)}</pre>
      <h2>RevenueCat Subscription Info</h2>
      <pre>{JSON.stringify(subscriptionInfo, null, 2)}</pre>
      {/* Render entitlements, subscriptions, etc. here */}
    </div>
  );
}

