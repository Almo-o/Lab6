"use client";

import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleCheck,
  CircleDollarSign,
  CircleHelp,
  Clock3,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Plus,
  ReceiptText,
  Send,
  Sparkles,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Balance, Expense, Group, Payment, Person } from "@/lib/types";

type View = "overview" | "group" | "activity" | "reports";
type Report = {
  group: { id: string; name: string; emoji: string; currency: string };
  expenses: { id: string; description: string; amountCents: number; date: string; payer: Person }[];
  payments: Payment[];
  totalExpensesCents: number;
  totalPaymentsCents: number;
  currentBalances: Balance[];
};

const demoUserId = "avery";

function localDateValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function currency(cents: number, code = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en-US", options).format(new Date(value));
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

async function fetchGroups(): Promise<Group[]> {
  const response = await fetch("/api/groups");
  const result: unknown = await response.json();
  if (!response.ok) throw new Error(isErrorResponse(result) ? result.error : "Could not load your groups.");
  if (!Array.isArray(result)) throw new Error("The group response was unexpected.");
  return result as Group[];
}

function Avatar({ person, size = "normal" }: { person: Person; size?: "normal" | "small" | "large" }) {
  return (
    <span className={`avatar avatar-${size}`} style={{ backgroundColor: person.color }} aria-label={person.name} title={person.name}>
      {person.initials}
    </span>
  );
}

function IconButton({
  label,
  onClick,
  children,
  className = "",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return <button aria-label={label} className={`icon-button ${className}`} onClick={onClick} type="button">{children}</button>;
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [view, setView] = useState<View>("overview");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [showExpense, setShowExpense] = useState(false);
  const [paymentBalance, setPaymentBalance] = useState<Balance | null>(null);
  const [reviewExpense, setReviewExpense] = useState<Expense | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [reportStart, setReportStart] = useState(localDateValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [reportEnd, setReportEnd] = useState(localDateValue());
  const [report, setReport] = useState<Report | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0];
  const currentUser = selectedGroup?.members.find((member) => member.id === demoUserId);
  const pendingExpenses = useMemo(
    () => selectedGroup?.expenses.filter((expense) => expense.status === "pending") ?? [],
    [selectedGroup],
  );
  const myOwed = selectedGroup?.balances
    .filter((balance) => balance.fromUserId === demoUserId)
    .reduce((total, balance) => total + balance.amountCents, 0) ?? 0;
  const owedToMe = selectedGroup?.balances
    .filter((balance) => balance.toUserId === demoUserId)
    .reduce((total, balance) => total + balance.amountCents, 0) ?? 0;
  const thisMonthSpend = selectedGroup?.expenses
    .filter((expense) => {
      const date = new Date(expense.date);
      const now = new Date();
      return expense.status === "approved" && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((total, expense) => total + expense.amountCents, 0) ?? 0;

  const loadGroups = useCallback(async () => {
    try {
      const result = await fetchGroups();
      setLoadError("");
      setGroups(result);
      setSelectedGroupId((existing) => result.some((group) => group.id === existing) ? existing : result[0]?.id ?? "");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load your groups.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchGroups()
      .then((result) => {
        if (!active) return;
        setGroups(result);
        setSelectedGroupId((existing) => result.some((group) => group.id === existing) ? existing : result[0]?.id ?? "");
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Could not load your groups.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (view === "reports" && selectedGroup && !report) void loadReport();
    // Load the report only when the reports view is first opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedGroup?.id]);

  async function loadReport() {
    if (!selectedGroup) return;
    setReportLoading(true);
    setReportError("");
    try {
      const params = new URLSearchParams({ groupId: selectedGroup.id, from: reportStart, to: reportEnd });
      const response = await fetch(`/api/reports?${params}`);
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(isErrorResponse(result) ? result.error : "Could not load the report.");
      setReport(result as Report);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Could not load the report.");
    } finally {
      setReportLoading(false);
    }
  }

  async function sendAction(url: string, method: "POST" | "PATCH", body: object, success: string) {
    setActionError("");
    setBusy(true);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(isErrorResponse(result) ? result.error : "That action couldn’t be completed.");
      setNotice(success);
      setShowExpense(false);
      setPaymentBalance(null);
      setReviewExpense(null);
      setReviewReason("");
      await loadGroups();
      if (view === "reports") await loadReport();
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "That action couldn’t be completed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function chooseView(next: View) {
    setView(next);
    setMobileNavOpen(false);
    setActionError("");
  }

  function chooseGroup(groupId: string) {
    setSelectedGroupId(groupId);
    setReport(null);
    setReportError("");
  }

  async function submitReview(decision: "approved" | "rejected") {
    if (!reviewExpense) return;
    if (decision === "rejected" && !reviewReason.trim()) {
      setActionError("Add a short reason before rejecting this expense.");
      return;
    }
    await sendAction(
      `/api/expenses/${reviewExpense.id}/review`,
      "PATCH",
      { decision, reason: reviewReason },
      decision === "approved" ? "Expense approved. Balances are up to date." : "Expense rejected. The submitter can see your note.",
    );
  }

  if (loading) {
    return <div className="loading-screen"><span className="brand-mark brand-mark-large"><ArrowLeftRight /></span><LoaderCircle className="spin" size={20} /> Setting up your SplitSmart space…</div>;
  }

  if (loadError && groups.length === 0) {
    return <div className="load-error"><AlertCircle size={24} /><h1>We couldn’t load SplitSmart</h1><p>{loadError}</p><button className="button button-primary"     onClick={() => { setLoadError(""); void loadGroups(); }}>Try again</button></div>;
  }

  if (!selectedGroup) {
    return <div className="load-error"><CircleHelp size={24} /><h1>No groups yet</h1><p>Run the demo seed command to add a sample household and trip group.</p><code>npm run db:seed</code></div>;
  }

  const mainContent = (
    <>
      {view === "overview" && (
        <Overview
          group={selectedGroup}
          groups={groups}
          selectedGroupId={selectedGroup.id}
          onGroupChange={chooseGroup}
          currentUser={currentUser}
          myOwed={myOwed}
          owedToMe={owedToMe}
          thisMonthSpend={thisMonthSpend}
          pendingExpenses={pendingExpenses}
          onAddExpense={() => { setActionError(""); setShowExpense(true); }}
          onReview={(expense) => { setActionError(""); setReviewExpense(expense); }}
          onView={chooseView}
        />
      )}
      {view === "group" && (
        <GroupView
          group={selectedGroup}
          groups={groups}
          onGroupChange={chooseGroup}
          onAddExpense={() => { setActionError(""); setShowExpense(true); }}
          onPay={(balance) => { setActionError(""); setPaymentBalance(balance); }}
        />
      )}
      {view === "activity" && (
        <ActivityView group={selectedGroup} onAddExpense={() => { setActionError(""); setShowExpense(true); }} />
      )}
      {view === "reports" && (
        <ReportsView
          group={selectedGroup}
          start={reportStart}
          end={reportEnd}
          report={report}
          loading={reportLoading}
          error={reportError}
          onStart={setReportStart}
          onEnd={setReportEnd}
          onPay={(balance) => { setActionError(""); setPaymentBalance(balance); }}
          onRun={() => { setReport(null); void loadReport(); }}
        />
      )}
    </>
  );

  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark"><ArrowLeftRight size={19} strokeWidth={2.5} /></span>
          <span className="brand-word">split<span>smart</span></span>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          <NavItem active={view === "overview"} onClick={() => chooseView("overview")} icon={<LayoutDashboard size={18} />}>Overview</NavItem>
          <NavItem active={view === "group"} onClick={() => chooseView("group")} icon={<UsersRound size={18} />}>Your groups</NavItem>
          <NavItem active={view === "activity"} onClick={() => chooseView("activity")} icon={<ReceiptText size={18} />}>All activity</NavItem>
          <NavItem active={view === "reports"} onClick={() => chooseView("reports")} icon={<ChartNoAxesCombined size={18} />}>Reports</NavItem>
        </nav>
        <div className="side-section">
          <div className="side-section-heading"><span>YOUR GROUPS</span><button aria-label="Add group" title="Group creation is not part of this demo" className="side-add" type="button"><Plus size={15} /></button></div>
          {groups.map((group) => (
            <button key={group.id} className={`group-nav-item ${group.id === selectedGroup.id && view === "group" ? "selected" : ""}`} onClick={() => { chooseGroup(group.id); chooseView("group"); }}>
              <span className="group-emoji">{group.emoji}</span><span className="group-nav-name">{group.name}</span>
              <span className="group-nav-count">{group.members.length}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="demo-note"><Sparkles size={16} /><div><strong>Demo workspace</strong><span>Sample data · local only</span></div></div>
          <button className="profile-button" type="button" title="Demo identity is fixed for this prototype">
            <Avatar person={currentUser ?? { id: "avery", name: "Avery Morgan", initials: "AM", color: "#e7a582" }} />
            <span className="profile-copy"><strong>Avery Morgan</strong><small>Demo account</small></span><ChevronDown size={16} className="profile-chevron" />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <IconButton label="Open navigation" className="mobile-menu" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></IconButton>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{viewLabel(view)}</strong></div>
          <div className="topbar-right">
            <span className="demo-badge"><span /> Prototype mode</span>
            <span className="topbar-divider" />
            <button className="topbar-icon" aria-label="Notifications" title="Demo notifications are shown in the pending review queue"><Bell size={18} /><i /></button>
            <div className="topbar-avatar"><Avatar person={currentUser ?? { id: "avery", name: "Avery Morgan", initials: "AM", color: "#e7a582" }} size="small" /></div>
          </div>
        </header>
        <main className="main-content">
          {loadError && <div className="inline-alert"><AlertCircle size={17} />{loadError}<button onClick={() => void loadGroups()}>Retry</button></div>}
          {mainContent}
        </main>
      </div>
      {notice && <div className="toast"><CircleCheck size={18} />{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}><X size={15} /></button></div>}
      {showExpense && (
        <ExpenseDialog
          group={selectedGroup}
          busy={busy}
          error={actionError}
          onClose={() => { setShowExpense(false); setActionError(""); }}
          onSubmit={(body) => void sendAction("/api/expenses", "POST", body, "Expense submitted for review.")}
        />
      )}
      {paymentBalance && (
        <PaymentDialog
          group={selectedGroup}
          balance={paymentBalance}
          busy={busy}
          error={actionError}
          onClose={() => { setPaymentBalance(null); setActionError(""); }}
          onSubmit={(body) => void sendAction("/api/payments", "POST", body, "Payment recorded. Balance updated.")}
        />
      )}
      {reviewExpense && (
        <ReviewDialog
          expense={reviewExpense}
          group={selectedGroup}
          reason={reviewReason}
          busy={busy}
          error={actionError}
          onReason={setReviewReason}
          onClose={() => { setReviewExpense(null); setActionError(""); }}
          onApprove={() => void submitReview("approved")}
          onReject={() => void submitReview("rejected")}
        />
      )}
    </div>
  );
}

function isErrorResponse(value: unknown): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string";
}

function viewLabel(view: View) {
  return ({ overview: "Overview", group: "Your groups", activity: "All activity", reports: "Reports" })[view];
}

function NavItem({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return <button type="button" className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>{icon}<span>{children}</span>{active && <span className="nav-active-dot" />}</button>;
}

function Overview({
  group, groups, selectedGroupId, onGroupChange, currentUser, myOwed, owedToMe, thisMonthSpend,
  pendingExpenses, onAddExpense, onReview, onView,
}: {
  group: Group;
  groups: Group[];
  selectedGroupId: string;
  onGroupChange: (id: string) => void;
  currentUser?: Person;
  myOwed: number;
  owedToMe: number;
  thisMonthSpend: number;
  pendingExpenses: Expense[];
  onAddExpense: () => void;
  onReview: (expense: Expense) => void;
  onView: (view: View) => void;
}) {
  const recent = mergeActivity(group).slice(0, 5);
  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div><p className="eyebrow">{formatDate(new Date().toISOString(), { weekday: "long", month: "long", day: "numeric" })}</p><h1>{getGreeting()}, {currentUser?.name.split(" ")[0] ?? "there"} <span className="wave">✦</span></h1><p className="welcome-subtitle">Here’s your shared-money snapshot.</p></div>
        <button className="button button-primary" onClick={onAddExpense}><Plus size={17} /> Add an expense</button>
      </section>
      <section className="hero-panel">
        <div className="hero-decoration hero-decoration-one" /><div className="hero-decoration hero-decoration-two" />
        <div className="hero-top"><div className="hero-group-icon">{group.emoji}</div><span className="hero-kicker">YOUR SHARED SPACE</span></div>
        <div className="hero-title-row">
          <div><h2>{group.name}</h2><p>{group.description}</p></div>
          <label className="group-select-wrap"><span className="sr-only">Choose group</span><select value={selectedGroupId} onChange={(event) => onGroupChange(event.target.value)}>{groups.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><ChevronDown size={15} /></label>
        </div>
        <div className="hero-bottom">
          <div className="hero-balance-block"><span className="hero-balance-label">YOUR NET BALANCE</span><strong className={owedToMe - myOwed >= 0 ? "positive" : ""}>{currency(owedToMe - myOwed, group.currency)}</strong></div>
          <div className="hero-metric"><span>YOU OWE</span><strong>{currency(myOwed, group.currency)}</strong></div>
          <div className="hero-metric"><span>OWED TO YOU</span><strong>{currency(owedToMe, group.currency)}</strong></div>
          <div className="hero-avatars"><span className="hero-members-label">{group.members.length} members</span><div className="avatar-stack">{group.members.slice(0, 4).map((person) => <Avatar key={person.id} person={person} size="small" />)}</div></div>
        </div>
      </section>
      <section className="stats-grid">
        <StatCard label="Group spending" value={currency(thisMonthSpend, group.currency)} caption="Approved · this month" icon={<WalletCards size={18} />} tone="mint" />
        <StatCard label="You owe" value={currency(myOwed, group.currency)} caption={myOwed ? "Across this group" : "You’re all settled up"} icon={<ArrowUpRight size={18} />} tone="peach" />
        <StatCard label="Owed to you" value={currency(owedToMe, group.currency)} caption={owedToMe ? "Across this group" : "Nothing to collect yet"} icon={<ArrowDownLeft size={18} />} tone="lavender" />
      </section>
      <div className="dashboard-columns">
        <section className="panel activity-panel">
          <div className="panel-heading"><div><h3>Recent activity</h3><p>The latest from {group.name}</p></div><button className="text-button" onClick={() => onView("activity")}>See all <ArrowRight size={15} /></button></div>
          {recent.length ? <div className="activity-list">{recent.map((item) => <ActivityRow key={`${item.type}-${item.id}`} item={item} currencyCode={group.currency} />)}</div> : <EmptyState title="A fresh start" detail="Add your first shared expense to get things moving." />}
        </section>
        <section className="panel approvals-panel">
          <div className="panel-heading"><div className="heading-with-count"><h3>Needs your review</h3>{pendingExpenses.length > 0 && <span className="count-pill">{pendingExpenses.length}</span>}</div><p>Only approved expenses change balances.</p></div>
          {pendingExpenses.length ? <div className="approval-list">{pendingExpenses.slice(0, 3).map((expense) => <PendingCard key={expense.id} expense={expense} currencyCode={group.currency} onReview={() => onReview(expense)} />)}{pendingExpenses.length > 3 && <button className="text-button approval-more" onClick={() => onView("activity")}>View {pendingExpenses.length - 3} more <ArrowRight size={15} /></button>}</div> : <EmptyState title="All caught up" detail="New expenses waiting for your review will show up here." icon={<CircleCheck size={21} />} />}
        </section>
      </div>
      <div className="section-footer"><span><CircleCheck size={15} /> Balances include approved expenses only</span><button className="text-button" onClick={() => onView("group")}>View group details <ArrowRight size={15} /></button></div>
    </div>
  );
}

function StatCard({ label, value, caption, icon, tone }: { label: string; value: string; caption: string; icon: React.ReactNode; tone: string }) {
  return <div className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div className="stat-label">{label}</div><strong className="stat-value">{value}</strong><span className="stat-caption">{caption}</span></div>;
}

type Activity = { type: "expense"; id: string; date: string; expense: Expense } | { type: "payment"; id: string; date: string; payment: Payment };

function mergeActivity(group: Group): Activity[] {
  return [
    ...group.expenses.map((expense): Activity => ({ type: "expense", id: expense.id, date: expense.date, expense })),
    ...group.payments.map((payment): Activity => ({ type: "payment", id: payment.id, date: payment.date, payment })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function ActivityRow({ item, currencyCode }: { item: Activity; currencyCode: string }) {
  if (item.type === "payment") {
    return <div className="activity-row"><span className="activity-icon payment-icon"><ArrowLeftRight size={17} /></span><div className="activity-main"><strong>{item.payment.fromUser.name} paid {item.payment.toUser.name}</strong><span>{item.payment.note || "Payment recorded"} · {formatDate(item.date)}</span></div><strong className="activity-amount payment-amount">+{currency(item.payment.amountCents, currencyCode)}</strong></div>;
  }
  const { expense } = item;
  const statusClass = expense.status === "approved" ? "status-approved" : expense.status === "rejected" ? "status-rejected" : "status-pending";
  return <div className="activity-row"><Avatar person={expense.payer} size="small" /><div className="activity-main"><strong>{expense.description}</strong><span>Paid by {expense.payer.name.split(" ")[0]} · {formatDate(item.date)}</span>{expense.reviewNote && <span className="activity-note">Review note: {expense.reviewNote}</span>}</div><div className="activity-value-stack"><strong className="activity-amount">{currency(expense.amountCents, currencyCode)}</strong><span className={`status-tag ${statusClass}`}>{expense.status}</span></div></div>;
}

function PendingCard({ expense, currencyCode, onReview }: { expense: Expense; currencyCode: string; onReview: () => void }) {
  return <div className="pending-card"><div className="pending-card-top"><Avatar person={expense.submitter} size="small" /><span className="pending-when">{formatDate(expense.date, { month: "short", day: "numeric" })}</span><span className="pending-tag"><Clock3 size={12} /> Review</span></div><strong className="pending-title">{expense.description}</strong><div className="pending-meta"><span>Added by {expense.submitter.name.split(" ")[0]}</span><strong>{currency(expense.amountCents, currencyCode)}</strong></div><button className="button button-review" onClick={onReview}><Check size={15} /> Review expense</button></div>;
}

function EmptyState({ title, detail, icon = <Sparkles size={21} /> }: { title: string; detail: string; icon?: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><strong>{title}</strong><p>{detail}</p></div>;
}

function GroupView({
  group, groups, onGroupChange, onAddExpense, onPay,
}: { group: Group; groups: Group[]; onGroupChange: (id: string) => void; onAddExpense: () => void; onPay: (balance: Balance) => void }) {
  return (
    <div className="page-stack">
      <PageTitle eyebrow="YOUR CIRCLES" title="Groups & balances" subtitle="Keep tabs on the people and plans you share." action={<button className="button button-primary" onClick={onAddExpense}><Plus size={17} /> Add an expense</button>} />
      <div className="group-tabs">{groups.map((item) => <button key={item.id} className={`group-tab ${item.id === group.id ? "active" : ""}`} onClick={() => onGroupChange(item.id)}><span>{item.emoji}</span>{item.name}</button>)}</div>
      <section className="group-profile panel"><span className="group-profile-emoji">{group.emoji}</span><div className="group-profile-copy"><h2>{group.name}</h2><p>{group.description} <span>·</span> {group.members.length} members</p></div><div className="member-stack">{group.members.map((person) => <Avatar key={person.id} person={person} size="small" />)}</div></section>
      <div className="group-detail-grid">
        <section className="panel"><div className="panel-heading"><div><h3>People in this group</h3><p>Everyone sharing expenses here</p></div><span className="light-count">{group.members.length}</span></div><div className="member-list">{group.members.map((person) => {
          const owes = group.balances.filter((balance) => balance.fromUserId === person.id).reduce((sum, balance) => sum + balance.amountCents, 0);
          const owed = group.balances.filter((balance) => balance.toUserId === person.id).reduce((sum, balance) => sum + balance.amountCents, 0);
          const net = owed - owes;
          return <div key={person.id} className="member-row"><Avatar person={person} /><div className="member-info"><strong>{person.name}{person.id === demoUserId && <span className="you-label">you</span>}</strong><span>{person.role === "owner" ? "Group owner" : "Member"}</span></div><span className={`member-balance ${net > 0 ? "green" : net < 0 ? "dark" : ""}`}>{net > 0 ? `gets back ${currency(net, group.currency)}` : net < 0 ? `owes ${currency(-net, group.currency)}` : "settled up"}</span></div>;
        })}</div></section>
        <section className="panel"><div className="panel-heading"><div><h3>Open balances</h3><p>Settle up directly, pair by pair</p></div><span className="light-count">{group.balances.length}</span></div>{group.balances.length ? <div className="balance-list">{group.balances.map((balance) => <BalanceRow key={`${balance.fromUserId}-${balance.toUserId}`} balance={balance} currencyCode={group.currency} onPay={() => onPay(balance)} />)}</div> : <EmptyState title="Nothing to settle" detail="Everyone is all squared away." icon={<CircleCheck size={21} />} />}</section>
      </div>
      <section className="panel expenses-panel"><div className="panel-heading"><div><h3>Group expenses</h3><p>Pending expenses are not included in balances.</p></div><span className="light-count">{group.expenses.length}</span></div><ExpenseTable expenses={group.expenses} currencyCode={group.currency} /></section>
    </div>
  );
}

function BalanceRow({ balance, currencyCode, onPay }: { balance: Balance; currencyCode: string; onPay: () => void }) {
  if (!balance.fromUser || !balance.toUser) return null;
  return <div className="balance-row"><Avatar person={balance.fromUser} size="small" /><div className="balance-description"><strong>{balance.fromUser.name.split(" ")[0]} <span>owes</span> {balance.toUser.name.split(" ")[0]}</strong><span>Direct balance</span></div><strong className="balance-amount">{currency(balance.amountCents, currencyCode)}</strong><button className="settle-button" onClick={onPay}>Settle</button></div>;
}

function ExpenseTable({ expenses, currencyCode }: { expenses: Expense[]; currencyCode: string }) {
  if (!expenses.length) return <EmptyState title="No expenses yet" detail="Your group’s expenses will appear here." />;
  return <div className="table-scroll"><table className="expense-table"><thead><tr><th>DESCRIPTION</th><th>DATE</th><th>PAID BY</th><th>SHARED WITH</th><th>STATUS</th><th className="align-right">AMOUNT</th></tr></thead><tbody>{expenses.map((expense) => <tr key={expense.id}><td><strong className="table-expense-name">{expense.description}</strong><span className="table-split">{expense.splitType === "percentage" ? "Percentage split" : "Equal split"}</span></td><td>{formatDate(expense.date, { month: "short", day: "numeric", year: "numeric" })}</td><td><span className="table-person"><Avatar person={expense.payer} size="small" />{expense.payer.name.split(" ")[0]}</span></td><td>{expense.shares.length} people</td><td><span className={`status-tag status-${expense.status}`}>{expense.status}</span></td><td className="align-right table-amount">{currency(expense.amountCents, currencyCode)}</td></tr>)}</tbody></table></div>;
}

function ActivityView({ group, onAddExpense }: { group: Group; onAddExpense: () => void }) {
  const activity = mergeActivity(group);
  return <div className="page-stack"><PageTitle eyebrow="THE LEDGER" title="All activity" subtitle={`Every expense and settlement in ${group.name}.`} action={<button className="button button-primary" onClick={onAddExpense}><Plus size={17} /> Add an expense</button>} /><div className="panel full-activity"><div className="panel-heading"><div><h3>Activity timeline</h3><p>Most recent first · {group.name}</p></div><span className="light-count">{activity.length}</span></div>{activity.length ? <div className="activity-list">{activity.map((item) => <ActivityRow key={`${item.type}-${item.id}`} item={item} currencyCode={group.currency} />)}</div> : <EmptyState title="No activity yet" detail="Add an expense to start the group ledger." />}</div></div>;
}

function ReportsView({ group, start, end, report, loading, error, onStart, onEnd, onPay, onRun }: { group: Group; start: string; end: string; report: Report | null; loading: boolean; error: string; onStart: (value: string) => void; onEnd: (value: string) => void; onPay: (balance: Balance) => void; onRun: () => void }) {
  return (
    <div className="page-stack"><PageTitle eyebrow="YOUR NUMBERS" title="Spending report" subtitle="A clearer picture of what your group shares." />
      <form className="report-filter panel" onSubmit={(event) => { event.preventDefault(); onRun(); }}><div className="report-filter-label"><span className="filter-icon"><CalendarDays size={17} /></span><div><strong>Pick a date range</strong><span>Includes approved expenses and recorded payments.</span></div></div><label>FROM<input type="date" value={start} onChange={(event) => onStart(event.target.value)} required /></label><label>TO<input type="date" value={end} onChange={(event) => onEnd(event.target.value)} required /></label><button className="button button-dark" disabled={loading}>{loading ? <LoaderCircle size={16} className="spin" /> : <ArrowRight size={16} />} Run report</button></form>
      {error && <div className="inline-alert"><AlertCircle size={17} />{error}</div>}
      {report ? <><div className="stats-grid report-stats"><StatCard label="Approved expenses" value={currency(report.totalExpensesCents, group.currency)} caption={`${report.expenses.length} expenses in this period`} icon={<ReceiptText size={18} />} tone="mint" /><StatCard label="Payments recorded" value={currency(report.totalPaymentsCents, group.currency)} caption={`${report.payments.length} settlements in this period`} icon={<ArrowLeftRight size={18} />} tone="lavender" /><StatCard label="Open balances" value={currency(report.currentBalances.reduce((sum, item) => sum + item.amountCents, 0), group.currency)} caption="Current · across all dates" icon={<CircleDollarSign size={18} />} tone="peach" /></div>
        <div className="report-columns"><section className="panel"><div className="panel-heading"><div><h3>Expenses in period</h3><p>{formatDate(`${start}T12:00:00`)} – {formatDate(`${end}T12:00:00`, { month: "short", day: "numeric", year: "numeric" })}</p></div><span className="light-count">{report.expenses.length}</span></div>{report.expenses.length ? <div className="report-line-list">{report.expenses.map((expense) => <div key={expense.id} className="report-line"><span className="report-line-icon"><ReceiptText size={16} /></span><span className="report-line-copy"><strong>{expense.description}</strong><small>{expense.payer.name.split(" ")[0]} paid · {formatDate(expense.date)}</small></span><strong>{currency(expense.amountCents, group.currency)}</strong></div>)}</div> : <EmptyState title="No expenses in this range" detail="Try a wider range to see your shared spending." />}</section>
          <section className="panel"><div className="panel-heading"><div><h3>Payments in period</h3><p>Settlements recorded in this date range</p></div><span className="light-count">{report.payments.length}</span></div>{report.payments.length ? <div className="report-line-list">{report.payments.map((payment) => <div key={payment.id} className="report-line"><span className="report-line-icon payment-icon"><ArrowLeftRight size={16} /></span><span className="report-line-copy"><strong>{payment.fromUser.name.split(" ")[0]} paid {payment.toUser.name.split(" ")[0]}</strong><small>{payment.note || "Payment"} · {formatDate(payment.date)}</small></span><strong>{currency(payment.amountCents, group.currency)}</strong></div>)}</div> : <EmptyState title="No payments in this range" detail="Payments will appear here after someone settles up." />}</section></div>
        <section className="panel current-balances-panel"><div className="panel-heading"><div><h3>Balances right now</h3><p>Current pairwise totals, regardless of report dates.</p></div><span className="live-tag"><span /> LIVE</span></div>{report.currentBalances.length ? <div className="balance-list">{report.currentBalances.map((balance) => <BalanceRow key={`${balance.fromUserId}-${balance.toUserId}`} balance={balance} currencyCode={group.currency} onPay={() => onPay(balance)} />)}</div> : <EmptyState title="Everyone is settled" detail="There are no open balances in this group." icon={<CircleCheck size={21} />} />}</section>
      </> : !loading && !error ? <div className="report-placeholder"><ChartNoAxesCombined size={24} /><strong>Your report will appear here</strong><span>Pick a date range above to get started.</span></div> : null}
    </div>
  );
}

function PageTitle({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <section className="page-title-row"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="welcome-subtitle">{subtitle}</p></div>{action}</section>;
}

function ExpenseDialog({ group, busy, error, onClose, onSubmit }: { group: Group; busy: boolean; error: string; onClose: () => void; onSubmit: (body: object) => void }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(localDateValue());
  const [payerId, setPayerId] = useState(demoUserId);
  const [splitType, setSplitType] = useState<"equal" | "percentage">("equal");
  const [participantIds, setParticipantIds] = useState(group.members.map((person) => person.id));
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState("");

  const participants = group.members.filter((person) => participantIds.includes(person.id));
  const selectedPayerId = participants.some((person) => person.id === payerId) ? payerId : participants[0]?.id ?? "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");
    if (!participants.length) {
      setLocalError("Choose at least one person to share this expense.");
      return;
    }
    if (splitType === "percentage" && participants.reduce((sum, person) => sum + Math.round((Number(percentages[person.id] ?? (100 / participants.length)) || 0) * 100), 0) !== 10000) {
      setLocalError("Percentage shares must add up to exactly 100%.");
      return;
    }
    onSubmit({
      groupId: group.id,
      description,
      amount,
      date,
      payerId: selectedPayerId,
      splitType,
      participants: participants.map((person) => ({
        userId: person.id,
        percentage: percentages[person.id] ?? String((100 / participants.length).toFixed(2)),
      })),
    });
  }

  return <Modal title="Add an expense" subtitle={`Add something shared with ${group.name}.`} onClose={onClose} icon={<ReceiptText size={18} />}>
    <form className="modal-form" onSubmit={submit}>
      <label className="field-label">WHAT WAS IT?<input autoFocus value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Groceries, dinner…" maxLength={120} required /></label>
      <div className="form-two-col"><label className="field-label">AMOUNT<input type="text" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" pattern="^[0-9]{1,7}(?:\\.[0-9]{1,2})?$" required /><span className="field-hint">In {group.currency} · no symbols needed</span></label><label className="field-label">DATE<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label></div>
      <label className="field-label">PAID BY<select value={selectedPayerId} onChange={(event) => setPayerId(event.target.value)}>{participants.map((person) => <option key={person.id} value={person.id}>{person.name}{person.id === demoUserId ? " (you)" : ""}</option>)}</select></label>
      <fieldset className="split-fieldset"><legend>HOW SHOULD IT SPLIT?</legend><div className="split-toggle"><button className={splitType === "equal" ? "selected" : ""} type="button" onClick={() => setSplitType("equal")}><UsersRound size={15} /> Equally</button><button className={splitType === "percentage" ? "selected" : ""} type="button" onClick={() => setSplitType("percentage")}><ChartNoAxesCombined size={15} /> By percentage</button></div></fieldset>
      <fieldset className="participant-fieldset"><legend>WHO SHARES THIS? <span>{participants.length} selected</span></legend><div className="participant-list">{group.members.map((person) => {
        const checked = participantIds.includes(person.id);
        return <label key={person.id} className={`participant-option ${checked ? "checked" : ""}`}><input type="checkbox" checked={checked} onChange={() => setParticipantIds((selected) => checked ? selected.filter((id) => id !== person.id) : [...selected, person.id])} /><Avatar person={person} size="small" /><span>{person.name}{person.id === demoUserId ? <small>you</small> : null}</span>{splitType === "percentage" && checked && <span className="percentage-input-wrap"><input aria-label={`${person.name} percentage`} type="number" min="0.01" max="100" step="0.01" value={percentages[person.id] ?? (100 / participants.length).toFixed(2)} onChange={(event) => setPercentages((previous) => ({ ...previous, [person.id]: event.target.value }))} /><span>%</span></span>}</label>;
      })}</div></fieldset>
      {(error || localError) && <div className="form-error"><AlertCircle size={16} />{localError || error}</div>}
      <div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <Send size={15} />} Submit for review</button></div>
      <p className="modal-footnote"><Clock3 size={13} /> This expense won’t affect balances until it’s approved.</p>
    </form>
  </Modal>;
}

function PaymentDialog({ group, balance, busy, error, onClose, onSubmit }: { group: Group; balance: Balance; busy: boolean; error: string; onClose: () => void; onSubmit: (body: object) => void }) {
  const [amount, setAmount] = useState((balance.amountCents / 100).toFixed(2));
  const [date, setDate] = useState(localDateValue());
  const [note, setNote] = useState("");
  if (!balance.fromUser || !balance.toUser) return null;
  return <Modal title="Record a payment" subtitle={`${balance.fromUser.name.split(" ")[0]} pays ${balance.toUser.name.split(" ")[0]}.`} onClose={onClose} icon={<ArrowLeftRight size={18} />}>
    <form className="modal-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ groupId: group.id, fromUserId: balance.fromUserId, toUserId: balance.toUserId, amount, date, note }); }}>
      <div className="settlement-summary"><div className="settlement-people"><Avatar person={balance.fromUser} /><ArrowRight size={17} /><Avatar person={balance.toUser} /></div><div><strong>{currency(balance.amountCents, group.currency)}</strong><span>currently owed</span></div></div>
      <label className="field-label">PAYMENT AMOUNT<input type="text" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" pattern="^[0-9]{1,7}(?:\\.[0-9]{1,2})?$" required /><span className="field-hint">Up to {currency(balance.amountCents, group.currency)}</span></label>
      <div className="form-two-col"><label className="field-label">DATE<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="field-label">NOTE <span className="optional-label">OPTIONAL</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Venmo" maxLength={120} /></label></div>
      {error && <div className="form-error"><AlertCircle size={16} />{error}</div>}
      <div className="prototype-warning"><CircleHelp size={16} /><span>Prototype only. This records a payment you made; it won’t move money or connect to a payment app.</span></div>
      <div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose} disabled={busy}>Cancel</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />} Record payment</button></div>
    </form>
  </Modal>;
}

function ReviewDialog({ expense, group, reason, busy, error, onReason, onClose, onApprove, onReject }: { expense: Expense; group: Group; reason: string; busy: boolean; error: string; onReason: (value: string) => void; onClose: () => void; onApprove: () => void; onReject: () => void }) {
  return <Modal title="Review expense" subtitle="Take a closer look before it changes the group balance." onClose={onClose} icon={<Clock3 size={18} />}>
    <div className="review-detail"><span className="review-expense-emoji">🧾</span><div><strong>{expense.description}</strong><span>Added by {expense.submitter.name} · {formatDate(expense.date, { month: "long", day: "numeric", year: "numeric" })}</span></div><b>{currency(expense.amountCents, group.currency)}</b></div>
    <div className="review-details-row"><span>Paid by <strong>{expense.payer.name}</strong></span><span>{expense.splitType === "equal" ? "Split equally" : "Split by percentage"}</span></div>
    <div className="review-shares">{expense.shares.map((share) => <div key={share.id}><Avatar person={share.user} size="small" /><span>{share.user.name.split(" ")[0]}</span>{share.percentageBps !== null && <small>{(share.percentageBps / 100).toFixed(2)}%</small>}<strong>{currency(share.amountCents, group.currency)}</strong></div>)}</div>
    <label className="field-label review-note-label">REJECTION NOTE <span className="optional-label">REQUIRED TO REJECT</span><textarea rows={2} value={reason} onChange={(event) => onReason(event.target.value)} placeholder="Let them know what to fix…" maxLength={300} /></label>
    {error && <div className="form-error"><AlertCircle size={16} />{error}</div>}
    <div className="review-actions"><button type="button" className="button button-outline reject-button" onClick={onReject} disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <X size={16} />} Reject</button><button type="button" className="button button-primary" onClick={onApprove} disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />} Approve expense</button></div>
    <p className="modal-footnote"><CircleHelp size={13} /> Demo reviewer: Avery Morgan · no real notifications are sent.</p>
  </Modal>;
}

function Modal({ title, subtitle, icon, onClose, children }: { title: string; subtitle: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", handleKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-heading"><div className="modal-heading"><span className="modal-title-icon">{icon}</span><div><h2 id="modal-heading">{title}</h2><p>{subtitle}</p></div><IconButton label="Close dialog" onClick={onClose}><X size={18} /></IconButton></div>{children}</section></div>;
}
