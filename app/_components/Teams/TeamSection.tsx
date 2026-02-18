import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, Twitter } from "lucide-react";
import Link from "next/link";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Card } from "@/components/ui/card";

const members = [
  {
    src: "https://avatars.githubusercontent.com/u/47919550?v=4",
    name: "Maged Salem",
    role: "Founder & CEO",
  },
  {
    src: "https://avatars.githubusercontent.com/u/31113941?v=4",
    name: "Bernard Ngandu",
    role: "Support Team",
  },
  {
    src: "https://avatars.githubusercontent.com/u/68236786?v=4",
    name: "Theo Balick",
    role: "Product Designer",
  },
  {
    src: "https://avatars.githubusercontent.com/u/99137927?v=4",
    name: "Glodie Lukose",
    role: "Shipping Team",
  },
  
];

export default function TeamSection() {
  return (
    <section>
      <div className="py-24">
        <div className="@container mx-auto w-full max-w-6xl px-6">
          <div className="mb-12 mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold md:text-5xl">
              Meet Our Team
            </h2>
            <p className="text-muted-foreground mt-3 text-lg my-4">
              Our talented professionals bring diverse expertise and passion to
              every project.
            </p>
            <Button asChild variant="outline" className="pr-2">
              <Link href="#">
                We're hiring
                <ChevronRight className="opacity-50" />
              </Link>
            </Button>
          </div>

          <Card className="@sm:grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4 grid gap-6 md:gap-y-10 px-16">
            {members.map((member, index) => (
              <HoverCard key={index} openDelay={300}>
                <HoverCardTrigger className="grid cursor-pointer grid-cols-[auto_1fr] items-center gap-2.5">
                  <Avatar className="ring-foreground/10 size-6 border border-transparent shadow ring-1">
                    <AvatarImage src={member.src} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <span className="text-foreground font-medium">
                    {member.name}
                  </span>
                </HoverCardTrigger>

                <HoverCardContent data-theme="mist">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Avatar className="rounded-(--radius) ring-foreground/10 size-10 border border-transparent shadow ring-1">
                        <AvatarImage src={member.src} alt={member.name} />
                        <AvatarFallback className="rounded-(--radius)">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Button variant="ghost" asChild aria-label="X Account">
                        <Link href="https://x.com/MeschacIrung">
                          <Twitter className="fill-muted-foreground stroke-muted-foreground" />
                        </Link>
                      </Button>
                    </div>

                    <div>
                      <span className="text-foreground font-medium">
                        {member.name}
                      </span>
                      <div className="text-muted-foreground text-sm">
                        {member.role}
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </Card>
        </div>
      </div>
    </section>
  );
}
