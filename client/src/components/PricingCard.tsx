
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";

interface PricingCardProps {
  price: string;
  features: string[];
  onBuyClick: () => void;
}

const PricingCard = ({ price, features, onBuyClick }: PricingCardProps) => {
  return (
    <Card className="mx-auto w-full max-w-md transition-all hover:shadow-lg sm:mx-0">
      <CardHeader>
        <CardTitle className="text-3xl">{price}</CardTitle>
        <CardDescription>One-time payment, lifetime access</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button size="lg" className="w-full" onClick={onBuyClick}>
          Get Started Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
