"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WaitlistForm } from "@/components/WaitlistForm";
import { TaskCard } from "@/components/TaskCard";
import { TimelineSlot } from "@/components/TimelineSlot";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial positions
      const heroTask = document.getElementById("hero-task");
      const placeholder = document.getElementById("task-placeholder");
      const visualColumn = document.getElementById("visual-column");

      if (!heroTask || !placeholder || !visualColumn) return;

      const visualRect = visualColumn.getBoundingClientRect();
      const placeholderRect = placeholder.getBoundingClientRect();

      // Position hero task in the mockup initially
      gsap.set(heroTask, {
        left: placeholderRect.left - visualRect.left,
        top: placeholderRect.top - visualRect.top,
        width: placeholderRect.width,
      });

      // Calculate list position (center-left of visual column)
      const listX = visualRect.width * 0.25 - 150;
      const listY = visualRect.height * 0.5 - 100;

      gsap.set("#other-tasks", {
        left: listX,
        top: listY + 80,
      });

      // Main timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#scroll-animation",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        },
      });

      // Phase 1: Fade out intro, move task to center
      tl.to("#text-intro", { opacity: 0, duration: 0.06 }, 0.06)
        .to("#app-mockup", { opacity: 0, scale: 0.95, duration: 0.1 }, 0.06)
        .to("#text-capture", { opacity: 1, duration: 0.05 }, 0.12)
        .to(
          heroTask,
          {
            left: listX,
            top: listY,
            width: 300,
            boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
            duration: 0.12,
            ease: "power2.inOut",
          },
          0.06
        );

      // Phase 2: Show other tasks
      tl.to("#task-2", { opacity: 1, y: 0, duration: 0.05 }, 0.18)
        .to("#task-3", { opacity: 1, y: 0, duration: 0.05 }, 0.22)
        .to("#task-4", { opacity: 1, y: 0, duration: 0.05 }, 0.26);

      // Phase 3: Show timeline
      tl.to("#text-capture", { opacity: 0, duration: 0.04 }, 0.32)
        .to("#text-plan", { opacity: 1, duration: 0.04 }, 0.35)
        .to(heroTask, { left: listX - 40, duration: 0.08 }, 0.34)
        .to("#other-tasks", { x: -40, duration: 0.08 }, 0.34)
        .to("#timeline", { opacity: 1, duration: 0.06 }, 0.36)
        .to("#tl-1", { opacity: 1, x: 0, duration: 0.04 }, 0.38)
        .to("#tl-2", { opacity: 1, x: 0, duration: 0.04 }, 0.41)
        .to("#tl-3", { opacity: 1, x: 0, duration: 0.04 }, 0.44)
        .to("#tl-4", { opacity: 1, x: 0, duration: 0.04 }, 0.47);

      // Phase 4: Complete tasks
      tl.to("#text-plan", { opacity: 0, duration: 0.04 }, 0.52)
        .to("#text-done", { opacity: 1, duration: 0.04 }, 0.55)
        .to("#timeline", { opacity: 0, x: 20, duration: 0.06 }, 0.52)
        .to(heroTask, { left: listX + 20, duration: 0.06 }, 0.55)
        .to("#other-tasks", { x: 20, duration: 0.06 }, 0.55);

      // Check off tasks one by one
      const checkTask = (
        checkId: string,
        titleId: string,
        taskId: string,
        startTime: number
      ) => {
        tl.to(
          checkId,
          {
            duration: 0.01,
            onComplete: () => {
              const check = document.querySelector(checkId);
              const title = document.querySelector(titleId);
              if (check) {
                check.classList.add("!bg-green", "!border-green");
                const svg = check.querySelector("svg");
                if (svg) {
                  svg.classList.remove("opacity-0", "scale-0");
                  svg.classList.add("opacity-100", "scale-100");
                }
              }
              if (title) {
                title.classList.add("line-through", "!text-muted-foreground");
              }
            },
          },
          startTime
        ).to(
          taskId,
          { opacity: 0, x: 40, scale: 0.95, duration: 0.06 },
          startTime + 0.04
        );
      };

      checkTask("#hero-task-check", "#hero-task-title", "#hero-task", 0.6);
      checkTask("#task-2-check", "#task-2-title", "#task-2", 0.68);
      checkTask("#task-3-check", "#task-3-title", "#task-3", 0.76);
      checkTask("#task-4-check", "#task-4-title", "#task-4", 0.84);

      // Show done message
      tl.to("#done-message", { opacity: 1, scale: 1, duration: 0.08 }, 0.92);

      // Handle resize
      const handleResize = () => {
        ScrollTrigger.refresh();
      };
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen">
      {/* Scroll Animation Section */}
      <section id="scroll-animation" className="relative h-[500vh]">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden px-6 md:px-12">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Column - Text */}
            <div className="relative flex flex-col justify-center">
              {/* Intro Text */}
              <div
                id="text-intro"
                className="absolute inset-0 flex flex-col justify-center z-10"
              >
                <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-[3.5rem]">
                  <span className="text-foreground">Get organized</span>
                  <br />
                  <span className="text-foreground">without thinking</span>
                  <br />
                  <span className="text-foreground">about it.</span>
                </h1>
                <p className="mt-6 max-w-md text-lg text-muted">
                  Capture tasks from anywhere, plan your day realistically, and
                  end with a clear mind.
                </p>
                <div className="mt-8 flex">
                  <WaitlistForm />
                </div>
              </div>

              {/* Capture Text */}
              <div
                id="text-capture"
                className="absolute inset-0 flex flex-col justify-center opacity-0"
              >
                <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                  <span className="text-muted-foreground">MiniOrg</span>
                  <br />
                  <span className="text-foreground">captures everything</span>
                  <br />
                  <span className="text-foreground">in one place...</span>
                </h2>
              </div>

              {/* Plan Text */}
              <div
                id="text-plan"
                className="absolute inset-0 flex flex-col justify-center opacity-0"
              >
                <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                  <span className="text-muted-foreground">...and helps you</span>
                  <br />
                  <span className="text-foreground">plan what&apos;s actually</span>
                  <br />
                  <span className="text-foreground">doable today...</span>
                </h2>
              </div>

              {/* Done Text */}
              <div
                id="text-done"
                className="absolute inset-0 flex flex-col justify-center opacity-0"
              >
                <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                  <span className="text-muted-foreground">...so you</span>
                  <br />
                  <span className="text-foreground">end each day with</span>
                  <br />
                  <span className="text-foreground">a clear mind.</span>
                </h2>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div
              id="visual-column"
              className="relative hidden h-[500px] lg:block"
            >
              {/* App Mockup */}
              <div
                id="app-mockup"
                className="absolute left-1/2 top-1/2 w-[480px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
              >
                {/* Sidebar */}
                <div className="absolute bottom-0 left-0 top-0 w-36 border-r border-border bg-secondary/50 p-4">
                  <div className="mb-6 font-display text-base font-semibold">
                    Mini<span className="text-primary">Org</span>.
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-xs font-medium text-foreground">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M3 10h18M8 2v4M16 2v4" />
                      </svg>
                      Calendar
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M4 6h16M4 12h16M4 18h10" />
                      </svg>
                      Backlog
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="ml-36 p-5">
                  <div className="mb-5">
                    <div className="font-display text-base font-semibold">
                      Today&apos;s Tasks
                    </div>
                    <div className="text-xs text-muted">
                      Your planned tasks for today
                    </div>
                  </div>
                  <div
                    id="task-placeholder"
                    className="h-14 w-full rounded-xl"
                  />
                </div>
              </div>

              {/* Hero Task */}
              <TaskCard
                id="hero-task"
                title="Finish presentation"
                meta="High priority"
                duration="1h30"
                className="absolute z-20 w-[300px]"
              />

              {/* Other Tasks */}
              <div
                id="other-tasks"
                className="absolute z-10 flex flex-col gap-3"
              >
                <TaskCard
                  id="task-2"
                  title="Review PR #42"
                  meta="Code review"
                  duration="30m"
                  className="translate-y-6 opacity-0"
                />
                <TaskCard
                  id="task-3"
                  title="Team sync call"
                  meta="Weekly standup"
                  duration="45m"
                  className="translate-y-6 opacity-0"
                />
                <TaskCard
                  id="task-4"
                  title="Send weekly report"
                  meta="End of week"
                  duration="20m"
                  className="translate-y-6 opacity-0"
                />
              </div>

              {/* Timeline */}
              <div
                id="timeline"
                className="absolute right-8 top-1/2 z-30 w-40 -translate-y-1/2 opacity-0"
              >
                <div className="mb-4 border-b border-border pb-3 text-center">
                  <div className="text-xs font-medium text-primary">Friday</div>
                  <div className="font-display text-3xl font-semibold text-primary">
                    31
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <TimelineSlot id="tl-1" time="14:00" title="Finish presentation" />
                  <TimelineSlot id="tl-2" time="15:30" title="Review PR #42" />
                  <TimelineSlot id="tl-3" time="16:15" title="Team sync call" />
                  <TimelineSlot id="tl-4" time="17:00" title="Send weekly report" />
                </div>
              </div>

              {/* Done Message */}
              <div
                id="done-message"
                className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 scale-95 text-center opacity-0"
              >
                <div className="mb-6">
                  <svg
                    width="72"
                    height="72"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mx-auto text-primary"
                  >
                    <path
                      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-3xl font-semibold text-foreground">
                  Your day is done
                </h3>
                <p className="mt-2 text-muted">You can rest with ease</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta"
        className="flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center"
      >
        <h2 className="font-display text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
          One day at a time.
        </h2>
        <p className="mx-auto mt-6 max-w-md text-lg text-muted">
          Join the waitlist and be the first to experience a new way to organize
          your days.
        </p>
        <div className="mt-10">
          <WaitlistForm />
        </div>
      </section>
    </div>
  );
}
