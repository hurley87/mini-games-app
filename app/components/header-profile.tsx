'use client';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from '@/app/components/ui/drawer';
import { Button } from '@/app/components/ui/button';
import Image from 'next/image';
import { List, LogOut, Settings, Trophy, UserPlus } from 'lucide-react';

export function HeaderProfile() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
            <Image
              src="/placeholder.svg?height=32&width=32"
              alt="User avatar"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="flex flex-col h-full">
          <div className="flex-1 p-6">
            {/* Menu Items */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-xl font-semibold">
                <List className="w-6 h-6" />
                <span>Games</span>
              </div>

              <div className="flex items-center gap-4 text-xl font-semibold">
                <Trophy className="w-6 h-6" />
                <span>Leaderboard</span>
              </div>

              <div className="flex items-center gap-4 text-xl font-semibold">
                <Settings className="w-6 h-6" />
                <span>Settings</span>
              </div>

              <div className="flex items-center gap-4 text-xl font-semibold">
                <UserPlus className="w-6 h-6" />
                <span>Invite</span>
              </div>

              <div className="flex items-center gap-4 text-xl font-semibold">
                <LogOut className="w-6 h-6" />
                <span>Log out</span>
              </div>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
