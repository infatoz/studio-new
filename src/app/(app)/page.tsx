import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowRight,
  BookText,
  GraduationCap,
  Lightbulb,
  Image as ImageIcon,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard | Sahayak AI',
};

const features = [
  {
    icon: BookText,
    title: 'Hyper-Local Content',
    description:
      'Generate culturally relevant stories and examples in local languages to make learning more relatable for your students.',
    href: '/local-content',
    cta: 'Create Content',
  },
  {
    icon: GraduationCap,
    title: 'Differentiated Materials',
    description:
      'Instantly create worksheets tailored to different grade levels from a single textbook page photo, saving you preparation time.',
    href: '/differentiated-materials',
    cta: 'Generate Materials',
  },
  {
    icon: Lightbulb,
    title: 'Instant Knowledge Base',
    description:
      "Get simple, accurate answers to your students' toughest questions, complete with easy-to-understand analogies.",
    href: '/knowledge-base',
    cta: 'Ask a Question',
  },
  {
    icon: ImageIcon,
    title: 'Visual Aids Designer',
    description:
      'Generate simple line drawings and charts to explain complex concepts visually. Perfect for blackboard illustrations.',
    href: '/visual-aids',
    cta: 'Design a Visual',
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, Teacher!
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Sahayak AI is here to help you create engaging and personalized
          learning experiences for your multi-grade classroom.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <CardHeader className="flex flex-row items-start gap-4 pb-4">
              <div className="p-3 rounded-md bg-primary/10 text-primary border border-primary/20">
                <feature.icon className="size-5" />
              </div>
              <div className="flex-1">
                <CardTitle className='text-xl'>{feature.title}</CardTitle>
                <CardDescription className="mt-2 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1" />
            <CardFooter>
              <Button asChild className="w-full" variant="ghost">
                <Link href={feature.href}>
                  {feature.cta} <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
