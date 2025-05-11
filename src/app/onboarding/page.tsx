'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, updateProfile } from 'firebase/auth'
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import Image from 'next/image'
import TextField from '@mui/material/TextField'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import LoadingPage from '@/components/LoadingPage'

// Custom theme for Material UI components
const theme = createTheme({
  palette: {
    primary: {
      main: '#646F8B',
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            color: '#717171',
            fontSize: '1.25rem',
            fontWeight: 400,
          },
          '& .MuiInput-underline:before': {
            borderBottomColor: '#ABABAB',
            borderBottomWidth: '1px',
          },
          '& .MuiInput-underline:after': {
            borderBottomColor: '#646F8B',
            borderBottomWidth: '2px',
          },
          '& .MuiInputBase-input': {
            fontSize: '1.25rem',
            paddingBottom: '8px',
            paddingTop: '8px',
            backgroundColor: 'transparent',
            color: '#333',
          },
          '& .MuiInputBase-root': {
            backgroundColor: 'transparent',
          },
          '& .MuiFilledInput-root': {
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'transparent',
            },
            '&.Mui-focused': {
              backgroundColor: 'transparent',
            }
          }
        },
      },
    },
  },
});

// Steps in the onboarding process
enum OnboardingStep {
  USERNAME,
  PERSONALIZATION,
}

// Curriculum options
interface Option {
  value: string
  label: string
  selected: boolean
}

// Exam level options
interface ExamLevel {
  value: string
  label: string
  selected: boolean
}

// Define exam level options for different curriculums
interface ExamLevelConfig {
  cambridge: ExamLevel[];
  ib: ExamLevel[];
  national_indonesia: ExamLevel[];
  other: ExamLevel[];
}

// Form Components
function FormHeader() {
  return (
    <h1 className="self-center text-3xl font-bold text-black text-center mb-6">
      Sign Up
    </h1>
  );
}

function FormDivider() {
  return (
    <hr className="shrink-0 mt-16 max-w-full h-px border border-solid border-black border-opacity-50 w-[434px] max-md:mt-10" />
  );
}

