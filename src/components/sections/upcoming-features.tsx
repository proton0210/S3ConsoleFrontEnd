"use client";

import Section from "@/components/section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Shield, Database, BarChart3 } from "lucide-react";

const upcomingFeatures = [
  {
    title: "ACL Support",
    description: "Advanced Access Control Lists for fine-grained permissions management on your S3 resources",
    icon: Shield,
  },
  {
    title: "Storage Classes",
    description: "Manage and optimize your S3 storage costs with intelligent storage class transitions",
    icon: Database,
  },
  {
    title: "Metrics Support",
    description: "Monitor bucket usage, request patterns, and performance metrics with detailed analytics",
    icon: BarChart3,
  },
];

export default function UpcomingFeatures() {
  return (
    <Section id="upcoming-features">
      <div className="mx-auto text-center mb-10 max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-semibold mb-3">
          Upcoming Features
        </h2>
        <p className="text-muted-foreground">
          We're constantly working to improve your S3 management experience. Here's what's coming next.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {upcomingFeatures.map((feature, index) => (
          <Card key={index} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Coming Soon
              </span>
            </div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}