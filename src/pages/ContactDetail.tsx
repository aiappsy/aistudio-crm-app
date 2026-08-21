import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useFirestoreDoc } from "@/lib/useFirestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: contact, loading: contactLoading } = useFirestoreDoc<any>("contacts", id || "");

  if (contactLoading) return <div className="p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2 inline-block"/> Loading...</div>;
  if (!contact) return <div className="p-8">Contact not found</div>;

  return (
    <div className="space-y-6 flex flex-col max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/app/contacts">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{contact.name}</h1>
          <p className="text-muted-foreground">{contact.company} — {contact.email}</p>
        </div>
        <Button 
          onClick={() => navigate('/app/notebook', { state: { selectedContactId: contact.id } })}
          className="gap-2 shrink-0 bg-primary/10 text-primary hover:bg-primary/20"
          variant="secondary"
        >
          <Sparkles className="h-4 w-4" /> Open in AI Notebook
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Contact Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div><strong>Name:</strong> {contact.name}</div>
             <div><strong>Company:</strong> {contact.company}</div>
             <div><strong>Email:</strong> {contact.email}</div>
             <div><strong>Phone:</strong> {contact.phone}</div>
             <div><strong>Status:</strong> {contact.status}</div>
             <div><strong>Added:</strong> {contact.createdAt ? new Date(contact.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
