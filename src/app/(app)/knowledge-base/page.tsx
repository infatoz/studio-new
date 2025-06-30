'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  instantKnowledgeBase,
  type InstantKnowledgeBaseOutput,
} from '@/ai/flows/instant-knowledge-base';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Bot } from 'lucide-react';

const formSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters.'),
  localLanguage: z.string().min(2, 'Please enter a language.'),
});

export default function KnowledgeBasePage() {
  const [result, setResult] = useState<InstantKnowledgeBaseOutput | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
      localLanguage: 'English',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await instantKnowledgeBase(values);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to get an explanation. Please try again.',
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
          <CardTitle>Instant Knowledge Base</CardTitle>
          <CardDescription>
            Ask a complex question and get a simple explanation in your local
            language.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student's Question</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='e.g., "Why is the sky blue?"'
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="localLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local Language</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Marathi, Hindi, English" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Get Explanation'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle>AI Explanation</CardTitle>
          <CardDescription>
            The simple explanation will appear here.
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
                {result.explanation}
              </pre>
            </div>
          )}
          {!isLoading && !result && (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
              <Bot className="h-12 w-12 mb-4" />
              <p>Your explanation will be displayed here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