function FormHelpText() {
  return (
    <p className="text-sm font-normal text-gray-500 mt-3">
      *This is the name that will be visible to others.
    </p>
  );
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.USERNAME)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [redirectMessage, setRedirectMessage] = useState("")
  
  // Form data
  const [username, setUsername] = useState('')
  
  // Define curriculum options for different grades
  const primaryCurriculumOptions: Option[] = [
    { value: 'cambridge', label: 'Cambridge', selected: false },
    { value: 'national_indonesia', label: 'National (Indonesia)', selected: false },
    { value: 'other', label: 'Other', selected: false },
  ];
  
  const secondaryCurriculumOptions: Option[] = [
    { value: 'cambridge', label: 'Cambridge', selected: false },
    { value: 'national_indonesia', label: 'National (Indonesia)', selected: false },
    { value: 'other', label: 'Other', selected: false },
  ];
  
  const [grade, setGrade] = useState<'primary' | 'secondary' | null>(null);
  const [curriculumOptions, setCurriculumOptions] = useState<Option[]>([]);
  
  const [examLevelConfigs, setExamLevelConfigs] = useState<ExamLevelConfig>({
    cambridge: [
      { value: 'checkpoint', label: 'Checkpoint', selected: false },
      { value: 'igcse', label: 'IGCSE', selected: true },
      { value: 'alevel', label: 'A Level (AS & A2)', selected: false },
    ],
    ib: [
      { value: 'myp', label: 'MYP', selected: true },
      { value: 'dp', label: 'Diploma Program', selected: false },
    ],
    national_indonesia: [
      { value: 'ujian_sekolah', label: 'Ujian Sekolah', selected: true },
      { value: 'un', label: 'Ujian Nasional', selected: false },
    ],
    other: [
      { value: 'general', label: 'General', selected: true },
    ]
  });
  
  // Initialize exam levels empty until a curriculum is selected
  const [examLevels, setExamLevels] = useState<ExamLevel[]>([]);

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        
        // Check if user has completed onboarding by checking if they have a username
        const userRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userRef)
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          
          // If user already has a username and curriculum, redirect to home
          if (userData.username && userData.curriculum) {
            setIsRedirecting(true)
            setRedirectMessage("Taking you to MathCom...")
            router.push('/')
          } else {
            // Pre-fill username if available
            if (userData.username) {
              setUsername(userData.username)
              setCurrentStep(OnboardingStep.PERSONALIZATION)
            }
            
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
      } else {
        // Wait a moment before redirecting to login to prevent flashing during auth state initialization
        setTimeout(() => {
          // Only redirect if still no user after a small delay
          if (!auth.currentUser) {
            // No user is signed in, redirect to login
            setIsRedirecting(true)
            setRedirectMessage("Taking you to login...")
            router.push('/login')
          }
        }, 1000)
      }
    })
    
    return () => unsubscribe()
  }, [router])

  // Handle grade selection
  const handleGradeSelect = (selectedGrade: 'primary' | 'secondary') => {
    setGrade(selectedGrade);
    
    // Update curriculum options based on grade
    if (selectedGrade === 'primary') {
      setCurriculumOptions(primaryCurriculumOptions);
    } else {
      setCurriculumOptions(secondaryCurriculumOptions);
    }
  };

  // Handle curriculum selection with updates to exam levels
  const handleCurriculumSelect = (value: string) => {
    // Update curriculum selection based on current grade
    if (grade === 'primary') {
      setCurriculumOptions(primaryCurriculumOptions.map(option => ({
        ...option,
        selected: option.value === value
      })));
      // For primary, no exam levels should be shown
      setExamLevels([]);
    } else {
      setCurriculumOptions(secondaryCurriculumOptions.map(option => ({
        ...option,
        selected: option.value === value
      })));
      
      // Update exam levels based on selected curriculum (only for secondary Cambridge)
      if (value === 'cambridge') {
        setExamLevels(examLevelConfigs.cambridge);
      } else if (value === 'ib') {
        setExamLevels(examLevelConfigs.ib);
      } else if (value === 'national_indonesia') {
        setExamLevels(examLevelConfigs.national_indonesia);
      } else {
        setExamLevels(examLevelConfigs.other);
      }
      
      // Only Cambridge curriculum in secondary shows exam levels in the UI
      if (value !== 'cambridge') {
        setExamLevels([]);
      }
    }
  };

  // Handle exam level selection
  const handleExamLevelSelect = (value: string) => {
    setExamLevels(examLevels.map(level => ({
      ...level,
      selected: level.value === value
    })))
  }

  // Handle form submission for username step
  const handleUsernameSubmit = async () => {
    if (!username.trim() || !currentUser) return
    
    setSaving(true)
    try {
      const userRef = doc(db, 'users', currentUser.uid)
      const userDoc = await getDoc(userRef)
      
      // Use the original photoURL from Google Auth
      // This ensures we maintain the original format in Firestore
      if (userDoc.exists()) {
        await setDoc(userRef, { 
          username
        }, { merge: true })
      } else {
        // Create new user document if it doesn't exist
        await setDoc(userRef, { 
          username,
          email: currentUser.email,
          displayName: currentUser.displayName,
          createdAt: new Date()
        })
      }
      
      // Still update Auth profile's displayName
      await updateProfile(currentUser, {
        displayName: username
      });
      
      setCurrentStep(OnboardingStep.PERSONALIZATION)
    } catch (error) {
      console.error('Error saving username:', error)
    } finally {
      setSaving(false)
    }
  }

  // Handle form submission for personalization step
  const handlePersonalizationSubmit = async () => {
    if (!currentUser || !grade) return
    
    // Require the user to select a curriculum
    const selectedCurriculum = curriculumOptions.find(option => option.selected)?.value
    if (!selectedCurriculum) {
      // You could add error handling here
      return
    }
    
    setSaving(true)
    try {
      const selectedExamLevels = examLevels.filter(level => level.selected).map(level => level.value)
      
      const userRef = doc(db, 'users', currentUser.uid)
      const userDoc = await getDoc(userRef)
      
      const userData = {
        curriculum: selectedCurriculum,
        examLevels: selectedExamLevels,
        gradeLevel: grade,
        onboardingCompleted: true
      }
      
      if (userDoc.exists()) {
        await setDoc(userRef, userData, { merge: true })
      } else {
        await setDoc(userRef, {
          username: username,
          email: currentUser.email,
          displayName: currentUser.displayName,
          createdAt: new Date(),
          ...userData
        })
      }
      
      // Redirect to home page after successful onboarding
      setIsRedirecting(true)
      setRedirectMessage("Taking you to MathCom...")
      router.push('/')
    } catch (error) {
      console.error('Error saving personalization:', error)
    } finally {
      setSaving(false)
    }
  }

  // Show loading state
  if (isRedirecting) {
    return <LoadingPage message={redirectMessage} />;
  }
  
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <div className="flex items-start justify-center min-h-screen pt-16">
          <div className="px-20 py-14 rounded-xl bg-[#F2F2F2] shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-gray-200 w-full max-w-[650px]">
            <div className="text-center animate-pulse">Loading...</div>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="flex items-start justify-center min-h-screen px-6 pt-16">
        {currentStep === OnboardingStep.USERNAME && (
          <section className="w-full max-w-[650px]">
            <div className="flex flex-col px-20 py-14 w-full rounded-xl bg-[#F2F2F2] shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-gray-200">
              <FormHeader />
              
              <div className="mb-0 px-10 mt-4">
                <TextField
                  variant="standard"
                  label="Username"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  InputProps={{ 
                    disableUnderline: false,
                    className: "mb-1 bg-transparent",
                    style: { backgroundColor: 'transparent' }
                  }}
                  helperText="*This is the name that will be visible to others."
                  FormHelperTextProps={{
                    style: {
                      marginLeft: 0,
                      fontSize: '0.875rem',
                      color: '#717171',
                      marginTop: '6px'
                    }
                  }}
                />
              </div>
              
              <div className="mt-8 px-10">
                <button
                  onClick={handleUsernameSubmit}
                  disabled={!username.trim() || saving}
                  className="w-full max-w-xs mx-auto block py-2 text-lg font-semibold rounded-full bg-[#646F8B] text-white hover:bg-[#505A75]"
                >
                  {saving ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </div>
          </section>
        )}
        
        {currentStep === OnboardingStep.PERSONALIZATION && (
          <section className="w-full max-w-[650px]">
            <div className="flex flex-col px-20 py-14 w-full rounded-xl bg-[#F2F2F2] shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-gray-200">
              <h1 className="self-center text-3xl font-bold text-black text-center mb-2">Personalization</h1>
              <p className="self-center text-base text-gray-600">Pick the options that match your studies.</p>
              
              <div className="mt-8 px-6">
                <h2 className="text-2xl font-medium">Grade</h2>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => handleGradeSelect('primary')}
                    className={`flex-1 py-3 px-4 rounded-full text-sm ${
                      grade === 'primary' 
                        ? 'bg-[#646F8B] text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Primary (1 - 6)
                  </button>
                  <button
                    onClick={() => handleGradeSelect('secondary')}
                    className={`flex-1 py-3 px-4 rounded-full text-sm ${
                      grade === 'secondary' 
                        ? 'bg-[#646F8B] text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Secondary (7 - 12)
                  </button>
                </div>
              </div>
              
              {/* Only show curriculum options after grade is selected */}
              {grade && (
                <div className="mt-8 px-6">
                  <h2 className="text-2xl font-medium">Curriculum</h2>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {curriculumOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleCurriculumSelect(option.value)}
                        className={`py-2 px-4 rounded-full text-sm ${
                          option.selected 
                            ? 'bg-[#646F8B] text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show exam levels only for secondary Cambridge curriculum when selected */}
              {grade === 'secondary' && 
               curriculumOptions.find(option => option.selected)?.value === 'cambridge' && 
               examLevels.length > 0 && (
                <div className="mt-8 px-6">
                  <h2 className="text-2xl font-medium">Exam Levels</h2>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {examLevels.map(level => (
                      <button
                        key={level.value}
                        onClick={() => handleExamLevelSelect(level.value)}
                        className={`py-2 px-4 rounded-full text-sm ${
                          level.selected 
                            ? 'bg-[#646F8B] text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Only show continue button if grade and curriculum are selected */}
              {grade && curriculumOptions.some(option => option.selected) && (
                <div className="mt-12 px-6">
                  <button
                    onClick={handlePersonalizationSubmit}
                    disabled={saving}
                    className="w-full max-w-xs mx-auto block py-3 text-lg font-semibold rounded-full bg-[#646F8B] text-white hover:bg-[#505A75]"
                  >
                    {saving ? 'Saving...' : 'Continue'}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </ThemeProvider>
  )
} 