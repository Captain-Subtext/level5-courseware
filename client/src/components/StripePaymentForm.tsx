import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise, redirectToCheckout } from "@/lib/stripe";
import { createCheckoutSession, createPortalSession } from "@/api/subscription"; // Correct path likely
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"; // Removed AlertCircle
import { useToast } from "@/hooks/use-toast"; // Assuming this path is correct now
import { useAuth } from "@/lib/auth"; // Correct path likely

// REMOVED returnUrl
interface StripePaymentFormProps {
  planId: string;
  buttonText?: string;
  buttonDisabled?: boolean;
  className?: string;
}

export function StripePaymentForm({
  planId,
  // REMOVED returnUrl
  buttonText = "Subscribe",
  buttonDisabled = false,
  className = "",
}: StripePaymentFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      // Redirect to signin if user not logged in
      navigate('/signin?redirect=/account?tab=subscription');
      return;
    }

    try {
      setIsLoading(true);

      // Create a checkout session using the imported API function
      const { sessionId } = await createCheckoutSession(planId);

      // Redirect to the Stripe checkout page
      await redirectToCheckout(sessionId);

    } catch (error) {
      console.error('Error during payment initiation:', error); // More specific log
      // Check if error is an instance of Error before accessing message
      const errorMessage = error instanceof Error ? error.message : "There was a problem initiating your payment. Please try again.";
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // No className prop needed directly on Elements
    <Elements stripe={stripePromise}>
        <Button
          onClick={handleSubscribe}
          disabled={isLoading || buttonDisabled}
          className={`w-full ${className}`} // Apply className to the button
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            buttonText
          )}
        </Button>
    </Elements>
  );
}

export function StripeManageSubscriptionButton({
  className = "",
  buttonText = "Manage Subscription"
}: {
  className?: string;
  buttonText?: string;
}) {
  const { user } = useAuth(); // Get user from auth context
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = async () => {
    if (!user) {
      // Should not happen if button is rendered, but good practice
      navigate('/signin?redirect=/account?tab=subscription');
      return;
    }

    try {
      setIsLoading(true);

      // Create portal session using the imported API function
      // PASS user.id to the API call
      const { url } = await createPortalSession(user.id);

      // Redirect to Stripe Customer Portal
      window.location.href = url;

      // No need to setIsLoading(false) here as the page navigates away
      // If the redirect fails, the finally block will still run

    } catch (error) {
      console.error('Error accessing subscription portal:', error);
      const errorMessage = error instanceof Error ? error.message : "There was a problem accessing your subscription portal. Please try again.";
      toast({
        title: "Access Error",
        description: errorMessage,
        variant: "destructive",
      });
       setIsLoading(false); // Set loading false only if error occurs
    }
    // Remove finally block if not needed after redirect
    /*
    finally {
      setIsLoading(false); // Might cause flicker if redirect is fast
    }
    */
  };

  return (
    <Button
      onClick={handleManageSubscription}
      disabled={isLoading}
      variant="outline" // Keep outline variant for management button
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
}