'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createDifferentiatedMaterials,
  type CreateDifferentiatedMaterialsOutput,
} from '@/ai/flows/create-differentiated-materials';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, UploadCloud } from 'lucide-react';

const formSchema = z.object({
  textbookPageImage: z.string().min(1, 'Please upload an image.'),
  gradeLevels: z
    .string()
    .min(1, 'Please enter at least one grade level.')
    .regex(/^[0-9, ]+$/, 'Please enter comma-separated grade numbers.'),
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export default function DifferentiatedMaterialsPage() {
  const [result, setResult] =
    useState<CreateDifferentiatedMaterialsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      textbookPageImage: '',
      gradeLevels: '',
    },
  });

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      fieldChange(base64);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await createDifferentiatedMaterials(values);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to generate materials. Please try again.',
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
          <CardTitle>Create Differentiated Materials</CardTitle>
          <CardDescription>
            Upload a textbook photo and enter grade levels to get tailored
            worksheets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="textbookPageImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Textbook Page Image</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, field.onChange)}
                          className="pl-12"
                        />
                        <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload a clear photo of the textbook page.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gradeLevels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Levels</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1, 2, 4" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter comma-separated grade levels.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate Worksheets'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle>Generated Worksheets</CardTitle>
          <CardDescription>
            Results will appear here. Select a grade level to view the
            worksheet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}
          {result?.worksheets && result.worksheets.length > 0 && (
            <Tabs defaultValue={result.worksheets[0].gradeLevel}>
              <TabsList>
                {result.worksheets.map((ws) => (
                  <TabsTrigger
                    key={ws.gradeLevel}
                    value={ws.gradeLevel}
                  >
                    Grade {ws.gradeLevel}
                  </TabsTrigger>
                ))}
              </TabsList>
              {result.worksheets.map((ws) => (
                <TabsContent
                  key={ws.gradeLevel}
                  value={ws.gradeLevel}
                >
                  <div className="prose prose-sm max-w-none p-4 border rounded-md h-96 overflow-auto bg-background">
                    <pre className="whitespace-pre-wrap font-body">
                      {ws.worksheetContent}
                    </pre>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
          {!isLoading && !result && (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
              <Bot className="h-12 w-12 mb-4" />
              <p>Your generated materials will be displayed here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
