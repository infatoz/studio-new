'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createDifferentiatedMaterials,
  type CreateDifferentiatedMaterialsOutput,
} from '@/ai/flows/create-differentiated-materials';
import {
  createGoogleFormQuiz,
} from '@/ai/flows/create-google-form-quiz';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, FileQuestion, GraduationCap, UploadCloud } from 'lucide-react';
import { getAuth, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';


const grades = [
    { value: '1', label: 'Grade 1' },
    { value: '2', label: 'Grade 2' },
    { value: '3', label: 'Grade 3' },
    { value: '4', label: 'Grade 4' },
    { value: '5', label: 'Grade 5' },
    { value: '6', label: 'Grade 6' },
    { value: '7', label: 'Grade 7' },
    { value: '8', label: 'Grade 8' },
    { value: '9', label: 'Grade 9' },
    { value: '10', label: 'Grade 10' },
    { value: '11', label: 'Grade 11' },
    { value: '12', label: 'Grade 12' },
] as const;


const formSchema = z.object({
  documentContent: z.string().min(1, 'Please upload a file.'),
  gradeLevels: z.array(z.string()).min(1, 'Please select at least one grade level.'),
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type.startsWith('image/')) {
    return fileToBase64(file);
  }
  // For PDF and DOCX, we would ideally extract text.
  // This is a placeholder as frontend text extraction is complex.
  // The Genkit flow is set up to handle a Data URI for images.
  // For now, we will show an error for non-image files.
  if (file.type === 'application/pdf' || file.type.includes('document')) {
      throw new Error("Text extraction from PDF/DOCX is not implemented in this version. Please upload an image.");
  }
  return fileToBase64(file);
}


export default function DifferentiatedMaterialsPage() {
  const [result, setResult] =
    useState<CreateDifferentiatedMaterialsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClassroomOpen, setIsClassroomOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [contentToPost, setContentToPost] = useState('');
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);


  const { toast } = useToast();
  const { user } = useAuth();
  const isGuest = user?.isAnonymous ?? true;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentContent: '',
      gradeLevels: [],
    },
  });

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // This is simplified. Real text extraction would be needed for PDF/DOCX.
        const content = await fileToBase64(file);
        fieldChange(content);
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await createDifferentiatedMaterials({
        ...values,
        gradeLevels: values.gradeLevels.join(', '),
      });
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

  const getAccessToken = async () => {
    if (!user) return null;
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
    provider.addScope('https://www.googleapis.com/auth/classroom.announcements');
    provider.addScope('https://www.googleapis.com/auth/forms.body');


    try {
        const result = await reauthenticateWithPopup(auth.currentUser!, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        return credential?.accessToken;
    } catch (error) {
        console.error('Error getting access token', error);
        toast({
            title: 'Authentication Error',
            description: 'Could not get permission for Google APIs. Please try again.',
            variant: 'destructive',
        });
        return null;
    }
  };

  const handleFetchCourses = async (content: string) => {
    setContentToPost(content);
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    try {
      const response = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      setCourses(data.courses || []);
      setIsClassroomOpen(true);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Google Classroom courses.',
        variant: 'destructive',
      });
    }
  };
  
  const handlePostToClassroom = async () => {
    if (!selectedCourse || !contentToPost) return;
    
    setIsPosting(true);
    const accessToken = await getAccessToken();
    if (!accessToken) {
        setIsPosting(false);
        return;
    };

    try {
        const response = await fetch(`https://classroom.googleapis.com/v1/courses/${selectedCourse}/announcements`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: contentToPost,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to post announcement:', errorData);
            throw new Error('Failed to post announcement');
        }
        toast({
            title: 'Success!',
            description: 'Content posted to your Google Classroom.',
        });
        setIsClassroomOpen(false);
    } catch (error) {
        console.error(error);
        toast({
            title: 'Error',
            description: 'Failed to post to Google Classroom. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsPosting(false);
    }
  };

  const handleCreateQuiz = async (worksheetContent: string) => {
    setIsCreatingQuiz(true);
    toast({ title: 'Quiz Generation Started', description: 'Please wait while we create your Google Form quiz. This may take a moment.' });
    try {
        const accessToken = await getAccessToken();
        if(!accessToken) {
            setIsCreatingQuiz(false);
            return;
        }

        const response = await createGoogleFormQuiz({
            worksheetContent,
            accessToken,
        });

        if (response.formUrl) {
            toast({ 
                title: 'Quiz Created!',
                description: 'Your Google Form quiz has been created successfully.'
            });
            await handleFetchCourses(`I have created a quiz for you. Please complete it here: ${response.formUrl}`);
        } else {
            throw new Error('Failed to get form URL from response.');
        }

    } catch (error) {
        console.error(error);
        toast({
            title: 'Quiz Generation Failed',
            description: 'Could not create the Google Form quiz. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsCreatingQuiz(false);
    }
  }


  return (
    <>
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Create Differentiated Materials</CardTitle>
          <CardDescription>
            Upload a document and select grade levels to get tailored
            worksheets and quizzes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="documentContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document File</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*,application/pdf,.doc,.docx"
                          onChange={(e) => handleFileChange(e, field.onChange)}
                          className="pl-12"
                        />
                        <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload a photo, PDF, or DOCX of the textbook page.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gradeLevels"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Grade Levels</FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                                "w-full justify-between",
                                !field.value?.length && "text-muted-foreground"
                            )}
                            >
                            {field.value?.length > 0
                                ? `${field.value.length} grade(s) selected`
                                : "Select grade levels"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput placeholder="Search grades..." />
                                <CommandList>
                                <CommandEmpty>No grade found.</CommandEmpty>
                                <CommandGroup>
                                    {grades.map((grade) => (
                                    <CommandItem
                                        key={grade.value}
                                        value={grade.label}
                                        onSelect={() => {
                                            const currentValues = field.value || [];
                                            const newValue = currentValues.includes(grade.value)
                                                ? currentValues.filter((v) => v !== grade.value)
                                                : [...currentValues, grade.value];
                                            field.onChange(newValue);
                                        }}
                                    >
                                        <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value?.includes(grade.value)
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                        />
                                        {grade.label}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select one or more grade levels.
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
              <TabsList className="grid w-full grid-cols-3">
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
                  <Card>
                    <CardContent className="prose prose-sm max-w-none p-4 pt-6 border-0 rounded-md h-96 overflow-auto bg-background">
                        <pre className="whitespace-pre-wrap font-body">
                        {ws.worksheetContent}
                        </pre>
                    </CardContent>
                    {!isGuest && (
                    <CardFooter className="flex-col sm:flex-row gap-2 pt-4">
                        <Button onClick={() => handleCreateQuiz(ws.worksheetContent)} disabled={isCreatingQuiz || isPosting} className='w-full'>
                            <FileQuestion className='mr-2'/>
                            {isCreatingQuiz ? 'Creating Quiz...' : 'Create Google Form Quiz'}
                        </Button>
                        <Button onClick={() => handleFetchCourses(ws.worksheetContent)} disabled={isCreatingQuiz || isPosting} variant="secondary" className='w-full'>
                            <GraduationCap className='mr-2' />
                            Send to Classroom
                        </Button>
                    </CardFooter>
                    )}
                  </Card>
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
                        <Button onClick={() => handleFetchCourses(contentToPost)} variant="link">Refresh courses</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )}
    </>
  );
}
