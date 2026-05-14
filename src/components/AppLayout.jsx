import BottomNav from './BottomNav.jsx';
import MobileHeader from './MobileHeader.jsx';

export default function AppLayout({ activeTab, onTabChange, title, subtitle, action, children }) {
  return (
    <div className="min-h-screen text-slate-950">
      <MobileHeader title={title} subtitle={subtitle} action={action} />
      <main className="mx-auto max-w-md px-4 pb-28 pt-4">{children}</main>
      <BottomNav activeTab={activeTab} onChange={onTabChange} />
    </div>
  );
}
