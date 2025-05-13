"use client";

import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { X } from "lucide-react";
import LoginRequired from "@/components/LoginRequired";

const EditProfilePage = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{uid: string} | null>(null);
  const [showLoginAlert, setShowLoginAlert] = useState<boolean>(false);
  const [userData, setUserData] = useState({
    username: "",
    about: "",
    gradeLevel: "secondary" as "primary" | "secondary",
    curriculum: "Cambridge",
    examLevels: ["IGCSE"],
    avatarUrl: "",
  });
  
  const [originalUserData, setOriginalUserData] = useState({
    username: "",
    about: "",
    gradeLevel: "secondary" as "primary" | "secondary",
    curriculum: "Cambridge",
    examLevels: ["IGCSE"],
    avatarUrl: "",
  });
  
  // Define curriculum options for different grades
  const primaryCurriculumOptions = [
    { value: 'cambridge', label: 'Cambridge' },
    { value: 'national_indonesia', label: 'National (Indonesia)' },
    { value: 'other', label: 'Other' },
  ];
  
  const secondaryCurriculumOptions = [
    { value: 'cambridge', label: 'Cambridge' },
    { value: 'national_indonesia', label: 'National (Indonesia)' },
    { value: 'other', label: 'Other' },
  ];
  
  // Define exam level options based on curriculum
  const examLevelOptions = {
    cambridge: [
      { value: 'checkpoint', label: 'Checkpoint' },
      { value: 'igcse', label: 'IGCSE' },
      { value: 'alevel', label: 'A Level (AS & A2)' },
    ],
    national_indonesia: [
      { value: 'ujian_sekolah', label: 'Ujian Sekolah' },
      { value: 'un', label: 'Ujian Nasional' },
    ],
    other: [
      { value: 'general', label: 'General' },
    ]
  };
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentCurriculumOptions, setCurrentCurriculumOptions] = useState(secondaryCurriculumOptions);
  const [currentExamLevelOptions, setCurrentExamLevelOptions] = useState(examLevelOptions.cambridge);
  const [showExamLevels, setShowExamLevels] = useState(true);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const userGradeLevel = data.gradeLevel || "secondary";
          const userCurriculum = data.curriculum || "cambridge";
          
          // Update curriculum options based on grade level
          const options = userGradeLevel === "primary" ? primaryCurriculumOptions : secondaryCurriculumOptions;
          setCurrentCurriculumOptions(options);
          
          // Update exam level options and visibility based on grade and curriculum
          const showExams = userGradeLevel === "secondary" && userCurriculum === "cambridge";
          setShowExamLevels(showExams);
          
          if (userCurriculum === "cambridge") {
            setCurrentExamLevelOptions(examLevelOptions.cambridge);
          } else if (userCurriculum === "national_indonesia") {
            setCurrentExamLevelOptions(examLevelOptions.national_indonesia);
          } else {
            setCurrentExamLevelOptions(examLevelOptions.other);
          }
          
          const userDataObj = {
            username: data.username || "",
            about: data.about || "",
            gradeLevel: userGradeLevel,
            curriculum: userCurriculum,
            examLevels: data.examLevels || ["igcse"],
            avatarUrl: data.avatarUrl || "",
          };
          
          setUserData(userDataObj);
          setOriginalUserData(JSON.parse(JSON.stringify(userDataObj)));
        }
        setIsLoading(false);
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Check for changes when userData updates
  useEffect(() => {
    if (!isLoading) {
      const hasDataChanges = JSON.stringify(userData) !== JSON.stringify(originalUserData);
      setHasChanges(hasDataChanges || selectedFile !== null);
    }
  }, [userData, originalUserData, selectedFile, isLoading]);

  // Update curriculum options and exam level visibility when grade level changes
  useEffect(() => {
    if (userData.gradeLevel === "primary") {
      setCurrentCurriculumOptions(primaryCurriculumOptions);
      setShowExamLevels(false);
    } else {
      setCurrentCurriculumOptions(secondaryCurriculumOptions);
      setShowExamLevels(userData.curriculum === "cambridge");
    }
  }, [userData.gradeLevel]);

  // Update exam level options when curriculum changes
  useEffect(() => {
    if (userData.curriculum === "cambridge") {
      setCurrentExamLevelOptions(examLevelOptions.cambridge);
      setShowExamLevels(userData.gradeLevel === "secondary");
    } else if (userData.curriculum === "national_indonesia") {
      setCurrentExamLevelOptions(examLevelOptions.national_indonesia);
      setShowExamLevels(false);
    } else {
      setCurrentExamLevelOptions(examLevelOptions.other);
      setShowExamLevels(false);
    }
  }, [userData.curriculum]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        // Explicitly set hasChanges when a file is selected
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!auth.currentUser) return;
    
    // Force hasChanges to true if there's a selected file
    if (!hasChanges && !selectedFile) return;
    
    setIsSaving(true);
    try {
      let avatarUrl = userData.avatarUrl;
      
      // Upload new avatar if selected
      if (selectedFile) {
        const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);
        
        // Wait for upload to complete
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            () => {},
            reject,
            async () => {
              avatarUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }
      
      // Update user data in Firestore
      const userRef = doc(db, "users", auth.currentUser.uid);
      
      const updatedData: Record<string, any> = {
        username: userData.username,
        about: userData.about,
        curriculum: userData.curriculum,
        gradeLevel: userData.gradeLevel,
      };
      
      // Only include exam levels if they apply
      if (showExamLevels && userData.examLevels.length > 0) {
        updatedData.examLevels = [userData.examLevels[0]];
      } else {
        updatedData.examLevels = [];
      }
      
      // Add avatarUrl to Firestore if a new image was uploaded
      if (selectedFile && avatarUrl) {
        updatedData.avatarUrl = avatarUrl;
      }
      
      await updateDoc(userRef, updatedData);
      
      // Only update photoURL in Firebase Authentication
      // This ensures the header and other components display the avatar
      // without changing the original format in Firestore
      if (selectedFile && avatarUrl) {
        await updateProfile(auth.currentUser, {
          photoURL: avatarUrl
        });
      }
      
      // Show success toast notification
      toast("Profile updated successfully", {
        description: "Your changes have been saved",
        type: "success"
      });
      
      // Redirect back to profile
      router.push('/profile');
    } catch (error) {
      console.error("Error updating profile:", error);
      toast("Failed to update profile", {
        description: "There was an error saving your changes",
        type: "error"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleGoBack = () => {
    if (hasChanges) {
      setShowUnsavedChangesModal(true);
    } else {
      router.push('/profile');
    }
  };
  
  const handleConfirmNavigation = () => {
    setShowUnsavedChangesModal(false);
    router.push('/profile');
  };
  
  const handleCancelNavigation = () => {
    setShowUnsavedChangesModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full px-8 pt-8 justify-center">
      <div className="bg-white p-6 rounded-2xl w-full max-w-xl space-y-5 border shadow-sm">
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="relative w-20 h-20 mb-3 bg-gray-300 rounded-full overflow-hidden">
            <Image
              src={previewUrl || userData.avatarUrl || "/default-avatar.png"}
              alt="avatar"
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
          
          <button 
            onClick={() => document.getElementById('avatar-upload')?.click()}
            className="bg-white text-sm border border-gray-300 px-4 py-1.5 rounded-full hover:bg-gray-50 text-sm"
          >
            Upload photo
          </button>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="username" className="block font-medium text-sm">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={userData.username}
              onChange={handleInputChange}
              className="w-full p-2 rounded-lg bg-white border border-gray-200 text-sm"
              placeholder="Enter your username"
            />
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="bio" className="block font-medium text-sm">Bio</label>
            <textarea
              id="bio"
              name="about"
              value={userData.about}
              onChange={handleInputChange}
              className="w-full p-2 rounded-lg bg-white border border-gray-200 min-h-[80px] resize-none text-sm"
              placeholder="Write something about yourself..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="gradeLevel" className="block font-medium text-sm">Grade</label>
              <div className="relative">
                <select
                  id="gradeLevel"
                  name="gradeLevel"
                  value={userData.gradeLevel}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-lg bg-white border border-gray-200 appearance-none text-sm"
                >
                  <option value="primary">Primary (1 - 6)</option>
                  <option value="secondary">Secondary (7 - 12)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="curriculum" className="block font-medium text-sm">Curriculum</label>
              <div className="relative">
                <select
                  id="curriculum"
                  name="curriculum"
                  value={userData.curriculum}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-lg bg-white border border-gray-200 appearance-none text-sm"
                >
                  {currentCurriculumOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="examLevel" className="block font-medium text-sm">Exam Level</label>
            {showExamLevels ? (
              <div className="relative">
                <select
                  id="examLevel"
                  name="examLevels"
                  value={userData.examLevels[0] || ''}
                  onChange={(e) => setUserData({...userData, examLevels: [e.target.value]})}
                  className="w-full p-2 rounded-lg bg-white border border-gray-200 appearance-none text-sm"
                >
                  {currentExamLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            ) : (
              <div className="w-full p-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 text-sm">
                Not applicable
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end mt-6 space-x-3">
          <button 
            onClick={handleGoBack}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg text-sm"
          >
            Back
          </button>
          <button 
            onClick={handleSaveChanges}
            disabled={isSaving || !hasChanges}
            className={`text-white px-6 py-2 rounded-lg text-sm ${
              hasChanges 
                ? 'bg-[#646F8B] hover:bg-[#505A75]' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
      
      {/* Custom Unsaved Changes Modal */}
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-[#F0F0F0] rounded-full p-2">
                  <svg className="w-5 h-5 text-[#646F8B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Unsaved Changes</h3>
              </div>
              <button 
                onClick={handleCancelNavigation}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                You have unsaved changes that will be lost if you navigate away. Are you sure you want to leave this page?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelNavigation}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmNavigation}
                  className="px-4 py-2 bg-[#646F8B] text-white rounded-lg text-sm font-medium hover:bg-[#505A75] transition-colors"
                >
                  Leave Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Login Required Dialog */}
      <LoginRequired isOpen={showLoginAlert} onClose={() => setShowLoginAlert(false)} />
    </div>
  );
};

export default EditProfilePage;