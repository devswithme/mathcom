import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle, Paperclip } from "lucide-react";
import React from "react";

const Page = () => {
  return (
    <main className="px-6 sm:px-0 sm:pr-8 sm:pl-72 pb-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
      <div className="h-screen bg-neutral-50 p-6 w-fit relative pt-24 col-span-2">
        <div className="space-y-16 overflow-y-scroll h-3/4">
          <div className="flex gap-x-5">
            <div className="bg-neutral-300 rounded-full w-8 h-8 aspect-square" />
            <div className="space-y-3">
              <h1 className="font-semibold">MathCom AI</h1>
              <p className="max-w-xl font-medium text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam
              </p>
            </div>
          </div>
          <div className="flex gap-x-5">
            <div className="space-y-3 text-right">
              <h1 className="font-semibold">Username_username</h1>
              <p className="max-w-xl font-medium p-3 border border-black rounded-lg w-fit text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam
              </p>
            </div>
            <div className="bg-neutral-300 rounded-full w-8 h-8 aspect-square" />
          </div>
          <div className="flex gap-x-5">
            <div className="bg-neutral-300 rounded-full w-8 h-8 aspect-square" />
            <div className="space-y-3">
              <h1 className="font-semibold">MathCom AI</h1>
              <p className="max-w-xl font-medium text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam
              </p>
            </div>
          </div>
          <div className="flex gap-x-5">
            <div className="space-y-3 text-right">
              <h1 className="font-semibold">Username_username</h1>
              <p className="max-w-xl font-medium p-3 border border-black rounded-lg w-fit text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam
              </p>
            </div>
            <div className="bg-neutral-300 rounded-full w-8 h-8 aspect-square" />
          </div>
        </div>
        <div className="bg-neutral-50 p-4 pt-6 absolute left-0 bottom-0 w-full">
          <div className="bg-neutral-200 p-4 rounded-lg space-y-2">
            <Textarea
              placeholder="Ask MathCom AI"
              className="border-none focus-visible:ring-0 shadow-none !p-0"
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
