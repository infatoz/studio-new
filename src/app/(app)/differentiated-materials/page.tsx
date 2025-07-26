
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const formSchema = z.object({
  documentContent: z.string().min(1, 'Please upload a file.'),
  gradeLevels: z.string().min(1, 'Please enter at least one grade level.'),
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
      gradeLevels: '',
    },
  });

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const content = await fileToBase64(file);
        fieldChange(content);
      } catch (error: any) {
        toast({ title: 'Error uploading file', description: error.message, variant: 'destructive' });
      }
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await createDifferentiatedMaterials({
        ...values,
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
    if (!user || user.isAnonymous) return null;
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
    setIsClassroomOpen(true);
    if (courses.length > 0) return; // Don't re-fetch if we already have courses

    const accessToken = await getAccessToken();
    if (!accessToken) {
        setIsClassroomOpen(false);
        return;
    }

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
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Google Classroom courses.',
        variant: 'destructive',
      });
      setIsClassroomOpen(false);
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
        setSelectedCourse('');
        setContentToPost('');

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
            // Automatically open the classroom dialog to share the quiz link
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
                  <FormItem>
                    <FormLabel>Grade Levels</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1, 2, 3" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter one or more grade levels, separated by commas.
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
            <Tabs defaultValue={result.worksheets[0].gradeLevel} className="w-full">
              <TabsList className="grid w-full" style={{gridTemplateColumns: `repeat(${result.worksheets.length}, minmax(0, 1fr))`}}>
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
                    <CardContent className="prose prose-sm max-w-none p-4 pt-6 border rounded-md bg-background">
                      <ScrollArea className='h-72'>
                        <pre className="whitespace-pre-wrap font-body">
                        {ws.worksheetContent}
                        </pre>
                      </ScrollArea>
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
