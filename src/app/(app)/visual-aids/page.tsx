
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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Bot, RefreshCw, Download, Share2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters.'),
  subject: z.string().min(2, "Please provide a subject."),
  style: z.string().min(1, "Please select a style."),
});


const sampleDescriptions: Record<string, Record<string, string[]>> = {
    'Science': {
        'Simple Line Drawing': [
            "A simple line drawing of the water cycle with labels for evaporation, condensation, and precipitation.",
            "A diagram of a plant cell with the main organelles labeled.",
            "A basic illustration of the solar system with planets orbiting the sun."
        ],
        'Diagram/Chart': [
            "A chart showing the different states of matter: solid, liquid, and gas.",
            "A diagram explaining the process of photosynthesis.",
            "A food web diagram for a forest ecosystem."
        ],
        'Photorealistic': [
            "A photorealistic image of a human heart showing all four chambers.",
            "A detailed, realistic image of the surface of Mars.",
            "A photorealistic close-up of a honeybee on a flower."
        ],
        'Cartoon': [
            "A fun cartoon character representing an atom, with electrons orbiting a nucleus.",
            "A cartoon strip explaining Newton's laws of motion with funny characters.",
            "A cartoon showing friendly dinosaurs to explain different eras."
        ],
        'Watercolor': [
            "A watercolor painting of different types of clouds (cumulus, stratus, cirrus).",
            "A beautiful watercolor illustration of the layers of the Earth.",
            "A watercolor artwork showing the life cycle of a butterfly."
        ]
    },
    'History': {
        'Simple Line Drawing': [
            "A simple line map of ancient Egypt showing the Nile river.",
            "A drawing of a Roman aqueduct.",
            "A simple sketch of a medieval castle with its main parts labeled."
        ],
        'Diagram/Chart': [
            "A timeline of the major events of World War II.",
            "A family tree of the Tudor dynasty.",
            "A chart comparing the governments of ancient Athens and Sparta."
        ],
        'Photorealistic': [
            "A realistic portrait of Abraham Lincoln.",
            "A photorealistic depiction of the signing of the Declaration of Independence.",
            "A realistic image of a Viking longship at sea."
        ],
         'Cartoon': [
            "A cartoon character of a Roman soldier explaining his gear.",
            "A funny comic strip about the Trojan Horse.",
            "A cartoon map showing the routes of famous explorers."
        ],
         'Watercolor': [
            "A watercolor painting of the construction of the Great Wall of China.",
            "A watercolor scene of a market in ancient Rome.",
            "A watercolor painting of the Mayflower arriving in America."
        ]
    }
};

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

  const handleGenerateSampleDescription = () => {
    const subject = form.getValues('subject') || 'Science';
    const style = form.getValues('style') || 'Simple Line Drawing';

    const descriptions = sampleDescriptions[subject]?.[style] || sampleDescriptions['Science']['Simple Line Drawing'];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    form.setValue('description', randomDescription, { shouldValidate: true });
  }

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

  const handleDownload = () => {
    if (!result?.image) return;
    const link = document.createElement('a');
    link.href = result.image;
    link.download = 'sahayak-ai-visual-aid.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!result?.image) return;

    try {
      // Convert data URI to blob
      const response = await fetch(result.image);
      const blob = await response.blob();
      const file = new File([blob], 'sahayak-ai-visual-aid.png', { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Visual Aid',
          text: 'Check out this visual aid generated by Sahayak AI.',
        });
      } else {
         toast({
          title: 'Sharing Not Supported',
          description: "Your browser doesn't support sharing files.",
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error sharing:', error);
       toast({
        title: 'Error',
        description: 'Could not share the image.',
        variant: 'destructive'
      })
    }
  };

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
                    <div className='flex items-center justify-between'>
                      <FormLabel>Visual Aid Description</FormLabel>
                      <Button variant="ghost" size="icon" type="button" onClick={handleGenerateSampleDescription} className='h-6 w-6'>
                        <RefreshCw className='h-4 w-4' />
                        <span className="sr-only">Generate Sample Description</span>
                      </Button>
                    </div>
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
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="History">History</SelectItem>
                          <SelectItem value="Math">Math</SelectItem>
                          <SelectItem value="Geography">Geography</SelectItem>
                          <SelectItem value="Art">Art</SelectItem>
                        </SelectContent>
                      </Select>
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
        {result?.image && (
          <CardFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button onClick={handleDownload} variant="secondary" className="w-full">
              <Download className="mr-2" />
              Download
            </Button>
            <Button onClick={handleShare} className="w-full">
              <Share2 className="mr-2" />
              Share
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
