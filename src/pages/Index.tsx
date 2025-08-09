import Sidebar from "@/components/layout/Sidebar";
import MainContent from "@/components/layout/MainContent";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <MainContent />
    </div>
  );
};

export default Index;
