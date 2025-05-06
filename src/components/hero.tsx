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
  }

  return (
    <div className="w-full px-8 absolute z-50 inset-0">
      <div className="container mx-auto">
        <div className="flex gap-6 py-12 lg:py-16 items-center justify-center flex-col relative">
          <div className="mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="size-24 !opacity-100"
              disabled
            >
              <Image src="/mathcom.svg" alt="logo" width={90} height={90} />
            </Button>
          </div>
          <div className="flex flex-col">
            <h1 className="text-5xl md:text-7xl max-w-3xl tracking-tighter text-center font-regular mb-16">
              <span className="text-spektr-cyan-50">For students who want</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
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
              <span className="font-medium">Early access drops <span className="font-semibold text-[#3E4B68]">May 14</span></span>
              <br />
              <span className="font-medium text-sm md:text-base">Join the waitlist now</span>
            </p>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 z-20 max-w-xl mx-auto w-full"
              >
                <div className="sm:col-span-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            autoFocus
                            autoComplete="off"
                            placeholder="Enter your email"
                            {...field}
                            className="focus-visible:ring-offset-0 focus-visible:ring-border focus-visible:ring-1"
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
                    "text-white transition-colors",
                    form.watch("email") && !form.formState.errors.email
                      ? "bg-[#3E4B68]/90 hover:bg-[#3E4B68]"
                      : "bg-[#3E4B68]/70 hover:bg-[#3E4B68]/80"
                  )}
                >
                  Join{loading && "ing"} the Waitlist{" "}
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
    </div>
  );
}

export { Hero };
