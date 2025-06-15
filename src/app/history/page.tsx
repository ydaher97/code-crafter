
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, BookOpen, Code, CalendarDays, ArrowLeft, HistoryIcon, Lightbulb, Search, Filter, FileSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import type { ChallengeHistoryEntry } from "@/app/challenge/page"; 

type DifficultyFilter = "all" | "Beginner" | "Intermediate" | "Advanced";
type StatusFilter = "all" | "passed" | "failed";
type QuestionTypeFilter = "all" | "coding" | "conceptual";


function HistoryPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [historyEntries, setHistoryEntries] = useState<ChallengeHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>("all"); // "all" or specific topic
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<DifficultyFilter>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<StatusFilter>("all");
  const [selectedQuestionTypeFilter, setSelectedQuestionTypeFilter] = useState<QuestionTypeFilter>("all");

  const [availableTopics, setAvailableTopics] = useState<string[]>(["all"]);


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
          const topicsSet = new Set<string>();
          querySnapshot.forEach((doc) => {
            const entryData = doc.data() as Omit<ChallengeHistoryEntry, 'id'>; // Type assertion
            entries.push({ id: doc.id, ...entryData });
            if (entryData.topic) { // Ensure topic is not null/undefined
                topicsSet.add(entryData.topic);
            }
          });
          setHistoryEntries(entries);
          setAvailableTopics(["all", ...Array.from(topicsSet).sort()]);

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

  const filteredAndSearchedEntries = useMemo(() => {
    return historyEntries.filter(entry => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm.trim() || (
        entry.topic?.toLowerCase().includes(searchLower) ||
        entry.question?.toLowerCase().includes(searchLower) ||
        entry.userSolution?.toLowerCase().includes(searchLower)
      );

      const matchesTopic = selectedTopicFilter === "all" || entry.topic === selectedTopicFilter;
      const matchesDifficulty = selectedDifficultyFilter === "all" || entry.difficulty === selectedDifficultyFilter;
      const matchesStatus = selectedStatusFilter === "all" || 
                            (selectedStatusFilter === "passed" && entry.gradingResult.passed) || 
                            (selectedStatusFilter === "failed" && !entry.gradingResult.passed);
      const matchesQuestionType = selectedQuestionTypeFilter === "all" || entry.questionType === selectedQuestionTypeFilter;

      return matchesSearch && matchesTopic && matchesDifficulty && matchesStatus && matchesQuestionType;
    });
  }, [historyEntries, searchTerm, selectedTopicFilter, selectedDifficultyFilter, selectedStatusFilter, selectedQuestionTypeFilter]);


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
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-headline flex items-center">
            <HistoryIcon className="mr-3 h-8 w-8 text-primary" /> Your Challenge History
          </h1>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Filters and Search Section */}
        <Card className="p-4 sm:p-6 shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5">
              <Label htmlFor="search-history" className="text-sm font-medium">Search History</Label>
              <div className="relative mt-1">
                <Input
                  id="search-history"
                  type="text"
                  placeholder="Search by topic, question, or your solution..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-base"
                />
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div>
              <Label htmlFor="topic-filter" className="text-sm font-medium">Topic</Label>
              <Select value={selectedTopicFilter} onValueChange={setSelectedTopicFilter}>
                <SelectTrigger id="topic-filter" className="mt-1">
                  <SelectValue placeholder="Filter by topic" />
                </SelectTrigger>
                <SelectContent>
                  {availableTopics.map(topic => (
                    <SelectItem key={topic} value={topic}>
                      {topic === "all" ? "All Topics" : topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty-filter" className="text-sm font-medium">Difficulty</Label>
              <Select value={selectedDifficultyFilter} onValueChange={(value) => setSelectedDifficultyFilter(value as DifficultyFilter)}>
                <SelectTrigger id="difficulty-filter" className="mt-1">
                  <SelectValue placeholder="Filter by difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
              <Select value={selectedStatusFilter} onValueChange={(value) => setSelectedStatusFilter(value as StatusFilter)}>
                <SelectTrigger id="status-filter" className="mt-1">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="questionType-filter" className="text-sm font-medium">Question Type</Label>
              <Select value={selectedQuestionTypeFilter} onValueChange={(value) => setSelectedQuestionTypeFilter(value as QuestionTypeFilter)}>
                <SelectTrigger id="questionType-filter" className="mt-1">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="conceptual">Conceptual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>


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
                <FileSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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

        {!isLoadingHistory && !error && filteredAndSearchedEntries.length === 0 && historyEntries.length > 0 && (
          <Card className="text-center py-10">
             <CardHeader>
                <FileSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="text-2xl">No Matching Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No history entries match your current search and filter criteria.
              </p>
              <p className="text-muted-foreground">
                Try adjusting your filters or search term.
              </p>
            </CardContent>
          </Card>
        )}


        {!isLoadingHistory && !error && filteredAndSearchedEntries.length > 0 && (
          <div className="space-y-6">
            {filteredAndSearchedEntries.map((entry) => (
              <Card key={entry.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex-grow">
                      <CardTitle className="font-headline text-xl">{entry.topic}</CardTitle>
                      <CardDescription className="flex items-center text-sm mt-1">
                        <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                        Completed: {formatDate(entry.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-start sm:justify-end items-center self-start sm:self-center">
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

