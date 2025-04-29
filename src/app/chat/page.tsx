import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle, Paperclip } from "lucide-react";
import React, { useEffect, useState } from "react";
import Chat from "../../components/Chat"; // 🧠 Import your Chat component!

const Page = () => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if ((window as any).MathJax) {
        (window as any).MathJax.typesetPromise();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log(inputValue);
      setInputValue('');
    }
  }

  return (
    <main className="px-6 sm:px-0 sm:pr-8 sm:pl-72 pb-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
      <div className="h-screen bg-neutral-50 p-6 w-fit relative pt-24 col-span-2">
        <div className="space-y-16 overflow-y-scroll h-3/4">
          {/* 🧠 Embed the AI Chat here */}
          <Chat />
        </div>
        <div className="bg-neutral-50 p-4 pt-6 absolute left-0 bottom-0 w-full">
          <div className="bg-neutral-200 p-4 rounded-lg space-y-2">
            <Textarea
              placeholder="Ask MathCom AI"
              className="border-none focus-visible:ring-0 shadow-none !p-0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex justify-between gap-x-5 items-center">
              <Paperclip className="w-5 h-5 text-neutral-400" />
              <ArrowUpCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-36 space-y-5 border p-4 h-fit border-black rounded-2xl">
        <h1 className="font-semibold text-xl">Shortcuts</h1>
        <div className="bg-neutral-100 flex items-center gap-x-3 p-3 rounded-full">
          <div className="w-7 h-7 bg-neutral-300 rounded-full" />
          <h1 className="font-medium">Get Similar Questions</h1>
        </div>
        <div className="bg-neutral-100 flex items-center gap-x-3 p-3 rounded-full">
          <div className="w-7 h-7 bg-neutral-300 rounded-full" />
          <h1 className="font-medium">Ask a Tutor</h1>
        </div>
        <div className="bg-neutral-100 flex items-center gap-x-3 p-3 rounded-full">
          <div className="w-7 h-7 bg-neutral-300 rounded-full" />
          <h1 className="font-medium">Close Session</h1>
        </div>
      </div>
    </main>
  );
};

export default Page;