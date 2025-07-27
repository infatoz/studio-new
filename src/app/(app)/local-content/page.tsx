
'use client';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  type GenerateLocalContentOutput,
} from '@/ai/flows/generate-local-content';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Bot, GraduationCap, Mic, MicOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';

// Simulated generateLocalContent function
async function generateLocalContent(
  _values: z.infer<typeof formSchema>
): Promise<GenerateLocalContentOutput> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        content: `This is a simulated story in ${_values.language} about local farmers and soil types. It is designed to be culturally relevant and engaging for students in a multi-grade classroom. The story explains concepts simply, making it easy to understand.`,
      });
    }, 1500);
  });
}


const indianLanguages = [
  'Assamese', 'Bengali', 'Bodo', 'Dogri', 'English', 'Gujarati', 'Hindi',
  'Kannada', 'Kashmiri', 'Konkani', 'Maithili', 'Malayalam',
  'Manipuri', 'Marathi', 'Nepali', 'Odia', 'Punjabi', 'Sanskrit',
  'Santali', 'Sindhi', 'Tamil', 'Telugu', 'Urdu'
];

const formSchema = z.object({
  language: z.string().min(1, 'Please select a language.'),
  request: z
    .string()
    .min(20, 'Request must be at least 20 characters long to provide enough context.')
    .max(500, 'Request must be 500 characters or less.'),
});

export default function LocalContentPage() {
  const [result, setResult] = useState<GenerateLocalContentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const { user } = useAuth();
  const isGuest = user?.isAnonymous ?? true;

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [isClassroomOpen, setIsClassroomOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: 'Marathi',
      request: '',
    },
  });

  useEffect(() => {
    // Mock Speech Recognition
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      const mockSpeechRecognition = function() {
        let onresult: (event: any) => void = () => {};
        let onerror: (event: any) => void = () => {};
        let onend: () => void = () => {};

        return {
            start: () => { 
                console.log("Mock Speech Recognition Started");
                // Simulate a result
                 setTimeout(() => onresult({
                    resultIndex: 0,
                    results: [{
                        isFinal: true,
                        0: { transcript: 'This is a simulated voice input.' }
                    }]
                 }), 1000);
            },
            stop: () => {
                console.log("Mock Speech Recognition Stopped");
                setTimeout(() => onend(), 500);
            },
            set onresult(fn: any) { onresult = fn },
            set onerror(fn: any) { onerror = fn },
            set onend(fn: any) { onend = fn },
            continuous: false,
            interimResults: false,
            lang: ''
        }
      };
      (window as any).SpeechRecognition = mockSpeechRecognition;
      (window as any).webkitSpeechRecognition = mockSpeechRecognition;
    }


    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = form.getValues('request');
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + '. ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        form.setValue('request', finalTranscript + interimTranscript, { shouldValidate: true });
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast({
          title: 'Speech Recognition Error',
          description: `An error occurred: ${event.error}. Please try again.`,
          variant: 'destructive',
        });
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        if(isRecording) {
            recognitionRef.current.start();
        }
      };

    } else {
        toast({
            title: 'Browser Not Supported',
            description: 'Speech recognition is not supported in your browser.',
            variant: 'destructive'
        })
    }

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
  }, [form, toast, isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await generateLocalContent(values);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to generate content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleFetchCourses = async () => {
    // Simulate fetching courses
    toast({ title: "Fetching your Google Classroom courses..." });
    setIsClassroomOpen(true);
    setTimeout(() => {
        setCourses([
            { id: 'course1', name: 'Simulated Class 101', section: 'Science' },
            { id: 'course2', name: 'Simulated Class 202', section: 'History' },
            { id: 'course3', name: 'Simulated Class 303', section: 'Math' },
        ]);
    }, 1000);
  };

  const handlePostToClassroom = async () => {
    if (!selectedCourse || !result?.content) return;
    
    setIsPosting(true);
    toast({ title: "Posting to Classroom...", description: `Sharing content with '${courses.find(c => c.id === selectedCourse)?.name}'.` });

    // Simulate posting
    setTimeout(() => {
        toast({
            title: 'Success! (Simulated)',
            description: 'Content posted to your Google Classroom.',
        });
        setIsPosting(false);
        setIsClassroomOpen(false);
    }, 2000);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Generate Hyper-Local Content</CardTitle>
          <CardDescription>
            Create simple, culturally relevant content in your local language. (Simulated)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {indianLanguages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the language for the content.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="request"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Request</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder="e.g., Create a story about farmers to explain different soil types"
                          rows={5}
                          {...field}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant={isRecording ? 'destructive' : 'outline'}
                          onClick={toggleRecording}
                          className="absolute bottom-2 right-2"
                        >
                          {isRecording ? <MicOff /> : <Mic />}
                          <span className="sr-only">{isRecording ? 'Stop recording' : 'Start recording'}</span>
                        </Button>
                      </div>
                    </FormControl>
                     <FormDescription>
                      Describe the content you need, or use the mic to speak your request.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Simulating...' : 'Generate Content'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle>Generated Content</CardTitle>
          <CardDescription>
            Your hyper-local content will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}
          {result && (
            <div className="prose prose-sm max-w-none p-4 border rounded-md h-96 overflow-auto bg-background">
              <pre className="whitespace-pre-wrap font-body">
                {result.content}
              </pre>
            </div>
          )}
           {!isLoading && !result && (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
              <Bot className="h-12 w-12 mb-4" />
              <p>Your generated content will be displayed here.</p>
            </div>
          )}
        </CardContent>
        {result && !isGuest && (
            <CardFooter>
                <Dialog open={isClassroomOpen} onOpenChange={setIsClassroomOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleFetchCourses} className='w-full'>
                            <GraduationCap className='mr-2' />
                            Send to Google Classroom
                        </Button>
                    </DialogTrigger>
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
                                                <p className="text-xs text-muted-foreground">{course.section}</p>
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
                                <p>No active courses found.</p>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

