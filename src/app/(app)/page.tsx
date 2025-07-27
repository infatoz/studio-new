
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
  BookOpen,
  Bot,
  ClipboardList,
  Flame,
  LineChart,
  Users,
  Clock,
  BookText,
  FileQuestion,
  GraduationCap,
  Lightbulb,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
    title: 'Dashboard | Sahayak AI',
};

const statCards = [
    {
        icon: BookOpen,
        title: "Content Created",
        value: "12",
        change: "+12%",
        changeColor: "text-green-600",
        bgColor: "bg-blue-100",
        iconColor: "text-blue-600",
        description: "Stories, worksheets & more"
    },
    {
        icon: Users,
        title: "Students Helped",
        value: "45",
        change: "+8%",
        changeColor: "text-green-600",
        bgColor: "bg-green-100",
        iconColor: "text-green-600",
        description: "Through assessments"
    },
    {
        icon: LineChart,
        title: "Weekly Growth",
        value: "15%",
        change: "+5%",
        changeColor: "text-green-600",
        bgColor: "bg-purple-100",
        iconColor: "text-purple-600",
        description: "In teaching efficiency"
    },
    {
        icon: Clock,
        title: "Time Saved",
        value: "24h",
        change: "+20%",
        changeColor: "text-green-600",
        bgColor: "bg-orange-100",
        iconColor: "text-orange-600",
        description: "This month"
    }
]

const quickActions = [
  {
    icon: BookText,
    title: 'Create Story',
    description:
      'Generate culturally relevant educational stories.',
    href: '/local-content',
    cta: 'Get Started',
    popular: true,
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: ClipboardList,
    title: 'Plan Lessons',
    description:
      'AI-powered weekly lesson planning.',
    href: '/differentiated-materials',
    cta: 'Get Started',
    popular: false,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: GraduationCap,
    title: 'Assess Reading',
    description:
      "Voice-based reading assessments.",
    href: '/differentiated-materials', // Placeholder link
    cta: 'Get Started',
    popular: true,
    bgColor: "bg-red-100",
    iconColor: "text-red-600",
  },
  {
    icon: Bot,
    title: 'Ask AI',
    description:
      'Get instant concept explanations.',
    href: '/knowledge-base',
    cta: 'Get Started',
    popular: false,
    bgColor: "bg-sky-100",
    iconColor: "text-sky-600",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card className='p-8 bg-card/50'>
        <div className="flex items-center gap-6">
            <div className='p-4 bg-primary/10 rounded-lg'>
                <Sparkles className="size-12 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back!
                </h1>
                <p className="text-muted-foreground mt-1">
                    Ready to create amazing learning experiences?
                </p>
            </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
             <Card key={card.title}>
                 <CardContent className="p-6 flex items-center gap-4">
                     <div className={`p-3 rounded-lg ${card.bgColor}`}>
                         <card.icon className={`size-6 ${card.iconColor}`} />
                     </div>
                     <div className='flex-1'>
                        <p className="text-sm text-muted-foreground">{card.title}</p>
                        <div className="flex items-baseline gap-2">
                             <p className="text-2xl font-bold">{card.value}</p>
                             <span className={`text-sm font-semibold ${card.changeColor}`}>{card.change}</span>
                        </div>
                     </div>
                 </CardContent>
             </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
            <div className='space-y-1'>
                <h2 className="text-2xl font-bold">Quick Actions</h2>
                <p className="text-muted-foreground">Jump into AI-powered teaching tools</p>
            </div>
            <Button variant="link">
                View All Tools <ArrowRight className="ml-2 size-4" />
            </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
            <Card
                key={action.title}
                className="flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5"
            >
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <div className={`p-3 rounded-lg ${action.bgColor}`}>
                            <action.icon className={`size-6 ${action.iconColor}`} />
                         </div>
                         {action.popular && <Badge variant="secondary" className='bg-orange-100 text-orange-600 border-orange-200'>★ Popular</Badge>}
                    </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                    <CardTitle className='text-lg'>{action.title}</CardTitle>
                    <CardDescription className="leading-relaxed">
                    {action.description}
                    </CardDescription>
                </CardContent>
                <CardFooter>
                <Button asChild className="w-full justify-start p-0 h-auto" variant="link">
                    <Link href={action.href}>
                    {action.cta} <ArrowRight className="ml-2 size-4" />
                    </Link>
                </Button>
                </CardFooter>
            </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
