import { useState, useEffect } from "react";
import { useFirestoreCollection, useFirestoreDoc } from "@/lib/useFirestore";
import { useAuth } from "@/lib/AuthContext";
import { X, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ReleaseBanner() {
  const { user } = useAuth();
  const { data: releases } = useFirestoreCollection<any>("releases");
  const { data: userProfile } = useFirestoreDoc<any>("users", user?.uid);
  const [dismissedReleases, setDismissedReleases] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dismissedReleases");
    if (saved) {
      try {
        setDismissedReleases(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  if (!releases || releases.length === 0 || !userProfile) return null;

  // Find the latest applicable release
  const latestRelease = releases
    .filter(r => !dismissedReleases.includes(r.id))
    .filter(r => {
      if (r.targetAudience === "all") return true;
      if (r.targetAudience === "pro" && ["pro", "enterprise"].includes(userProfile.tier)) return true;
      if (r.targetAudience === "enterprise" && userProfile.tier === "enterprise") return true;
      if (r.targetAudience === "beta" && userProfile.isBetaTester) return true;
      return false;
    })
    .sort((a, b) => {
      const timeA = a.publishedAt?.toMillis ? a.publishedAt.toMillis() : 0;
      const timeB = b.publishedAt?.toMillis ? b.publishedAt.toMillis() : 0;
      return timeB - timeA;
    })[0];

  if (!latestRelease) return null;

  const handleDismiss = () => {
    const newDismissed = [...dismissedReleases, latestRelease.id];
    setDismissedReleases(newDismissed);
    localStorage.setItem("dismissedReleases", JSON.stringify(newDismissed));
    setShowModal(false);
  };

  return (
    <>
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between z-50 relative">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Rocket className="h-4 w-4" />
          <span>New Update: {latestRelease.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => setShowModal(true)}>
            View Details
          </Button>
          <button onClick={handleDismiss} className="text-primary-foreground/80 hover:text-primary-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Rocket className="h-6 w-6 text-primary" />
              {latestRelease.title}
            </DialogTitle>
            <DialogDescription>
              Published on {latestRelease.publishedAt?.toDate ? latestRelease.publishedAt.toDate().toLocaleDateString() : 'Recently'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap">{latestRelease.notes}</div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleDismiss}>Got it, thanks!</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
