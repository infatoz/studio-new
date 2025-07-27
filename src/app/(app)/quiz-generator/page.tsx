
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Bot, FileQuestion, Send } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';


const formSchema = z.object({
  topic: z.string().min(3, 'Please enter a topic.'),
  numQuestions: z.number().min(1).max(10),
  language: z.string().min(2, 'Please specify a language.').default('English'),
});


export default function QuizGeneratorPage() {
  const [result, setResult] =
    useState<GenerateQuizOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClassroomOpen, setIsClassroomOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [contentToPost, setContentToPost] = useState('');

  const { toast } = useToast();
  const { user, getAccessToken } = useAuth();
  const isGuest = user?.isAnonymous ?? true;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      numQuestions: 5,
      language: 'English',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isGuest) {
        toast({ title: 'Feature Unavailable', description: 'Please sign in with Google to create quizzes.', variant: 'destructive'});
        return;
    }
    
    setIsLoading(true);
    setResult(null);
    try {
      const accessToken = await getAccessToken('https://www.googleapis.com/auth/forms.body');
       if (!accessToken) {
          throw new Error('Could not get access token.');
        }

      const response = await generateQuiz({ ...values, accessToken });
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to generate quiz. Please ensure you have granted permissions and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleFetchCourses = async (content: string) => {
    setContentToPost(content);
    setIsClassroomOpen(true);
    if (courses.length > 0) return;
    
    toast({ title: "Fetching your Google Classroom courses..." });
    // Simulate fetching courses
    setTimeout(() => {
        setCourses([
            { id: 'course1', name: 'Simulated Class 101', section: 'Science' },
            { id: 'course2', name: 'Simulated Class 202', section: 'History' },
            { id: 'course3', name: 'Simulated Class 303', section: 'Math' },
        ]);
    }, 1000);
  };
  
  const handlePostToClassroom = async () => {
    if (!selectedCourse || !contentToPost) return;
    
    setIsPosting(true);
    toast({ title: "Posting to Classroom...", description: `Sharing content with '${courses.find(c => c.id === selectedCourse)?.name}'.` });

    setTimeout(() => {
        toast({
            title: 'Success! (Simulated)',
            description: 'Content posted to your Google Classroom.',
        });
        setIsPosting(false);
        setIsClassroomOpen(false);
        setSelectedCourse('');
        setContentToPost('');
    }, 2000);
  };

  const handleShareQuiz = (url: string) => {
    const shareContent = `I've created a quiz for you. Please complete it here: ${url}`;
    handleFetchCourses(shareContent);
  }

  return (
    <>
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Quiz Generator</CardTitle>
          <CardDescription>
            Generate a multiple-choice quiz on any topic and get a shareable Google Form link.
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
                      <Input placeholder="e.g., The Water Cycle, The Solar System" {...field} />
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
                      <Input placeholder="e.g., English, Spanish, Hindi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="numQuestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions: {field.value}</FormLabel>
                    <FormControl>
                        <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate Quiz'}
                <FileQuestion className='ml-2' />
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card className="min-h-[400px]">
            <CardHeader>
            <CardTitle>Generated Quiz</CardTitle>
            <CardDescription>
                Your generated quiz content and Google Form link will appear here.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading && (
                <div className="space-y-4 p-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-40 w-full" />
                </div>
            )}
            {result?.quizContent && (
                <div className='space-y-4'>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quiz Content</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className='h-60 p-4 border rounded-md bg-background'>
                                <pre className="whitespace-pre-wrap font-body">
                                {result.quizContent}
                                </pre>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Google Form Link</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input readOnly value={result.formUrl} />
                        </CardContent>
                        {!isGuest && (
                         <CardFooter>
                            <Button onClick={() => handleShareQuiz(result.formUrl)} disabled={isPosting} className='w-full'>
                                <Send className='mr-2' />
                                Send to Classroom
                            </Button>
                        </CardFooter>
                        )}
                    </Card>
                </div>
            )}
            {!isLoading && !result && (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                <Bot className="h-12 w-12 mb-4" />
                <p>Your generated quiz will be displayed here.</p>
                </div>
            )}
            </CardContent>
        </Card>
      </div>

    </div>
    {!isGuest && (
        <Dialog open={isClassroomOpen} onOpenChange={setIsClassroomOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send to Google Classroom</DialogTitle>
                    <DialogDescription>
                        Select a course to post this content as an announcement.
                    </DialogDescription>
                </DialogHeader>
                {courses.length > 0 ? (
                    <div className="space-y-4">
                        <ScrollArea className="h-64">
                            <RadioGroup onValueChange={setSelectedCourse} value={selectedCourse} className='p-1'>
                            {courses.map((course) => (
                                <div key={course.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                                    <RadioGroupItem value={course.id} id={course.id} />
                                    <FormLabel htmlFor={course.id} className="font-normal flex-1 cursor-pointer">
                                        {course.name}
                                        <p className="text-xs text-muted-foreground">{course.section || 'No section'}</p>
                                    </FormLabel>
                                </div>
                            ))}
                            </RadioGroup>
                        </ScrollArea>
                        <Button onClick={handlePostToClassroom} disabled={!selectedCourse || isPosting} className="w-full">
                            {isPosting ? 'Posting...' : 'Post to Classroom'}
                        </Button>
                    </div>
                ) : (
                     <div className='text-center text-muted-foreground p-8'>
                        <p>No active courses found, or still loading...</p>
                        <Button onClick={() => handleFetchCourses(contentToPost)} variant="link">Refresh courses</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )}
    </>
  );
}
