import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useAuth } from '@/lib/auth';
import apiClient from '@/lib/apiClient';

interface StripePaymentFormProps {
  planId: string;
  buttonText?: string;
  buttonDisabled?: boolean;
  className?: string;
}

export function StripePaymentForm({
  planId,
  buttonText = "Choose Plan",
  buttonDisabled = false,
  className = "",
}: StripePaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (!user) {
      setError("Please sign in to subscribe.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/stripe/checkout-session', { 
          planId: planId, 
      }); 

      const { sessionId } = response.data;

      if (!sessionId) {
        throw new Error("Could not create checkout session.");
      }
      
     if (response.data.redirectUrl) {
        window.location.href = response.data.redirectUrl;
     } else {
        throw new Error("Checkout session created, but redirect failed.");
     }

    } catch (err: any) {
      console.error("Stripe checkout error:", err);
      const message = err.message || "There was a problem processing your payment. Please try again.";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Button
        onClick={handleCheckout}
        disabled={isLoading || buttonDisabled}
        className="w-full"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Processing..." : buttonText}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface StripeManageSubscriptionButtonProps {
  className?: string;
}

export function StripeManageSubscriptionButton({ className = "" }: StripeManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/stripe/customer-portal', {});
      const { url } = response.data;

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Could not create customer portal session.");
      }
    } catch (err: any) {
      console.error("Manage subscription error:", err);
      const message = err.message || "Could not open subscription management.";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Button 
        variant="outline" 
        onClick={handleManageSubscription} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Loading Portal..." : "Manage Subscription"}
      </Button>
      {error && (
         <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
