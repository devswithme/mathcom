"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ImagePlus, Info, Loader2 } from "lucide-react";
import { db, auth, storage } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { onAuthStateChanged, User } from "firebase/auth";
import { v4 as uuid } from "uuid";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const communities = ["Checkpoint", "IGCSE", "A Level"];

export default function AskPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState(communities[0]);
  const [user, setUser] = useState<User | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handlePost = async () => {
    if (!title.trim()) {
      toast(
        <div>
          <p className="font-semibold text-red-600">Missing Title</p>
          <p className="text-sm text-muted-foreground">
            Please enter a title before posting your question.
          </p>
        </div>
      );
      return;
    }

    if (!user) {
      setShowLoginAlert(true);
      return;
    }

    setIsPosting(true);
    let imageURL = "";

    try {
      if (imageFile) {
        const imageRef = ref(
          storage,
          `post_images/${uuid()}-${imageFile.name}`
        );
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageURL = await getDownloadURL(snapshot.ref);
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      await addDoc(collection(db, "posts"), {
        title,
        description,
        community: selectedCommunity,
        userId: user.uid,
        username: postAnonymously
          ? "Anonymous"
          : userData.username || "Anonymous",
        avatar: postAnonymously ? "" : userData.avatarUrl || "",
        imageURL,
        createdAt: serverTimestamp(),
        upvotes: 0,
        commentsCount: 0,
      });

      toast(
        <div>
          <p className="font-semibold">Posted!</p>
          <p className="text-sm text-muted-foreground">
            Your question has been published successfully.
          </p>
        </div>
      );

      setTimeout(() => {
        router.push("/");
      }, 1000);

      // Reset form
      setTitle("");
      setDescription("");
      setSelectedCommunity(communities[0]);
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error posting:", error);
      toast(
        <div>
          <p className="font-semibold text-red-600">Error</p>
          <p className="text-sm text-muted-foreground">
            Something went wrong while posting.
          </p>
        </div>
      );
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <main className="px-6 sm:px-0 sm:pr-8 sm:pl-72 pt-24 pb-8 grid grid-cols-1 gap-y-5">
      <h1 className="text-2xl font-bold">Ask a question</h1>

      {/* Community Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-fit bg-neutral-100 flex items-center gap-x-2 py-2 pl-3 pr-4 rounded-full border border-black/10 hover:bg-neutral-200 transition text-sm font-semibold">
            <div className="w-6 h-6 bg-neutral-200 rounded-full" />
            {selectedCommunity}
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-40 rounded-xl p-1 shadow-md"
        >
          {communities.map((c) => (
            <DropdownMenuItem
              key={c}
              onClick={() => setSelectedCommunity(c)}
              className={`cursor-pointer px-3 py-2 rounded-md text-sm ${
                selectedCommunity === c ? "bg-neutral-200 font-semibold" : ""
              }`}
            >
              {c}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Title */}
      <div className="max-w-2xl border border-black p-4 rounded-2xl">
        <h1 className="text-sm font-medium">
          Title<span className="text-red-600">*</span>
        </h1>
        <Input
          className="border-none shadow-none focus-visible:ring-0 px-0"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Description + Upload */}
      <div className="max-w-2xl border border-black p-4 rounded-2xl flex gap-x-4 items-start">
        <div className="w-full">
          <h1 className="text-sm font-medium">Description</h1>
          <Textarea
            className="border-none shadow-none focus-visible:ring-0 px-0"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex-1/6 aspect-square rounded-xl border border-black relative overflow-hidden group">
          {imagePreview ? (
            <>
              <>
                <div
                  onDoubleClick={() => setShowImageModal(true)}
                  className="relative w-full h-full group cursor-zoom-in z-10"
                >
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-105"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center text-xs hover:bg-black transition z-20"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>

                {/* Modal to show full image */}
                <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
                  <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white">
                    <Image
                      src={imagePreview}
                      alt="Full Image"
                      width={800}
                      height={800}
                      className="w-full h-auto object-contain"
                    />
                  </DialogContent>
                </Dialog>
              </>
            </>
          ) : (
            <>
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImageFile(file);
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () =>
                      setImagePreview(reader.result as string);
                    reader.readAsDataURL(file);
                  } else {
                    setImagePreview(null);
                  }
                }}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
            </>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between items-center max-w-2xl">
        <div className="min-h-[24px] flex items-center">
          <label className="flex items-center gap-x-2 text-sm">
            <Checkbox
              id="anonymous"
              checked={postAnonymously}
              onCheckedChange={(checked) =>
                setPostAnonymously(Boolean(checked))
              }
            />
            Post Anonymously
          </label>
        </div>

        <div className="flex items-center gap-x-3">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full"
            onClick={handlePost}
            disabled={isPosting}
          >
            {isPosting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
            {isPosting ? "Posting..." : "Post"}
          </Button>

          <Button size="lg" className="bg-[#7F0000] rounded-full !font-bold">
            Ask AI
          </Button>

          <Info className="w-4 h-4" />
        </div>
      </div>

      <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You must be logged in to post a question.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLoginAlert(false)}>
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
