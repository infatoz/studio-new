
'use client';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  generateInteractiveStory,
  type GenerateInteractiveStoryOutput,
} from '@/ai/flows/generate-interactive-story';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Bot, Play, Send, Sparkles, StopCircle, BookOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  topic: z.string().min(3, 'Please enter a topic for the story.'),
  language: z.string().min(2, 'Please specify a language.').default('English'),
});

const suggestionSchema = z.object({
    suggestion: z.string().min(3, 'Suggestion is too short.'),
});

export default function InteractiveStoryPage() {
  const [storyHistory, setStoryHistory] = useState<GenerateInteractiveStoryOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStoryStarted, setIsStoryStarted] = useState(false);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      language: 'English',
    },
  });

  const suggestionForm = useForm<z.infer<typeof suggestionSchema>>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      suggestion: '',
    },
  });

  useEffect(() => {
    if (storyHistory.length > 0 && audioRef.current) {
        const lastSegment = storyHistory[storyHistory.length - 1];
        if(lastSegment.audioDataUri) {
            audioRef.current.src = lastSegment.audioDataUri;
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        }
    }
  }, [storyHistory]);

  async function handleInitialSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setStoryHistory([]);
    try {
      const response = await generateInteractiveStory(values);
      setStoryHistory([response]);
      setIsStoryStarted(true);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to start the story. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSuggestionSubmit(values: z.infer<typeof suggestionSchema>) {
    setIsLoading(true);
    try {
        const fullContext = storyHistory.map(s => s.storySegment).join(' ');
        const response = await generateInteractiveStory({
            ...form.getValues(),
            previousContext: fullContext,
            studentSuggestion: values.suggestion,
        });
        setStoryHistory(prev => [...prev, response]);
        suggestionForm.reset();
    } catch (error) {
        console.error(error);
        toast({
            title: 'Error',
            description: 'Failed to continue the story. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  }

  const resetStory = () => {
    setIsStoryStarted(false);
    setStoryHistory([]);
    form.reset();
  }


  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
        {/* Story Display */}
        <div className="md:col-span-2">
            <Card className="min-h-[600px] flex flex-col">
                <CardHeader>
                <div className='flex justify-between items-center'>
                    <div>
                        <CardTitle>Interactive Storyteller</CardTitle>
                        <CardDescription>
                            {isStoryStarted ? `A story about "${form.getValues('topic')}"` : "Your collaborative story will appear here."}
                        </CardDescription>
                    </div>
                     {storyHistory.length > 0 && (
                        <audio ref={audioRef} controls className="h-10" />
                    )}
                </div>
                </CardHeader>
                <CardContent className='flex-1'>
                    <ScrollArea className='h-[450px] p-4 border rounded-md bg-background'>
                        {isLoading && storyHistory.length === 0 && (
                             <div className="space-y-4 p-4">
                                <Skeleton className="h-8 w-1/3" />
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-5/6" />
                             </div>
                        )}
                        {storyHistory.length > 0 ? (
                             <div className="prose prose-sm max-w-none">
                                {storyHistory.map((segment, index) => (
                                    <p key={index}>{segment.storySegment}</p>
                                ))}
                                {isLoading && <Skeleton className="h-6 w-1/2 mt-4" />}
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full">
                                <BookOpen className="h-16 w-16 mb-4" />
                                <p className='text-lg'>Let's create a story together!</p>
                                <p>Use the panel on the right to start.</p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
                {isStoryStarted && (
                     <CardFooter>
                         <Form {...suggestionForm}>
                            <form onSubmit={suggestionForm.handleSubmit(handleSuggestionSubmit)} className="w-full flex items-start gap-2">
                                <FormField
                                    control={suggestionForm.control}
                                    name="suggestion"
                                    render={({ field }) => (
                                        <FormItem className='flex-1'>
                                            <FormControl>
                                                <Textarea placeholder="What should happen next?" {...field} rows={1} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isLoading} size="icon">
                                    <Send />
                                    <span className="sr-only">Send Suggestion</span>
                                </Button>
                            </form>
                         </Form>
                     </CardFooter>
                )}
            </Card>
        </div>

        {/* Controls */}
        <div className="space-y-4">
            <Card>
                <CardHeader>
                <CardTitle>Story Controls</CardTitle>
                <CardDescription>
                    Start a new story or reset the current one.
                </CardDescription>
                </CardHeader>
                <CardContent>
                {!isStoryStarted ? (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleInitialSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="topic"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Story Topic</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., A brave mouse on a big adventure" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="language"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Language</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., English" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading} className='w-full'>
                                {isLoading ? 'Starting...' : 'Start Story'}
                                <Sparkles className='ml-2' />
                            </Button>
                        </form>
                    </Form>
                ) : (
                    <Button onClick={resetStory} variant="outline" className='w-full'>
                        <StopCircle className='mr-2' />
                        End Story & Start Over
                    </Button>
                )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
