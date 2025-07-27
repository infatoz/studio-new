
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  generateLessonPlan,
  type GenerateLessonPlanOutput,
} from '@/ai/flows/generate-lesson-plan';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Bot, ClipboardList, Clock, Link as LinkIcon, Video, Newspaper, Activity } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const formSchema = z.object({
  topic: z.string().min(3, 'Please enter a topic.'),
  gradeLevel: z.string().min(1, 'Please enter a grade level.'),
  objectives: z.string().min(10, 'Please list at least one objective.'),
});

const resourceIcons = {
  video: <Video className="h-4 w-4 text-red-500" />,
  article: <Newspaper className="h-4 w-4 text-blue-500" />,
  activity: <Activity className="h-4 w-4 text-green-500" />,
};

export default function LessonPlannerPage() {
  const [result, setResult] =
    useState<GenerateLessonPlanOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: 'Photosynthesis',
      gradeLevel: '5th Grade',
      objectives: 'Define photosynthesis, Identify the inputs and outputs of photosynthesis',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await generateLessonPlan(values);
      setResult(response);
       toast({
        title: 'Lesson Plan Generated!',
        description: 'Your new lesson plan is ready.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to generate the lesson plan. The AI agent might have run into an issue. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>AI Lesson Planner</CardTitle>
          <CardDescription>
            Describe your lesson, and the AI agent will search for resources and build a plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., The Water Cycle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 3rd Grade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="objectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning Objectives</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Define evaporation, Describe the stages of the water cycle"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      Separate objectives with a comma.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Building Plan...' : 'Generate Lesson Plan'}
                <ClipboardList className="ml-2" />
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle>Generated Lesson Plan</CardTitle>
          <CardDescription>
            The AI-generated lesson plan will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4 p-4">
              <Skeleton className="h-8 w-3/4" />
              <div className='mt-6 space-y-3'>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          )}
          {result?.lessonPlan ? (
            <div className='space-y-4'>
                <h3 className="text-xl font-semibold tracking-tight">{result.lessonTitle}</h3>
                <Accordion type="single" collapsible className="w-full" defaultValue='item-0'>
                    {result.lessonPlan.map((section, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>
                                <div className='flex items-center gap-4'>
                                    <span className="font-semibold">{section.sectionTitle}</span>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        {section.durationMinutes} min
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="prose prose-sm max-w-none">
                                <p>{section.description}</p>
                                {section.resources && section.resources.length > 0 && (
                                    <div className='mt-4'>
                                        <h4 className='font-semibold mb-2'>Resources:</h4>
                                        <ul className='space-y-2'>
                                            {section.resources.map((resource, r_index) => (
                                                <li key={r_index} className='flex items-center gap-2'>
                                                     {resourceIcons[resource.type]}
                                                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className='text-primary hover:underline'>
                                                        {resource.title}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
          ) : !isLoading && (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 h-full">
              <Bot className="h-12 w-12 mb-4" />
              <p>Your generated lesson plan will be displayed here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
