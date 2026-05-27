import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";
import { useFirestoreQuery } from "@/lib/useFirestore";
import { where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Workflow, Plus, Zap, ArrowRight, Trash2, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Workflows() {
  const { user } = useAuth();
  const { data: workflows, loading } = useFirestoreQuery<any>("workflows", [where("ownerId", "==", user?.uid)]);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState<any>({ name: "", trigger: "", action: "", status: "active" });

  const templates = [
    { name: "Welcome New Customers", trigger: "contact_created", action: "send_welcome_email" },
    { name: "Hot Lead Alert", trigger: "score_above_80", action: "notify_owner" },
    { name: "Stalled Deal Nurture", trigger: "deal_stalled_14_days", action: "send_nurture_drip" }
  ];

  const handleSave = async () => {
    if (!user || !newWorkflow.name || !newWorkflow.trigger || !newWorkflow.action) return;
    await addDoc(collection(db, "workflows"), {
      ...newWorkflow,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setIsCreating(false);
    setNewWorkflow({ name: "", trigger: "", action: "", status: "active" });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "workflows", id));
  };

  const toggleStatus = async (workflow: any) => {
    await updateDoc(doc(db, "workflows", workflow.id), {
      status: workflow.status === "active" ? "inactive" : "active",
      updatedAt: serverTimestamp()
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Automation</h1>
          <p className="text-muted-foreground">Automate repetitive tasks with if/then logic.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus size={16} /> New Workflow
        </Button>
      </div>

      {isCreating && (
        <Card className="border-primary/50 shadow-md">
          <CardHeader>
            <CardTitle>Create Automation Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Workflow Name</label>
              <Input 
                placeholder="e.g. Onboarding Sequence" 
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-muted/30 p-4 rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> WHEN (Trigger)</label>
                <Select value={newWorkflow.trigger} onValueChange={(v) => setNewWorkflow({ ...newWorkflow, trigger: v })}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Select event..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact_created">New Contact Created</SelectItem>
                    <SelectItem value="deal_won">Deal Moved to Closed Won</SelectItem>
                    <SelectItem value="score_above_80">Lead Score &gt; 80</SelectItem>
                    <SelectItem value="deal_stalled_14_days">Deal Stalled (14 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mt-6 text-muted-foreground">
                <ArrowRight size={24} />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" /> THEN (Action)</label>
                <Select value={newWorkflow.action} onValueChange={(v) => setNewWorkflow({ ...newWorkflow, action: v })}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Select action..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_welcome_email">Send Welcome Email</SelectItem>
                    <SelectItem value="notify_owner">Notify Account Owner</SelectItem>
                    <SelectItem value="send_nurture_drip">Send Nurture Email</SelectItem>
                    <SelectItem value="create_task">Create Follow-up Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save & Activate</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {workflows.map((wf: any) => (
          <Card key={wf.id} className={wf.status === 'inactive' ? 'opacity-60' : ''}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{wf.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={wf.status === 'active' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                    {wf.status}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(wf.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 bg-muted p-2 rounded">
                  <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-medium text-xs font-mono">{wf.trigger}</span>
                </div>
                <div className="flex justify-center text-muted-foreground">
                  <ArrowRight className="h-3 w-3" />
                </div>
                <div className="flex items-center gap-2 bg-muted p-2 rounded flex-wrap">
                  <GitBranch className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium text-xs font-mono">{wf.action}</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => toggleStatus(wf)}
              >
                {wf.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && !isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Templates</CardTitle>
            <CardDescription>Start building automations with these recommended templates.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {templates.map((tpl, idx) => (
              <div key={idx} className="border p-4 rounded-lg cursor-pointer hover:border-primary transition-colors" onClick={() => {
                setNewWorkflow({ ...tpl, status: "active" });
                setIsCreating(true);
              }}>
                <h3 className="font-medium mb-2">{tpl.name}</h3>
                <div className="text-xs text-muted-foreground space-y-1 font-mono">
                  <div>IF: {tpl.trigger}</div>
                  <div>THEN: {tpl.action}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
