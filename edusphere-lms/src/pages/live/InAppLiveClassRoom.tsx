import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiVideo, FiArrowLeft, FiMessageSquare, FiThumbsUp, FiSend,
  FiCornerDownRight, FiX, FiCheckCircle, FiAlertCircle, FiRefreshCw,
  FiUsers, FiLogOut,
} from "react-icons/fi";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import {
  liveClassService,
  type BackendLiveClass,
  type BackendLiveClassQA,
  type BackendLiveClassParticipant,
} from "../../services/liveClassService";
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from "../../utils/swalAlerts";
import { supabase } from "../../lib/supabase";
import { LiveKitClassroom } from "./LiveKitClassroom";

export const InAppLiveClassRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();

  const [classData, setClassData] = useState<BackendLiveClass | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | undefined>(undefined);
  const [livekitServerUrl, setLivekitServerUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Q&A State
  const [isQAPanelOpen, setIsQAPanelOpen] = useState(true);
  const [questions, setQuestions] = useState<BackendLiveClassQA[]>([]);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [replyInputText, setReplyInputText] = useState<{ [key: string]: string }>({});
  const [isSubmittingQ, setIsSubmittingQ] = useState(false);

  // Participant Panel State (instructor only)
  const [isParticipantPanelOpen, setIsParticipantPanelOpen] = useState(false);
  const [participants, setParticipants] = useState<BackendLiveClassParticipant[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

  // Session-end notification
  const [sessionEndedMsg, setSessionEndedMsg] = useState<string | null>(null);

  const isInstructor = role === "instructor" || role === "admin";

  const userDisplayName = useMemo(() => {
    return currentUser?.name || (currentUser as any)?.fullName || currentUser?.email || (isInstructor ? "Instructor" : "Student");
  }, [currentUser, isInstructor]);

  const participantLeaveCalledRef = useRef(false);

  // 1. Load class data and LiveKit credentials
  const loadClassData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const joinRes = await liveClassService.joinLiveClass(id);
      if (joinRes.token) {
        setLivekitToken(joinRes.token);
      }
      if (joinRes.serverUrl) {
        setLivekitServerUrl(joinRes.serverUrl);
      }

      let data: BackendLiveClass;
      if (isInstructor) {
        data = await liveClassService.getInstructorLiveClassDetails(id);
      } else {
        data = await liveClassService.getStudentLiveClassDetails(id);
      }
      if (data.status === "Completed") { setErrorMsg("This live class session has ended and can no longer be joined."); return; }
      if (data.status === "Cancelled") { setErrorMsg("This live class session has been cancelled."); return; }
      setClassData(data);
    } catch (err: any) {
      setErrorMsg(err.message || "You are not authorized to join this live classroom");
    } finally {
      setIsLoading(false);
    }
  }, [id, isInstructor]);

  useEffect(() => { loadClassData(); }, [loadClassData]);

  // 2. Record participant join / leave
  useEffect(() => {
    if (!id || isLoading || !classData) return;
    participantLeaveCalledRef.current = false;
    liveClassService.recordParticipantJoin(id);
    return () => {
      if (!participantLeaveCalledRef.current) {
        participantLeaveCalledRef.current = true;
        liveClassService.recordParticipantLeave(id);
      }
    };
  }, [id, isLoading, classData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Q&A initial load + realtime payload-based updates
  const loadQuestions = useCallback(async () => {
    if (!id) return;
    try { const qList = await liveClassService.getQuestions(id); setQuestions(qList); } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    if (!id || isLoading || !classData) return;
    loadQuestions();

    const channel = supabase
      .channel(`live-qa:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_class_qa", filter: `class_id=eq.${id}` }, (payload) => {
        const row = payload.new as any;
        if (!row?.id) { loadQuestions(); return; }
        const newQ: BackendLiveClassQA = {
          id: row.id, liveClassId: row.class_id, studentId: row.student_id,
          studentName: row.student_name || "Student", studentAvatar: row.student_avatar || undefined,
          questionText: row.question_text, likesCount: Number(row.likes_count) || 0,
          isPinned: Boolean(row.is_pinned), isAnswered: Boolean(row.is_answered),
          instructorReply: row.instructor_reply || undefined, instructorReplyAt: row.instructor_reply_at || undefined,
          createdAt: row.created_at, updatedAt: row.updated_at,
        };
        setQuestions((prev) => prev.some((q) => q.id === newQ.id) ? prev : [newQ, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "live_class_qa", filter: `class_id=eq.${id}` }, (payload) => {
        const row = payload.new as any;
        if (!row?.id) { loadQuestions(); return; }
        setQuestions((prev) => prev.map((q) => q.id !== row.id ? q : {
          ...q,
          questionText: row.question_text ?? q.questionText,
          likesCount: Number(row.likes_count) ?? q.likesCount,
          isPinned: Boolean(row.is_pinned), isAnswered: Boolean(row.is_answered),
          instructorReply: row.instructor_reply ?? q.instructorReply,
          instructorReplyAt: row.instructor_reply_at ?? q.instructorReplyAt,
          updatedAt: row.updated_at ?? q.updatedAt,
        }));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "live_class_qa", filter: `class_id=eq.${id}` }, (payload) => {
        const oldId = (payload.old as any)?.id;
        if (oldId) setQuestions((prev) => prev.filter((q) => q.id !== oldId));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, isLoading, classData?.id, loadQuestions]);

  // 4. live_classes realtime - session end notification
  useEffect(() => {
    if (!id || isLoading || !classData) return;
    const sessionChannel = supabase
      .channel(`live-session:${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "live_classes", filter: `id=eq.${id}` }, (payload) => {
        const updated = payload.new as any;
        if (!updated) return;
        if (updated.status === "Completed") {
          setClassData((prev) => prev ? { ...prev, status: "Completed" } : prev);
          if (!isInstructor) setSessionEndedMsg("This live class session has ended by the instructor.");
        }
        if (updated.status === "Cancelled") {
          setClassData((prev) => prev ? { ...prev, status: "Cancelled" } : prev);
          setSessionEndedMsg("This live class session has been cancelled.");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(sessionChannel); };
  }, [id, isLoading, classData?.id, isInstructor]);

  // 5. Participant panel
  const loadParticipants = useCallback(async () => {
    if (!id || !isInstructor) return;
    setIsLoadingParticipants(true);
    try { const list = await liveClassService.getParticipants(id); setParticipants(list); } catch { /* ignore */ }
    finally { setIsLoadingParticipants(false); }
  }, [id, isInstructor]);

  useEffect(() => { if (isParticipantPanelOpen) loadParticipants(); }, [isParticipantPanelOpen, loadParticipants]);

  // 6. Leave room
  const handleLeaveRoom = useCallback(() => {
    if (id && !participantLeaveCalledRef.current) {
      participantLeaveCalledRef.current = true;
      liveClassService.recordParticipantLeave(id);
    }
    navigate(isInstructor ? "/instructor/live" : "/student/live");
  }, [id, isInstructor, navigate]);

  // 7. End session
  const handleEndSession = async () => {
    if (!classData) return;
    const confirmed = await showConfirmAlert("End Live Class Session", "Are you sure you want to end this live session for all students? The class will be marked as Completed and preserved in history.", "End Session", "Cancel", "warning");
    if (confirmed) {
      try {
        await liveClassService.updateLiveClass(classData.id, { status: "Completed" });
        showSuccessAlert("Session Completed", "Live class ended and marked as Completed.");
        handleLeaveRoom();
      } catch (err: any) { showErrorAlert("Error", err.message || "Failed to complete session"); }
    }
  };

  // 8. Student ask question
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newQuestionText.trim()) return;
    setIsSubmittingQ(true);
    try {
      const createdQ = await liveClassService.askQuestion(id, newQuestionText.trim());
      setQuestions((prev) => prev.some((q) => q.id === createdQ.id) ? prev : [createdQ, ...prev]);
      setNewQuestionText("");
    } catch (err: any) { showErrorAlert("Failed to Ask Question", err.message || "Error posting question"); }
    finally { setIsSubmittingQ(false); }
  };

  // 9. Instructor reply
  const handleReplyQuestion = async (qId: string) => {
    if (!id) return;
    const text = replyInputText[qId];
    if (!text?.trim()) return;
    try {
      const updated = await liveClassService.replyToQuestion(id, qId, text.trim());
      setQuestions((prev) => prev.map((q) => (q.id === qId ? updated : q)));
      setReplyInputText((prev) => ({ ...prev, [qId]: "" }));
    } catch (err: any) { showErrorAlert("Reply Failed", err.message || "Failed to post reply"); }
  };

  // 10. Pin/unpin
  const handleTogglePin = async (qId: string) => {
    if (!id) return;
    try {
      const updated = await liveClassService.togglePinQuestion(id, qId);
      setQuestions((prev) => prev.map((q) => (q.id === qId ? updated : q)));
    } catch (err: any) { showErrorAlert("Pin Failed", err.message || "Failed to update pin"); }
  };

  const activeParticipants = participants.filter((p) => p.isActive);

  // ─── Render: Session ended ───
  if (sessionEndedMsg) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <FiCheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Session Ended</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{sessionEndedMsg}</p>
          <Button variant="primary" size="md" onClick={() => navigate("/student/live")} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold">
            <FiArrowLeft className="w-4 h-4 mr-1.5" /> Return to Live Classes
          </Button>
        </div>
      </div>
    );
  }

  // ─── Render: Loading ───
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">Connecting to EduSphere In-App Classroom...</p>
      </div>
    );
  }

  // ─── Render: Error ───
  if (errorMsg || !classData) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <FiAlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{errorMsg || "You do not have active enrollment authorization for this live class session."}</p>
          <Button variant="primary" size="md" onClick={() => navigate(isInstructor ? "/instructor/live" : "/student/live")} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold">
            <FiArrowLeft className="w-4 h-4 mr-1.5" /> Return to Live Classes
          </Button>
        </div>
      </div>
    );
  }

  const roomName = classData.meetingId || `edusphere-${classData.id}`;

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden select-none">

      {/* Top Header */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 shrink-0">
            <FiVideo className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-xs sm:max-w-md">{classData.title}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{classData.courseTitle} &bull; Host: {classData.instructorName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Q&A toggle */}
          <button onClick={() => { setIsQAPanelOpen(!isQAPanelOpen); setIsParticipantPanelOpen(false); }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${isQAPanelOpen ? "bg-purple-600 text-white border-purple-500 shadow-md" : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"}`}
            title="Toggle Live Q&A">
            <FiMessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Q&A</span>
            {questions.length > 0 && <span className="px-1.5 rounded-full text-[10px] bg-purple-900 text-purple-200">{questions.length}</span>}
          </button>

          {/* Participants toggle (instructor only) */}
          {isInstructor && (
            <button onClick={() => { setIsParticipantPanelOpen(!isParticipantPanelOpen); setIsQAPanelOpen(false); if (!isParticipantPanelOpen) loadParticipants(); }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${isParticipantPanelOpen ? "bg-blue-600 text-white border-blue-500 shadow-md" : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"}`}
              title="Toggle Participant List">
              <FiUsers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Participants</span>
              {activeParticipants.length > 0 && <span className="px-1.5 rounded-full text-[10px] bg-blue-900 text-blue-200">{activeParticipants.length}</span>}
            </button>
          )}

          {/* End Session (instructor) */}
          {isInstructor && (
            <button onClick={handleEndSession} className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1" title="End Class for All">
              <FiCheckCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">End Session</span>
            </button>
          )}

          {/* Leave */}
          <button onClick={handleLeaveRoom} className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-md" title="Leave Classroom">
            <FiLogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LiveKit Video Workspace */}
        <div className="flex-1 h-full bg-slate-950 relative overflow-hidden">
          <LiveKitClassroom
            roomName={roomName}
            token={livekitToken}
            serverUrl={livekitServerUrl}
            displayName={userDisplayName}
            isHost={isInstructor}
            onLeave={handleLeaveRoom}
          />
        </div>

        {/* Q&A Panel */}
        {isQAPanelOpen && (
          <aside className="w-80 sm:w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-10">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiMessageSquare className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-white text-xs sm:text-sm">Live Q&A ({questions.length})</h3>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={loadQuestions} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800" title="Refresh Questions"><FiRefreshCw className="w-3.5 h-3.5" /></button>
                <button onClick={() => setIsQAPanelOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"><FiX className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {questions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                  <FiMessageSquare className="w-8 h-8 mx-auto opacity-40 text-purple-400" />
                  <p>No questions posted yet in this live session.</p>
                  {!isInstructor && <p className="text-[11px]">Be the first to ask the instructor below!</p>}
                </div>
              ) : (
                questions.map((q) => (
                  <div key={q.id} className={`p-3 rounded-2xl border text-xs space-y-2 transition-all ${q.isPinned ? "bg-amber-950/40 border-amber-700/60 shadow-xs" : "bg-slate-800/80 border-slate-700/80"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={q.studentAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} alt={q.studentName} className="w-5 h-5 rounded-full object-cover" />
                        <span className="font-bold text-slate-200 text-[11px]">{q.studentName || "Student"}</span>
                        {q.isPinned && <span className="px-1.5 rounded text-[9px] font-black bg-amber-400 text-slate-950 uppercase">Pinned</span>}
                        {q.isAnswered && <span className="px-1.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">Answered</span>}
                      </div>
                      {isInstructor && <button onClick={() => handleTogglePin(q.id)} className="text-[10px] font-bold text-slate-400 hover:text-amber-400">{q.isPinned ? "Unpin" : "Pin"}</button>}
                    </div>
                    <p className="text-slate-200 leading-relaxed font-medium">{q.questionText}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                      <FiThumbsUp className="w-3 h-3 text-purple-400" />
                      <span>{q.likesCount || 0} Helpful</span>
                    </div>
                    {q.instructorReply && (
                      <div className="p-2.5 bg-purple-950/60 border border-purple-800/60 rounded-xl flex items-start gap-2 text-purple-200">
                        <FiCornerDownRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[10px] uppercase text-purple-400 block">Instructor Answer:</span>
                          <p className="text-[11px] leading-relaxed">{q.instructorReply}</p>
                        </div>
                      </div>
                    )}
                    {isInstructor && !q.instructorReply && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <input type="text" placeholder="Type instructor answer..." value={replyInputText[q.id] || ""} onChange={(e) => setReplyInputText((prev) => ({ ...prev, [q.id]: e.target.value }))} className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500" />
                        <button onClick={() => handleReplyQuestion(q.id)} className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg" title="Post Answer"><FiSend className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {!isInstructor && (
              <form onSubmit={handleAskQuestion} className="p-3 border-t border-slate-800 bg-slate-900/90 flex gap-2">
                <input type="text" placeholder="Ask a question to the instructor..." value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} disabled={isSubmittingQ} className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <button type="submit" disabled={isSubmittingQ || !newQuestionText.trim()} className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  <FiSend className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </aside>
        )}

        {/* Participant Panel (Instructor only) */}
        {isInstructor && isParticipantPanelOpen && (
          <aside className="w-72 h-full bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-10">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-xs sm:text-sm">Participants ({participants.length})</h3>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={loadParticipants} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800" title="Refresh" disabled={isLoadingParticipants}>
                  <FiRefreshCw className={`w-3.5 h-3.5 ${isLoadingParticipants ? "animate-spin" : ""}`} />
                </button>
                <button onClick={() => setIsParticipantPanelOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"><FiX className="w-4 h-4" /></button>
              </div>
            </div>
            {activeParticipants.length > 0 && (
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> In Room ({activeParticipants.length})
                </span>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 pt-2">
              {isLoadingParticipants && participants.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading participants...
                </div>
              ) : participants.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs space-y-1">
                  <FiUsers className="w-7 h-7 mx-auto opacity-30 text-blue-400" />
                  <p>No participants recorded yet.</p>
                </div>
              ) : (
                participants.map((p) => (
                  <div key={p.id} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs transition-all ${p.isActive ? "bg-emerald-950/30 border-emerald-800/50" : "bg-slate-800/60 border-slate-700/60 opacity-60"}`}>
                    <div className="relative shrink-0">
                      <img src={p.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} alt={p.userName} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${p.isActive ? "bg-emerald-400" : "bg-slate-500"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-200 text-[11px] block truncate">{p.userName}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{p.role}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      {p.isActive ? <span className="text-[9px] font-bold text-emerald-400 uppercase">In Room</span> : <span className="text-[9px] text-slate-500">Left</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
