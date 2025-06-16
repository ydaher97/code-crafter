
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Search, Lightbulb, DraftingCompass, ListChecks, Code2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { explainTopic, type TopicExplainerInput, type TopicExplainerOutput } from "@/ai/flows/topic-explainer-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

function ExplainerPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [topic, setTopic] = useState<string>("");
  const [explanationResult, setExplanationResult] = useState<TopicExplainerOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleExplainTopic = async () => {
    if (!topic.trim()) {
      toast({ variant: "destructive", title: "Missing Topic", description: "Please enter a topic to explain." });
      return;
    }
    setIsLoading(true);
    setError(null);
    setExplanationResult(null);

    try {
      const input: TopicExplainerInput = { topic };
      const result = await explainTopic(input);
      setExplanationResult(result);
       toast({ title: "Explanation Ready!", description: `AI has explained "${topic}".` });
    } catch (err: any) {
      console.error("Error getting explanation:", err);
      const errorMessage = err.message || "Failed to get explanation from AI.";
      setError(errorMessage);
      toast({ variant: "destructive", title: "AI Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading AI Explainer...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="w-full max-w-3xl mx-auto shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline flex items-center justify-center">
              <Lightbulb className="mr-3 h-8 w-8 text-primary" /> AI Topic Explainer
            </CardTitle>
            <CardDescription className="text-lg mt-1">
              Enter any programming or software development topic, and our AI will explain it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <div className="w-full sm:flex-grow">
                <Label htmlFor="topic-input" className="text-base">Topic to Explain</Label>
                <Input
                  id="topic-input"
                  type="text"
                  placeholder="e.g., JavaScript Promises, CSS Flexbox, REST APIs"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isLoading}
                  className="mt-1 text-base"
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isLoading && topic.trim()) {
                        handleExplainTopic();
                      }
                    }}
                />
              </div>
              <Button
                onClick={handleExplainTopic}
                disabled={isLoading || !topic.trim()}
                className="w-full sm:w-auto text-base py-2.5 px-6"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Search className="mr-2 h-5 w-5" />
                )}
                Explain
              </Button>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p>AI is preparing your explanation for "{topic}"...</p>
              </div>
            )}

            {error && !isLoading && (
              <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Explanation Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {explanationResult && !isLoading && (
              <ScrollArea className="mt-6 space-y-6 max-h-[calc(100vh-350px)] pr-3">
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-xl font-headline flex items-center">
                      <Lightbulb className="mr-2 h-5 w-5 text-accent" /> Explanation for: {topic}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-base leading-relaxed">{explanationResult.explanation}</p>
                  </CardContent>
                </Card>
                
                {explanationResult.keyConcepts && explanationResult.keyConcepts.length > 0 && (
                    <>
                    <Separator className="my-6"/>
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle className="text-lg font-headline flex items-center">
                                <ListChecks className="mr-2 h-5 w-5 text-accent" /> Key Concepts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5 space-y-1 text-base">
                                {explanationResult.keyConcepts.map((concept, index) => (
                                    <li key={index}>{concept}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                    </>
                )}

                {explanationResult.codeExamples && explanationResult.codeExamples.length > 0 && (
                  <>
                  <Separator className="my-6"/>
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg font-headline flex items-center">
                        <Code2 className="mr-2 h-5 w-5 text-accent" /> Code Examples
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {explanationResult.codeExamples.map((ex, index) => (
                        <div key={index} className="border border-border rounded-md overflow-hidden">
                          {ex.title && <p className="text-sm font-medium bg-border/50 px-3 py-1.5">{ex.title} ({ex.language})</p>}
                          {!ex.title && <p className="text-sm font-medium bg-border/50 px-3 py-1.5">Example ({ex.language})</p>}
                          <pre className="p-3 text-sm font-code bg-card overflow-x-auto"><code>{ex.code}</code></pre>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  </>
                )}

                {explanationResult.diagramDescription && (
                  <>
                  <Separator className="my-6"/>
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg font-headline flex items-center">
                         <DraftingCompass className="mr-2 h-5 w-5 text-accent" /> Diagram Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-base italic text-muted-foreground">{explanationResult.diagramDescription}</p>
                    </CardContent>
                  </Card>
                  </>
                )}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}


export default function ExplainerPage() {
  return (
     <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
           <p className="ml-4 text-muted-foreground">Loading AI Explainer...</p>
        </main>
        <AppFooter />
      </div>
    }>
      <ExplainerPageContent />
    </Suspense>
  )
}
