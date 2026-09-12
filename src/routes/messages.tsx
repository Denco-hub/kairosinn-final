import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Chat with Reception — Kairos Inn" },
      { name: "description", content: "Message Kairos Inn reception directly. No account needed." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MessagesPage,
});

type Msg = {
  id: string;
  body: string;
  sender_id: string | null;
  conversation_user_id: string | null;
  guest_session_id: string | null;
  guest_name: string | null;
  created_at: string;
};

const SESSION_KEY = "kairos_guest_session";
const NAME_KEY = "kairos_guest_name";
const PHONE_KEY = "kairos_guest_phone";

function getOrCreateSession() {
  if (typeof window === "undefined") return "";
  let s = localStorage.getItem(SESSION_KEY);
  if (!s) {
    s = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, s);
  }
  return s;
}

function MessagesPage() {
  const [me, setMe] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [thread, setThread] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [introDone, setIntroDone] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = getOrCreateSession();
    setSessionId(s);
    const n = localStorage.getItem(NAME_KEY) ?? "";
    const p = localStorage.getItem(PHONE_KEY) ?? "";
    setName(n);
    setPhone(p);
    if (n && p) setIntroDone(true);

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setMe(data.session.user.id);
    });
  }, []);

  // Load thread
  useEffect(() => {
    if (!sessionId && !me) return;
    (async () => {
      if (me) {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_user_id", me)
          .order("created_at", { ascending: true });
        setThread((data as Msg[]) ?? []);
      } else {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .eq("guest_session_id", sessionId)
          .setHeader("x-guest-session", sessionId)
          .order("created_at", { ascending: true });
        setThread((data as Msg[]) ?? []);
      }
    })();
  }, [sessionId, me]);

  // Realtime
  useEffect(() => {
    if (!sessionId && !me) return;
    const filter = me
      ? `conversation_user_id=eq.${me}`
      : `guest_session_id=eq.${sessionId}`;
    const ch = supabase
      .channel(`msgs-${me ?? sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter },
        (payload) => setThread((prev) => [...prev, payload.new as Msg]),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [me, sessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length]);

  const saveIntro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return toast.error("Please enter your name and phone.");
    localStorage.setItem(NAME_KEY, name.trim());
    localStorage.setItem(PHONE_KEY, phone.trim());
    setIntroDone(true);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    const payload: TablesInsert<"messages"> = me
      ? {
          body: body.trim(),
          sender_id: me,
          conversation_user_id: me,
        }
      : {
          body: body.trim(),
          guest_session_id: sessionId,
          guest_name: name.trim(),
          guest_phone: phone.trim(),
        };
    const builder = supabase.from("messages").insert(payload);
    const { error } = me
      ? await builder
      : await builder.setHeader("x-guest-session", sessionId);
    if (error) return toast.error(error.message);
    setBody("");
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-serif text-2xl font-bold">Chat with Reception</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We typically reply within a few minutes during reception hours.
        </p>

        {!me && !introDone ? (
          <form
            onSubmit={saveIntro}
            className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">
              Please share your name and phone so reception can identify you.
            </p>
            <div>
              <Label htmlFor="nm">Your name</Label>
              <Input id="nm" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="ph">Phone</Label>
              <Input id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Start chatting</Button>
          </form>
        ) : (
          <div className="mt-6 flex h-[65vh] flex-col rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {thread.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Say hello — we'd love to help with your stay.
                </p>
              )}
              {thread.map((m) => {
                const mine = me ? m.sender_id === me : m.guest_session_id === sessionId && !m.sender_id;
                return (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      mine ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {m.body}
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
              <Input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type a message..."
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
