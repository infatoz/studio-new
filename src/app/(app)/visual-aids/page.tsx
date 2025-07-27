
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters.'),
  subject: z.string().min(2, "Please provide a subject."),
  style: z.string().min(1, "Please select a style."),
});


export default function VisualAidsPage() {
  const [result, setResult] = useState<DesignVisualAidsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      subject: 'Science',
      style: 'Simple Line Drawing',
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
            Describe a visual aid, and the AI will generate a an accurate image for your lesson.
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
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Biology, Physics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Style</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Simple Line Drawing">Simple Line Drawing</SelectItem>
                          <SelectItem value="Diagram/Chart">Diagram/Chart</SelectItem>
                          <SelectItem value="Photorealistic">Photorealistic</SelectItem>
                          <SelectItem value="Cartoon">Cartoon</SelectItem>
                          <SelectItem value="Watercolor">Watercolor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Design Visual Aid'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card className="min-h-[400px] flex flex-col">
        <CardHeader>
          <CardTitle>Generated Visual Aid</CardTitle>
          <CardDescription>The generated image will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          {isLoading && <Skeleton className="h-64 w-full" />}
          {result?.image && (
            <Image
              src={result.image}
              alt="Generated visual aid"
              width={400}
              height={400}
              className="rounded-lg border aspect-square object-contain"
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
