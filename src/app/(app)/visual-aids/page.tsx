'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  designVisualAids,
  type DesignVisualAidsOutput,
} from '@/ai/flows/design-visual-aids';
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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Bot } from 'lucide-react';

const formSchema = z.object({
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters.'),
});

export default function VisualAidsPage() {
  const [result, setResult] = useState<DesignVisualAidsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await designVisualAids(values);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to design visual aid. Please try again.',
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
          <CardTitle>Design Visual Aids</CardTitle>
          <CardDescription>
            Describe a visual aid, and the AI will generate a simple image for
            your blackboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visual Aid Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., A simple line drawing of the water cycle with labels for evaporation, condensation, and precipitation."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Designing...' : 'Design Visual Aid'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle>Generated Visual Aid</CardTitle>
          <CardDescription>The generated image will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          {isLoading && <Skeleton className="h-64 w-full" />}
          {result?.image && (
            <Image
              src={result.image}
              alt="Generated visual aid"
              width={400}
              height={400}
              className="rounded-lg border"
              data-ai-hint="diagram illustration"
            />
          )}
          {!isLoading && !result && (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
              <Bot className="h-12 w-12 mb-4" />
              <p>Your generated visual will be displayed here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
