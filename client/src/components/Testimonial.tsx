
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  avatarSrc?: string;
}

const Testimonial = ({ quote, author, role, avatarSrc }: TestimonialProps) => {
  const initials = author
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center gap-4">
          <Avatar>
            {avatarSrc ? <AvatarImage src={avatarSrc} alt={author} /> : null}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{author}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
        <p className="italic text-muted-foreground">"{quote}"</p>
      </CardContent>
    </Card>
  );
};

export default Testimonial;
