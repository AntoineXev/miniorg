"use client";

import { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function SuccessPage() {
  useEffect(() => {
    // Fire confetti on mount
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ["#E07A4B", "#7D9B6A", "#F5C86E", "#6B9BD1"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Big burst in the center
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      });
    }, 200);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 animate-bounce">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-light">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            className="text-green"
          >
            <path
              d="M7 13l3 3 7-7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <h1 className="font-display text-4xl font-semibold text-foreground md:text-5xl">
        You&apos;re on the waitlist!
      </h1>

      <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted">
        We are working really hard to bring you the best experience.
        <br />
        <span className="text-foreground font-medium">
          Thanks for being part of the journey.
        </span>
      </p>

      <div className="mt-12 flex items-center gap-2 rounded-full bg-secondary px-5 py-3">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="text-primary"
        >
          <path
            d="M22 12h-4l-3 9L9 3l-3 9H2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm text-muted">
          We&apos;ll notify you when we launch
        </span>
      </div>

      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to home
      </Link>
    </div>
  );
}
