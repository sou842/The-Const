import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { PublicPanel } from "@/components/RightSidebar";

interface AppLayoutProps {
  children: ReactNode;
  layout?: 'default' | 'full' | 'editor';
}

export const AppLayout = ({ children, layout = 'default' }: AppLayoutProps) => {

  switch (layout) {
    case 'full':
      return (
        <div className="min-h-screen bg-background">
          <div className="w-full md:block hidden">
            <TopBar />
          </div>
          <div className="flex">
            <Sidebar />
            <main className={`flex-1 ml-0 md:ml-64 mt-0 md:mt-14 min-h-[calc(100vh-3.5rem)] max-w-full`}>
              <div className={'max-w-full p-0 md:p-6'}>
                {children}
              </div>
            </main>
            {/* <RightSidebar /> */}
          </div>
        </div>
      );
    case 'editor':
      return (
        <div className="min-h-screen bg-background">
          <TopBar />
          <div className="flex">
            <Sidebar />
            <main className={`w-full flex-1 flex justify-center ml-0 md:ml-64 mt-14 xl:mr-80 min-h-[calc(100vh-3.5rem)] overflow-y-auto`}>
              <div className={'w-full max-w-4xl p-4 md:p-6'}>
                {children}
              </div>
            </main>
            {/* <RightSidebar /> */}
          </div>
        </div>
      );
    default:
      return (
        <div className="min-h-screen bg-background">
          <TopBar />
          <div className="flex">
            <Sidebar />
            <main className={`w-full flex-1 flex justify-center ml-0 md:ml-64 mt-14 xl:mr-80 min-h-[calc(100vh-3.5rem)] overflow-y-auto`}>
              <div className={'w-full max-w-4xl p-4 md:p-6'}>
                {children}
              </div>
            </main>
            <PublicPanel />
          </div>
        </div>
      );
  };
}
