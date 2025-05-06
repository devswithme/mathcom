import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { Input } from "./ui/input";
import { useForm } from "react-hook-form";
import { formSchema } from "@/lib/form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { z } from "zod";
import { cn } from "@/lib/utils";
import Popup from "./ui/popup";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => [
      "understanding",
      "clarity",
      "⁠to learn",
      "growth",
      "depth",
      "progress",
    ],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/data`, values);
    form.reset();
    setLoading(false);
    setShowPopup(true);
  }

  return (
    <div className="w-full px-8 absolute z-50 inset-0">
      <div className="container mx-auto">
        <div className="flex gap-6 py-12 lg:py-16 items-center justify-center flex-col relative">
          <div className="mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="size-32 !opacity-100"
              disabled
            >
              <Image
                src="/mathcomlogo.png"
                alt="logo"
                width={120}
                height={120}
              />
            </Button>
          </div>

          <p className="text-[10px] text-sm md:text-base lg:text-xl font-regular text-spektr-cyan-50 max-w-full px-1 mx-auto text-center mb-[-0.5rem] md:mb-[-0.5rem] text-ellipsis">
            The ultimate AI-augmented human learning platform.
          </p>

          <div className="flex flex-col items-center w-full">
            <h1 className="text-4xl sm:text-5xl md:text-7xl max-w-4xl tracking-tight text-center font-regular mt-0 mb-6 md:mb-8 text-balance px-6 sm:px-4">
              <span className="text-spektr-cyan-50 text-3xl md:text-5xl whitespace-nowrap mt-[0.25rem] mb-[0.1rem] md:mt-[0.25rem] md:mb-[0.1rem]">
                For students who want
              </span>
              <span className="relative flex w-full justify-center overflow-hidden text-center h-[4.5rem] md:h-[4.5rem]">
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold text-[#3E4B68] text-3xl md:text-5xl leading-tight w-full left-0 right-0"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center mb-6">
              <span className="font-medium">
                Early access drops{" "}
                <span className="font-semibold text-[#3E4B68]">May 14</span>
              </span>
              <br />
              <span className="font-medium text-sm md:text-base">
                Join the waitlist now
              </span>
            </p>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 z-20 max-w-[30rem] mx-auto w-full mt-2 mb-4"
              >
                <div className="w-full sm:flex-1">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input
                            autoFocus
                            autoComplete="off"
                            placeholder="Enter your email"
                            {...field}
                            className="focus-visible:ring-offset-0 focus-visible:ring-border focus-visible:ring-1 w-full"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  disabled={
                    !form.watch("email") ||
                    !!form.formState.errors.email ||
                    loading
                  }
                  className={cn(
                    "text-white transition-colors w-full sm:w-auto",
                    form.watch("email") && !form.formState.errors.email
                      ? "bg-[#3E4B68]/90 hover:bg-[#3E4B68]"
                      : "bg-[#3E4B68]/70 hover:bg-[#3E4B68]/80"
                  )}
                >
                  Join{loading && "ing"}{" "}
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <Popup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        message="You’re on the list! We’ll send you an email when early access launches."
      />
    </div>
  );
}

export { Hero };
