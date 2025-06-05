
"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, User as UserIcon, BarChart2, Activity, TrendingUp, ArrowLeft, Award, Shield, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import type { ChallengeHistoryEntry } from "@/app/challenge/page"; 
import type { UserAchievement } from "@/lib/achievements";
import DynamicLucideIcon from "@/components/dynamic-lucide-icon"; 

interface TopicPerformance {
  name: string;
  attempts: number;
  passed: number;
  passRate: number;
  lastAttempted: Timestamp | null;
}

interface DifficultyPerformance {
  level: "Beginner" | "Intermediate" | "Advanced";
  attempts: number;
  passed: number;
  passRate: number;
}

interface AggregatedStats {
  totalAttempts: number;
  totalPassed: number;
  overallPassRate: number;
  topicPerformance: TopicPerformance[];
  difficultyPerformance: DifficultyPerformance[];
  firstChallengeDate: Timestamp | null;
  lastChallengeDate: Timestamp | null;
}

function calculateAggregatedStats(history: ChallengeHistoryEntry[]): AggregatedStats {
  if (history.length === 0) {
    return {
      totalAttempts: 0,
      totalPassed: 0,
      overallPassRate: 0,
      topicPerformance: [],
      difficultyPerformance: [],
      firstChallengeDate: null,
      lastChallengeDate: null,
    };
  }

  let totalAttempts = 0;
  let totalPassed = 0;
  const topicMap: Map<string, { attempts: number; passed: number; dates: Timestamp[] }> = new Map();
  const difficultyMap: Map<string, { attempts: number; passed: number }> = new Map();
  
  let firstChallengeDate: Timestamp | null = null;
  let lastChallengeDate: Timestamp | null = null;

  history.forEach(entry => {
    totalAttempts++;
    if (entry.gradingResult.passed) {
      totalPassed++;
    }

    if (entry.createdAt) {
        if (!firstChallengeDate || entry.createdAt.toMillis() < firstChallengeDate.toMillis()) {
            firstChallengeDate = entry.createdAt;
        }
        if (!lastChallengeDate || entry.createdAt.toMillis() > lastChallengeDate.toMillis()) {
            lastChallengeDate = entry.createdAt;
        }
    }

    const topicData = topicMap.get(entry.topic) || { attempts: 0, passed: 0, dates: [] };
    topicData.attempts++;
    if (entry.gradingResult.passed) topicData.passed++;
    if (entry.createdAt) topicData.dates.push(entry.createdAt);
    topicMap.set(entry.topic, topicData);

    const diffData = difficultyMap.get(entry.difficulty) || { attempts: 0, passed: 0 };
    diffData.attempts++;
    if (entry.gradingResult.passed) diffData.passed++;
    difficultyMap.set(entry.difficulty, diffData);
  });

  const topicPerformance: TopicPerformance[] = Array.from(topicMap.entries()).map(([name, data]) => ({
    name,
    attempts: data.attempts,
    passed: data.passed,
    passRate: data.attempts > 0 ? Math.round((data.passed / data.attempts) * 100) : 0,
    lastAttempted: data.dates.length > 0 ? data.dates.sort((a,b) => b.toMillis() - a.toMillis())[0] : null,
  })).sort((a,b) => (b.lastAttempted?.toMillis() ?? 0) - (a.lastAttempted?.toMillis() ?? 0));


  const difficultyOrder = ["Beginner", "Intermediate", "Advanced"];
  const difficultyPerformance: DifficultyPerformance[] = difficultyOrder.map(level => {
    const data = difficultyMap.get(level as "Beginner" | "Intermediate" | "Advanced") || { attempts: 0, passed: 0 };
    return {
      level: level as "Beginner" | "Intermediate" | "Advanced",
      attempts: data.attempts,
      passed: data.passed,
      passRate: data.attempts > 0 ? Math.round((data.passed / data.attempts) * 100) : 0,
    };
  });

  return {
    totalAttempts,
    totalPassed,
    overallPassRate: totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0,
    topicPerformance,
    difficultyPerformance,
    firstChallengeDate,
    lastChallengeDate,
  };
}

function ProfilePageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [historyEntries, setHistoryEntries] = useState<ChallengeHistoryEntry[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true); // Combined loading state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoadingData(true);
        setError(null);
        try {
          // Fetch History
          const historyCollectionRef = collection(db, "challengeHistory");
          const historyQuery = query(
            historyCollectionRef,
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
          const historySnapshot = await getDocs(historyQuery);
          const entries: ChallengeHistoryEntry[] = [];
          historySnapshot.forEach((doc) => {
            entries.push({ id: doc.id, ...doc.data() } as ChallengeHistoryEntry);
          });
          setHistoryEntries(entries);

          // Fetch Achievements
          const achievementsCollectionRef = collection(db, "userAchievements");
          const achievementsQuery = query(
            achievementsCollectionRef,
            where("userId", "==", user.uid),
            orderBy("earnedAt", "desc")
          );
          const achievementsSnapshot = await getDocs(achievementsQuery);
          const earnedAchievements: UserAchievement[] = [];
          achievementsSnapshot.forEach((doc) => {
            earnedAchievements.push({ id: doc.id, ...doc.data() } as UserAchievement);
          });
          setAchievements(earnedAchievements);

        } catch (err) {
          console.error("Error fetching profile data:", err);
          setError("Failed to load your profile data. Please try again later.");
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    } else if (!authLoading) {
      setIsLoadingData(false);
    }
  }, [user, authLoading]);

  const aggregatedStats = useMemo(() => calculateAggregatedStats(historyEntries), [historyEntries]);

  const formatDate = (timestamp: Timestamp | undefined | null, options?: Intl.DateTimeFormatOptions) => {
    if (!timestamp) return "N/A";
    const defaultOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return timestamp.toDate().toLocaleDateString('en-US', options || defaultOptions);
  };

  if (authLoading || (!user && isLoadingData)) {
    return (
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading profile...</p>
      </main>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-headline flex items-center">
            <UserIcon className="mr-3 h-8 w-8 text-primary" /> My Profile & Progress
          </h1>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        {isLoadingData && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Analyzing your journey...</p>
          </div>
        )}

        {error && !isLoadingData && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Profile</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoadingData && !error && aggregatedStats.totalAttempts === 0 && achievements.length === 0 && (
          <Card className="text-center py-10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Your Profile is Ready!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                It looks like you haven't attempted any challenges or earned badges yet.
              </p>
              <p className="text-muted-foreground">
                Your progress and stats will appear here once you start learning.
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link href="/">Start a New Challenge</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {!isLoadingData && !error && (aggregatedStats.totalAttempts > 0 || achievements.length > 0) && (
          <div className="space-y-8">
            {/* Achievements Section */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center">
                  <Trophy className="mr-2 h-6 w-6 text-primary" /> My Achievements
                </CardTitle>
                <CardDescription>Badges you've earned on your learning journey.</CardDescription>
              </CardHeader>
              <CardContent>
                {achievements.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {achievements.map(ach => (
                      <div key={ach.id} className="flex flex-col items-center text-center p-4 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow">
                        <DynamicLucideIcon name={ach.iconName} className="h-12 w-12 text-accent mb-2" />
                        <h3 className="font-semibold text-md">{ach.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{ach.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">Earned: {formatDate(ach.earnedAt, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No badges earned yet. Keep practicing!</p>
                )}
              </CardContent>
            </Card>

            {/* Performance Stats Section - only if there are attempts */}
            {aggregatedStats.totalAttempts > 0 && (
              <>
                <Card className="shadow-xl overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="font-headline text-2xl flex items-center">
                      <BarChart2 className="mr-3 h-7 w-7 text-primary" /> Overall Performance
                    </CardTitle>
                    <CardDescription>
                      Since {formatDate(aggregatedStats.firstChallengeDate)} until {formatDate(aggregatedStats.lastChallengeDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center p-4 bg-card rounded-lg shadow-md">
                      <h3 className="text-4xl font-bold text-primary">{aggregatedStats.totalAttempts}</h3>
                      <p className="text-sm text-muted-foreground mt-1">Total Attempts</p>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-card rounded-lg shadow-md">
                      <h3 className="text-4xl font-bold text-green-500">{aggregatedStats.totalPassed}</h3>
                      <p className="text-sm text-muted-foreground mt-1">Challenges Passed</p>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-card rounded-lg shadow-md">
                      <h3 className="text-4xl font-bold text-accent">{aggregatedStats.overallPassRate}%</h3>
                      <p className="text-sm text-muted-foreground mt-1">Overall Pass Rate</p>
                      <Progress value={aggregatedStats.overallPassRate} className="w-full mt-2 h-2.5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center">
                      <Activity className="mr-2 h-6 w-6 text-primary" /> Performance by Topic
                    </CardTitle>
                    <CardDescription>How you're doing in different subject areas.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aggregatedStats.topicPerformance.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Topic</TableHead>
                            <TableHead className="text-center">Attempts</TableHead>
                            <TableHead className="text-center">Passed</TableHead>
                            <TableHead className="text-right">Pass Rate</TableHead>
                            <TableHead className="text-right">Last Attempted</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {aggregatedStats.topicPerformance.map(topic => (
                            <TableRow key={topic.name}>
                              <TableCell className="font-medium">{topic.name}</TableCell>
                              <TableCell className="text-center">{topic.attempts}</TableCell>
                              <TableCell className="text-center text-green-600">{topic.passed}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end">
                                  <span className="mr-2">{topic.passRate}%</span>
                                  <Progress value={topic.passRate} className="w-16 h-2" indicatorClassName={topic.passRate > 70 ? 'bg-green-500' : topic.passRate > 40 ? 'bg-yellow-500' : 'bg-red-500'}/>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground text-xs">{formatDate(topic.lastAttempted, { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No topic-specific data yet.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center">
                      <TrendingUp className="mr-2 h-6 w-6 text-primary" /> Performance by Difficulty
                    </CardTitle>
                    <CardDescription>Your success rate across different challenge levels.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aggregatedStats.difficultyPerformance.some(d => d.attempts > 0) ? (
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Difficulty</TableHead>
                                <TableHead className="text-center">Attempts</TableHead>
                                <TableHead className="text-center">Passed</TableHead>
                                <TableHead className="text-right">Pass Rate</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {aggregatedStats.difficultyPerformance.filter(d => d.attempts > 0).map(diff => (
                                <TableRow key={diff.level}>
                                <TableCell className="font-medium">{diff.level}</TableCell>
                                <TableCell className="text-center">{diff.attempts}</TableCell>
                                <TableCell className="text-center text-green-600">{diff.passed}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end">
                                        <span className="mr-2">{diff.passRate}%</span>
                                        <Progress value={diff.passRate} className="w-16 h-2" indicatorClassName={diff.passRate > 70 ? 'bg-green-500' : diff.passRate > 40 ? 'bg-yellow-500' : 'bg-red-500'}/>
                                    </div>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No difficulty-specific data yet.</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading Profile Page...</p>
        </main>
        <AppFooter />
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
