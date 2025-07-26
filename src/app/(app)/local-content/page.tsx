'use client';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  generateLocalContent,
  type GenerateLocalContentOutput,
} from '@/ai/flows/generate-local-content';
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
import { Bot, Mic, MicOff } from 'lucide-react';

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: 'Marathi',
      request: '',
    },
  });

  useEffect(() => {
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
            // Restart recognition if it stops unexpectedly
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

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Generate Hyper-Local Content</CardTitle>
          <CardDescription>
            Create simple, culturally relevant content in your local language.
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
                {isLoading ? 'Generating...' : 'Generate Content'}
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
      </Card>
    </div>
  );
}
