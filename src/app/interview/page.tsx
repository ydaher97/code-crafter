"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Mic, MicOff, PlayCircle, Send, Settings, AlertCircle, Volume2, VolumeX, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { conductInterviewTurn, type InterviewTurnInput, type ConversationMessage } from "@/ai/flows/interview-flow";

type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Expert";
type ConversationTurn = { speaker: "ai" | "user"; text: string };

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

function InterviewPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [topic, setTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [interviewStarted, setInterviewStarted] = useState<boolean>(false);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [userAnswer, setUserAnswer] = useState<string>("");
  
  const [isLoadingNextQuestion, setIsLoadingNextQuestion] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = useState<boolean>(false);
  const [speechSynthesisAvailable, setSpeechSynthesisAvailable] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const speechSynthesisUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSpeechRecognitionAvailable(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
    setSpeechSynthesisAvailable(!!window.speechSynthesis);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(scrollToBottom, [conversation]);

  const speakText = useCallback((text: string) => {
    if (!speechSynthesisAvailable || !text) return;
    
    window.speechSynthesis.cancel(); // Cancel any previous speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
      toast({ variant: "destructive", title: "Speech Error", description: "Could not play AI response." });
      setIsAiSpeaking(false);
    };
    speechSynthesisUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [speechSynthesisAvailable, toast]);

  const fetchNextAiQuestion = async (currentConversation: ConversationTurn[]) => {
    if (!topic || !difficulty) return;

    setIsLoadingNextQuestion(true);
    setError(null);

    const genkitConversationHistory: ConversationMessage[] = currentConversation.map(turn => ({
        role: turn.speaker === 'ai' ? 'model' : 'user',
        parts: [{ text: turn.text }]
    }));

    const input: InterviewTurnInput = {
      topic,
      difficulty,
      conversationHistory: genkitConversationHistory,
    };

    try {
      const result = await conductInterviewTurn(input);
      const newAiTurn: ConversationTurn = { speaker: "ai", text: result.aiResponseText };
      setConversation(prev => [...prev, newAiTurn]);
      speakText(result.aiResponseText);
    } catch (err: any) {
      console.error("Error getting next AI question:", err);
      const errorMessage = err.message || "Failed to get next question from AI.";
      setError(errorMessage);
      toast({ variant: "destructive", title: "AI Error", description: errorMessage });
      setConversation(prev => [...prev, {speaker: 'ai', text: `(Error: ${errorMessage})`}]);
    } finally {
      setIsLoadingNextQuestion(false);
    }
  };

  const handleStartInterview = () => {
    if (!topic.trim()) {
      toast({ variant: "destructive", title: "Missing Topic", description: "Please enter an interview topic." });
      return;
    }
    if (!difficulty) {
      toast({ variant: "destructive", title: "Missing Difficulty", description: "Please select a difficulty level." });
      return;
    }
    setInterviewStarted(true);
    setConversation([]); // Clear previous conversation
    setUserAnswer("");
    fetchNextAiQuestion([]); // Fetch the first question
  };

  const submitUserResponse = (responseText: string) => {
    if (!responseText.trim()) return;
    const newUserTurn: ConversationTurn = { speaker: "user", text: responseText };
    const updatedConversation = [...conversation, newUserTurn];
    setConversation(updatedConversation);
    setUserAnswer(""); // Clear input
    fetchNextAiQuestion(updatedConversation);
  };

  const handleSendAnswer = () => {
    submitUserResponse(userAnswer);
  };

  const toggleRecording = () => {
    if (!speechRecognitionAvailable) {
      toast({ variant: "destructive", title: "Feature Not Available", description: "Speech recognition is not supported by your browser." });
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => setIsRecording(true);
      recognitionRef.current.onend = () => setIsRecording(false);
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        submitUserResponse(transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        let errorMsg = "Speech recognition error.";
        if (event.error === 'no-speech') errorMsg = "No speech was detected.";
        if (event.error === 'audio-capture') errorMsg = "Microphone problem. Ensure it's enabled.";
        if (event.error === 'not-allowed') errorMsg = "Permission to use microphone was denied.";
        toast({ variant: "destructive", title: "Speech Error", description: errorMsg });
        setIsRecording(false);
      };
      recognitionRef.current.start();
    }
  };

  const replayLastAiQuestion = () => {
    const lastAiMessage = conversation.filter(turn => turn.speaker === 'ai').pop();
    if (lastAiMessage) {
      speakText(lastAiMessage.text);
    } else {
      toast({ title: "Nothing to replay", description: "No AI question found in the current conversation."});
    }
  };
  
  const stopAiSpeaking = () => {
    if (speechSynthesisAvailable) {
        window.speechSynthesis.cancel();
        setIsAiSpeaking(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading interview experience...</p>
      </div>
    );
  }

  const difficultyLevels: Difficulty[] = ["Beginner", "Intermediate", "Advanced", "Expert"];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col">
        {!interviewStarted ? (
          <Card className="w-full max-w-xl mx-auto shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-headline">AI Interview Practice</CardTitle>
              <CardDescription className="text-lg">
                Prepare for your next interview. Enter a topic and select a difficulty.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div>
                <Label htmlFor="interview-topic" className="text-base">Interview Topic</Label>
                <Input
                  id="interview-topic"
                  type="text"
                  placeholder="e.g., JavaScript, System Design, React Hooks"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="mt-1 text-base"
                />
              </div>
              <div>
                <Label className="text-base">Difficulty Level</Label>
                <RadioGroup
                  value={difficulty ?? ""}
                  onValueChange={(value) => setDifficulty(value as Difficulty)}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2"
                >
                  {difficultyLevels.map((level) => (
                    <Label
                      key={level}
                      htmlFor={`difficulty-${level}`}
                      className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors
                        ${difficulty === level ? "border-primary ring-2 ring-primary" : "border-muted"}`}
                    >
                      <RadioGroupItem value={level} id={`difficulty-${level}`} className="sr-only" />
                      <span className="text-sm font-medium">{level}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              <Button
                onClick={handleStartInterview}
                disabled={!topic.trim() || !difficulty || isLoadingNextQuestion}
                className="w-full text-lg py-6 mt-4"
                size="lg"
              >
                {isLoadingNextQuestion ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <PlayCircle className="mr-2 h-5 w-5" />
                )}
                Start Interview
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Interview UI
          <div className="flex flex-col h-[calc(100vh-200px)] max-w-3xl mx-auto w-full">
            <Card className="flex flex-col flex-grow shadow-xl overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-xl flex items-center">
                            <MessageSquare className="mr-2 h-6 w-6 text-primary"/> Interview: {topic}
                        </CardTitle>
                        <CardDescription>Difficulty: {difficulty}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setInterviewStarted(false)}>
                        <Settings className="mr-2 h-4 w-4"/> New Interview
                    </Button>
                </div>
              </CardHeader>
              
              <ScrollArea className="flex-grow p-4 space-y-4" ref={chatContainerRef}>
                {conversation.map((turn, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${turn.speaker === 'ai' ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-xl shadow ${
                        turn.speaker === 'ai'
                          ? 'bg-secondary text-secondary-foreground rounded-bl-none'
                          : 'bg-primary text-primary-foreground rounded-br-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{turn.text}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      {turn.speaker === 'ai' ? 'AI Interviewer' : 'You'}
                    </p>
                  </div>
                ))}
                {isLoadingNextQuestion && (
                    <div className="flex items-center justify-start p-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                        <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                )}
                {error && (
                    <Alert variant="destructive" className="my-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
              </ScrollArea>

              <div className="border-t p-4 bg-muted/30 space-y-3">
                <div className="flex gap-2 items-end">
                  <Textarea
                    placeholder="Type your answer here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isLoadingNextQuestion) handleSendAnswer();
                      }
                    }}
                    className="flex-grow resize-none text-sm"
                    rows={2}
                    disabled={isLoadingNextQuestion || isRecording}
                  />
                  <Button onClick={handleSendAnswer} disabled={isLoadingNextQuestion || isRecording || !userAnswer.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={toggleRecording} 
                            disabled={isLoadingNextQuestion || !speechRecognitionAvailable}
                            title={speechRecognitionAvailable ? (isRecording ? "Stop Recording" : "Start Recording") : "Speech input unavailable"}
                        >
                            {isRecording ? <MicOff className="text-red-500" /> : <Mic />}
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={isAiSpeaking ? stopAiSpeaking : replayLastAiQuestion}
                            disabled={!speechSynthesisAvailable || (!isAiSpeaking && conversation.filter(t => t.speaker === 'ai').length === 0)}
                            title={speechSynthesisAvailable ? (isAiSpeaking ? "Stop Speaking" : "Replay AI Question") : "Speech output unavailable"}
                        >
                            {isAiSpeaking ? <VolumeX className="text-red-500" /> : <Volume2 />}
                        </Button>
                    </div>
                    {!speechRecognitionAvailable && <p className="text-xs text-muted-foreground">Speech input unavailable</p>}
                    {!speechSynthesisAvailable && <p className="text-xs text-muted-foreground ml-2">Speech output unavailable</p>}
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}


export default function InterviewPage() {
  return (
     <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
           <p className="ml-4 text-muted-foreground">Loading AI Interview...</p>
        </main>
        <AppFooter />
      </div>
    }>
      <InterviewPageContent />
    </Suspense>
  )
}