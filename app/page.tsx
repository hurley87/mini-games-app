"use client";

import {
  useMiniKit,
  useAddFrame,
} from "@coinbase/onchainkit/minikit";
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const { address } = useAccount();

  console.log('address', address);

  const addFrame = useAddFrame();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  useEffect(() => {
    const saveUser = async () => {
      if (context) {
        console.log('context', context);
        const user = context.user;
        console.log('user', user);
        
        // Only proceed if all required fields are present
        if (user.fid && user.displayName && user.pfpUrl && user.username) {
          const userData = {
            fid: user.fid,
            name: user.displayName,
            pfp: user.pfpUrl,
            username: user.username,
          };
          console.log('userData', userData);
          
          // Call the API endpoint to upsert user data
          await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });
        } else {
          console.warn('Missing required user data fields');
        }
      }
    };

    saveUser();
  }, [context]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <button
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
        >
          Save Frame
        </button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  console.log("context", context);
  // const userId = context?.user?.fid?.toString() || "";

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      Mini Games
      {saveFrameButton}
      <Link href="/info/d87ab2c1-94ca-49e1-8bd7-756bf848f2a6">Play Game</Link>
    </div>
  );
}
