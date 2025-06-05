
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, BookOpen, Code, CalendarDays, ArrowLeft, HistoryIcon, Lightbulb } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import type { ChallengeHistoryEntry } from "@/app/challenge/page"; 

function HistoryPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [historyEntries, setHistoryEntries] = useState<ChallengeHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        setError(null);
        console.log("[FETCH_HISTORY_ATTEMPT] Fetching history for user:", user.uid);
        try {
          const historyCollectionRef = collection(db, "challengeHistory");
          const q = query(
            historyCollectionRef,
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
          const querySnapshot = await getDocs(q);
          const entries: ChallengeHistoryEntry[] = [];
          querySnapshot.forEach((doc) => {
            console.log("[FETCH_HISTORY_DOC] Fetched doc:", doc.id, "=>", doc.data());
            entries.push({ id: doc.id, ...doc.data() } as ChallengeHistoryEntry);
          });
          setHistoryEntries(entries);
          if (entries.length === 0) {
            console.log("[FETCH_HISTORY_RESULT] No history entries found for this user.");
          } else {
            console.log(`[FETCH_HISTORY_RESULT] Fetched ${entries.length} history entries.`);
          }
        } catch (err) {
          console.error("[FETCH_HISTORY_FIRESTORE_ERROR] Error fetching history from Firestore:", err);
          let errorMessage = "Failed to load your challenge history. Please try again later.";
          if (err instanceof Error && (err.message.toLowerCase().includes("missing or insufficient permissions") || err.message.toLowerCase().includes("permission_denied"))) {
            errorMessage = "History fetch failed due to Firestore permission issues. Please check your security rules.";
          }
          setError(errorMessage);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      fetchHistory();
    } else if (!authLoading) {
        console.log("[FETCH_HISTORY_SKIP] User not logged in or auth still loading, not fetching history yet.");
        if(!user) setIsLoadingHistory(false); 
    }
  }, [user, authLoading]);

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "N/A";
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (authLoading || (!user && !authLoading && isLoadingHistory)) { 
    return (
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading history...</p>
      </main>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-headline flex items-center">
            <HistoryIcon className="mr-3 h-8 w-8 text-primary" /> Your Challenge History
          </h1>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        {isLoadingHistory && ( 
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Fetching your achievements...</p>
          </div>
        )}

        {error && !isLoadingHistory && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading History</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoadingHistory && !error && historyEntries.length === 0 && (
          <Card className="text-center py-10">
            <CardHeader>
              <CardTitle className="text-2xl">No History Yet!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                It looks like you haven't completed any challenges yet.
              </p>
              <p className="text-muted-foreground">
                Head back to the dashboard to start a new one!
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link href="/">Start a New Challenge</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {!isLoadingHistory && !error && historyEntries.length > 0 && (
          <div className="space-y-6">
            {historyEntries.map((entry) => (
              <Card key={entry.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-headline text-xl">{entry.topic}</CardTitle>
                      <CardDescription className="flex items-center text-sm mt-1">
                        <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                        Completed: {formatDate(entry.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                       <Badge variant={entry.gradingResult.passed ? "default" : "destructive"} className={`${entry.gradingResult.passed ? "bg-green-500" : "bg-red-500"} text-white`}>
                        {entry.gradingResult.passed ? "Passed" : "Failed"} (Score: {entry.gradingResult.score}/100)
                      </Badge>
                      <Badge variant="secondary">{entry.difficulty}</Badge>
                      <Badge variant="outline" className="flex items-center">
                        {entry.questionType === "coding" ? (
                           <Code className="mr-1 h-4 w-4"/>
                        ) : (
                           <BookOpen className="mr-1 h-4 w-4"/>
                        )}
                        {entry.questionType.charAt(0).toUpperCase() + entry.questionType.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details">
                      <AccordionTrigger className="text-base">View Details</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-3">
                        <div>
                          <h4 className="font-semibold text-muted-foreground mb-1">Question:</h4>
                          <p className="text-sm bg-muted/30 p-3 rounded-md whitespace-pre-wrap">{entry.question}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-muted-foreground mb-1">Your Solution:</h4>
                          {entry.questionType === "coding" ? (
                            <pre className="bg-muted/50 p-3 rounded-md text-sm overflow-x-auto font-code max-h-80"><code>{entry.userSolution}</code></pre>
                          ) : (
                            <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{entry.userSolution}</p>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-muted-foreground mb-1">AI Feedback:</h4>
                          <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{entry.gradingResult.feedback}</p>
                        </div>
                        {entry.generatedSolution && (
                           <div className="mt-4 pt-4 border-t">
                             <h4 className="font-semibold text-muted-foreground mb-2 flex items-center">
                               <Lightbulb className="mr-2 h-5 w-5 text-accent" /> AI Generated Solution:
                             </h4>
                             <div className="space-y-3">
                               <div>
                                 <h5 className="font-medium text-sm mb-1">Suggested Solution:</h5>
                                 {entry.questionType === 'coding' ? (
                                   <pre className="bg-muted/70 p-3 rounded-md text-sm overflow-x-auto font-code max-h-96"><code>{entry.generatedSolution.solution}</code></pre>
                                 ) : (
                                   <p className="text-sm bg-muted/70 p-3 rounded-md whitespace-pre-wrap">{entry.generatedSolution.solution}</p>
                                 )}
                               </div>
                               <div>
                                 <h5 className="font-medium text-sm mb-1">Explanation:</h5>
                                 <p className="text-sm bg-muted/70 p-3 rounded-md whitespace-pre-wrap">{entry.generatedSolution.explanation}</p>
                               </div>
                             </div>
                           </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}


export default function HistoryPage() {
  return (
     <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
           <p className="ml-4 text-muted-foreground">Loading History Page...</p>
        </main>
        <AppFooter />
      </div>
    }>
      <HistoryPageContent />
    </Suspense>
  )
}

