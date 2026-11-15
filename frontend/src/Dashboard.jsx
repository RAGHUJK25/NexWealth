import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  Bell,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Download,
  Gamepad2,
  HeartPulse,
  LayoutDashboard,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  MessageCircle,
  Mail,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Send,
  ShoppingBag,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Telescope,
  Trophy,
  Upload,
  WalletCards,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from './api.js';
import BrandMark from './BrandMark.jsx';
import dashboardIllustration from './dashboard-fintech-illustration.svg';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Transactions', icon: WalletCards },
  { name: 'Analytics', icon: BarChart3 },
  { name: 'Financial health', icon: HeartPulse },
  { name: 'Forecast', icon: Telescope },
  { name: 'Goals', icon: Target },
  { name: 'Savings game', icon: Gamepad2 },
  { name: 'Money quiz', icon: BookOpenCheck },
  { name: 'Reports & export', icon: Download },
  { name: 'Purchase simulator', icon: ShoppingBag },
  { name: 'AI assistant', icon: MessageCircle, isNew: true },
  { name: 'Settings', icon: Settings },
];

const CHART_COLORS = ['#5267A8', '#2A7F72', '#B7833D', '#A25E72', '#7667A9', '#4C8493', '#8C715D', '#6B865B'];
const CASH_FLOW_COLORS = { income: '#2A7F72', expenses: '#B85F55' };
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Housing', 'Other'];
const QUIZ_LEVELS = [
  {
    title: 'Budget basics',
    questions: [
      { prompt: 'What is the main purpose of a monthly budget?', options: ['Plan income and spending before the month ends', 'Spend every rupee that comes in', 'Avoid tracking expenses'], answer: 0 },
      { prompt: 'Which expense is usually a need rather than a want?', options: ['A streaming subscription', 'Basic groceries', 'A new phone upgrade'], answer: 1 },
      { prompt: 'Why keep an emergency fund?', options: ['To cover unexpected costs', 'To guarantee investment returns', 'To avoid making a budget'], answer: 0 },
    ],
  },
  {
    title: 'Saving strategies',
    questions: [
      { prompt: 'You have a savings goal due in six months. What is a useful first step?', options: ['Wait until the final month', 'Borrow the whole amount', 'Divide the target by the months remaining'], answer: 2 },
      { prompt: 'Your monthly plan has no room for savings. What should you review first?', options: ['Your password', 'Your recorded flexible spending', 'Your account balance from last year'], answer: 1 },
      { prompt: 'What does paying yourself first mean?', options: ['Spend on treats before bills', 'Skip tracking transfers', 'Set aside planned savings when income arrives'], answer: 2 },
    ],
  },
  {
    title: 'Borrowing wisely',
    questions: [
      { prompt: 'What does an APR help you compare?', options: ['The yearly cost of borrowing', 'The color of a credit card', 'The amount of tax on groceries'], answer: 0 },
      { prompt: 'Why can paying only a loan minimum cost more over time?', options: ['It automatically increases your income', 'Interest may keep accumulating on the remaining balance', 'It removes the loan early'], answer: 1 },
      { prompt: 'Before taking a loan, which amount matters most to your budget?', options: ['The first payment only', 'The advertised reward points', 'The full repayment amount and schedule'], answer: 2 },
    ],
  },
  {
    title: 'Interest and inflation',
    questions: [
      { prompt: 'What is compound interest?', options: ['A fee charged only once', 'Interest earned on earlier interest as well as principal', 'A fixed monthly budget'], answer: 1 },
      { prompt: 'If prices rise while savings stay unchanged, what usually happens to purchasing power?', options: ['It decreases', 'It doubles', 'It is unaffected in every case'], answer: 0 },
      { prompt: 'Why compare an investment return with inflation?', options: ['To know the exact future market price', 'To avoid recording expenses', 'To understand changes in purchasing power'], answer: 2 },
    ],
  },
  {
    title: 'Planning ahead',
    questions: [
      { prompt: 'Why can diversification reduce concentration risk?', options: ['It guarantees profit', 'It spreads exposure across different assets', 'It removes all market risk'], answer: 1 },
      { prompt: 'What should you do before choosing a long-term financial plan?', options: ['Follow a guaranteed-return claim', 'Ignore emergency needs', 'Consider your timeline, needs, and ability to handle losses'], answer: 2 },
      { prompt: 'Which statement about a forecast is most accurate?', options: ['It is an estimate based on assumptions and can be wrong', 'It guarantees future income', 'It replaces reviewing your records'], answer: 0 },
    ],
  },
];

const money = (value, fractionDigits = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: fractionDigits,
  }).format(Number(value) || 0);

const compactMoney = (value) => {
  const amount = Number(value) || 0;
  if (Math.abs(amount) >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
  return `₹${amount.toFixed(0)}`;
};

const errorMessage = (error) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = Array.isArray(item?.loc)
          ? item.loc.filter((part) => part !== 'body').join('.')
          : '';
        return field ? `${field}: ${item?.msg || 'Invalid input'}` : item?.msg || 'Invalid input';
      })
      .join(', ');
  }
  return error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
};

const today = () => new Date().toISOString().slice(0, 10);
const displayDate = (value) => {
  if (!value) return 'No date set';
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function EmptyState({ icon: Icon = WalletCards, title, detail, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={18} /></span>
      <b>{title}</b>
      <p>{detail}</p>
      {action}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close dialog">
            <X size={17} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function StatCard({ title, value, foot, icon: Icon, tone = 'blue', direction }) {
  const DirectionIcon = direction === 'down' ? ArrowDownRight : ArrowUpRight;
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className={`stat-icon ${tone}`}><Icon size={16} /></span>
      </div>
      <strong>{value}</strong>
      <div className="stat-foot">
        {direction && <span className="positive"><DirectionIcon size={13} /></span>}
        {foot}
      </div>
    </article>
  );
}

function TransactionRows({ rows, onEdit, onDelete }) {
  if (!rows.length) {
    return <EmptyState title="No transactions yet" detail="Add a transaction or import a CSV to start tracking your cash flow." />;
  }
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>TRANSACTION</th>
            <th>DATE</th>
            <th>CATEGORY</th>
            <th>TYPE</th>
            <th className="right">AMOUNT</th>
            {(onEdit || onDelete) && <th className="actions-cell">ACTIONS</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => (
            <tr key={tx.id}>
              <td>
                <div className="tx-title">
                  <i className={`tx-dot ${tx.type}`} />
                  <span><b>{tx.description}</b>{tx.note && <small className="subtle"> · {tx.note}</small>}</span>
                </div>
              </td>
              <td>{displayDate(tx.date)}</td>
              <td><span className="category-pill">{tx.category}</span></td>
              <td><span className={`type-label ${tx.type}`}>{tx.type}</span></td>
              <td className={`right amount ${tx.type}`}>{tx.type === 'income' ? '+' : '−'}{money(tx.amount)}</td>
              {(onEdit || onDelete) && (
                <td className="actions-cell">
                  {onEdit && (
                    <button className="icon-btn small" type="button" onClick={() => onEdit(tx)} aria-label={`Edit ${tx.description}`}>
                      <Pencil size={14} />
                    </button>
                  )}
                  {onDelete && (
                    <button className="icon-btn small danger-hover" type="button" onClick={() => onDelete(tx)} aria-label={`Delete ${tx.description}`}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionEditor({ transaction, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    date: transaction?.date || today(),
    description: transaction?.description || '',
    category: transaction?.category || 'Other',
    type: transaction?.type || 'expense',
    amount: transaction?.amount ?? '',
    note: transaction?.note || '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        amount: Number(form.amount),
        category: form.category || 'Other',
      });
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={transaction ? 'Edit transaction' : 'Add transaction'} onClose={onClose}>
      <form className="stack-form" onSubmit={submit}>
        <div className="form-two">
          <label>Date<input name="date" type="date" required value={form.date} onChange={change} /></label>
          <label>Type
            <select name="type" value={form.type} onChange={change}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
        </div>
        <label>Description<input name="description" required maxLength={200} value={form.description} onChange={change} placeholder="e.g. Monthly salary" /></label>
        <div className="form-two">
          <label>Amount (₹)<input name="amount" type="number" min="0.01" step="0.01" required value={form.amount} onChange={change} /></label>
          <label>Category
            <select name="category" value={form.category} onChange={change}>
              {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              <option value="Income">Income</option>
              <option value="Salary">Salary</option>
            </select>
          </label>
        </div>
        <label>Note (optional)<textarea name="note" rows="2" value={form.note} onChange={change} placeholder="Add a note" /></label>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button className="btn subtle" type="button" onClick={onClose}>Cancel</button>
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}
            {transaction ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function GoalEditor({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', target_amount: '', saved_amount: '0', target_date: '' });
  const [error, setError] = useState('');
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await onSave({
        title: form.title.trim(),
        target_amount: Number(form.target_amount),
        saved_amount: Number(form.saved_amount || 0),
        target_date: form.target_date || null,
      });
    } catch (saveError) {
      setError(errorMessage(saveError));
    }
  };

  return (
    <Modal title="Create a savings goal" onClose={onClose}>
      <form className="stack-form" onSubmit={submit}>
        <label>Goal name<input name="title" required maxLength={120} value={form.title} onChange={change} placeholder="e.g. Emergency fund" /></label>
        <div className="form-two">
          <label>Target amount (₹)<input name="target_amount" type="number" min="0.01" step="0.01" required value={form.target_amount} onChange={change} /></label>
          <label>Already saved (₹)<input name="saved_amount" type="number" min="0" step="0.01" value={form.saved_amount} onChange={change} /></label>
        </div>
        <label>Target date (optional)<input name="target_date" type="date" value={form.target_date} onChange={change} /></label>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button className="btn subtle" type="button" onClick={onClose}>Cancel</button>
          <button className="btn primary" type="submit"><Plus size={15} />Create goal</button>
        </div>
      </form>
    </Modal>
  );
}

function ProgressEditor({ target, onClose, onSave }) {
  const [amount, setAmount] = useState(String(target.amount));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(Number(amount));
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Update ${target.label.toLowerCase()} progress`} onClose={onClose}>
      <form className="stack-form" onSubmit={submit}>
        <p>Enter the total amount saved so far toward <b>{target.title}</b>.</p>
        <label>Amount saved (₹)<input type="number" min="0" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button className="btn subtle" type="button" onClick={onClose}>Cancel</button>
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}
            Save progress
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DashboardHome({ dashboard, health, onNavigate }) {
  const recent = dashboard.recent_transactions || [];
  const categories = dashboard.categories || [];
  const maxCategory = Math.max(...categories.map((item) => item.value), 1);
  return (
    <>
      <section className="dashboard-welcome" aria-labelledby="dashboard-welcome-title">
        <div className="dashboard-welcome-copy">
          <span className="eyebrow">YOUR FINANCIAL OVERVIEW</span>
          <h2 id="dashboard-welcome-title">Money, made clearer.</h2>
          <p>Here is how your recorded finances are looking.</p>
          <button className="btn welcome-action" type="button" onClick={() => onNavigate('Transactions')}><Plus size={15} />Add transaction</button>
        </div>
        <div className="dashboard-welcome-art" aria-hidden="true">
          <img src={dashboardIllustration} alt="" />
          <span className="welcome-art-label"><Activity size={13} /> Your finances, in focus</span>
        </div>
      </section>
      <div className="stats-grid">
        <StatCard title="Net balance" value={money(dashboard.total_balance)} foot="All recorded time" icon={WalletCards} tone="blue" />
        <StatCard title="Income this month" value={money(dashboard.monthly_income)} foot={`${money(dashboard.total_income)} recorded total`} icon={ArrowDownRight} tone="green" direction="up" />
        <StatCard title="Expenses this month" value={money(dashboard.monthly_expenses)} foot={`${money(dashboard.total_expenses)} recorded total`} icon={CreditCard} tone="orange" direction="down" />
        <StatCard title="Monthly savings" value={money(dashboard.monthly_savings)} foot={`${dashboard.transaction_count} transactions recorded`} icon={CircleDollarSign} tone="purple" />
      </div>
      <div className="dashboard-grid">
        <Panel title="Income vs. expenses" subtitle="Recorded activity over the last six months">
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.monthly || []} barGap={7}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 9 }} tickFormatter={compactMoney} />
                <Tooltip formatter={(value) => money(value)} contentStyle={{ borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--text)' }} />
                <Legend wrapperStyle={{ fontSize: 10, color: 'var(--muted)' }} />
                <Bar dataKey="income" name="Income" fill={CASH_FLOW_COLORS.income} radius={[4, 4, 0, 0]} animationDuration={850} />
                <Bar dataKey="expenses" name="Expenses" fill={CASH_FLOW_COLORS.expenses} radius={[4, 4, 0, 0]} animationDuration={850} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Where your money goes" subtitle="Recorded expenses by category">
          {categories.length ? (
            <div className="category-bars">
              {categories.slice(0, 6).map((item, index) => (
                <div className="category-bar" key={item.name}>
                  <div><b>{item.name}</b><span>{money(item.value)}</span></div>
                  <div className="bar-track"><i style={{ width: `${Math.max(3, item.value / maxCategory * 100)}%`, background: CHART_COLORS[index % CHART_COLORS.length] }} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No expense breakdown yet" detail="Add some expenses to see your spending categories." />
          )}
        </Panel>
      </div>
      <Panel title="Recent transactions" subtitle="Your latest recorded activity" action={<button className="text-btn" type="button" onClick={() => onNavigate('Transactions')}>View all <ChevronRight size={14} /></button>}>
        <TransactionRows rows={recent} />
      </Panel>
      {health && (
        <div className="insight-banner">
          <span className="insight-mark"><HeartPulse size={18} /></span>
          <div>
            <b>Your financial health is {health.label.toLowerCase()} ({health.score}/100)</b>
            <p>{health.tips?.[0] || 'Keep recording your activity to improve your insights.'}</p>
          </div>
          <button type="button" onClick={() => onNavigate('Analytics')}>View insights <ChevronRight size={14} /></button>
        </div>
      )}
    </>
  );
}

function AnalyticsPage({ dashboard, analytics, health }) {
  const categories = dashboard.categories || [];
  return (
    <>
      <div className="page-intro">
        <div><span className="eyebrow">UNDERSTAND YOUR PATTERNS</span><h2>Analytics</h2><p>Insights based only on the transactions you have recorded.</p></div>
      </div>
      <div className="stats-grid three">
        <StatCard title="Savings rate this month" value={`${analytics.savings_rate}%`} foot="Income less recorded expenses" icon={CircleDollarSign} tone="green" />
        <StatCard title="Monthly income" value={money(analytics.monthly_income)} foot="Current month" icon={ArrowDownRight} tone="blue" />
        <StatCard title="Monthly expenses" value={money(analytics.monthly_expenses)} foot="Current month" icon={CreditCard} tone="orange" />
      </div>
      <div className="dashboard-grid">
        <Panel title="Monthly cash flow" subtitle="Income and expenses over the last six months">
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthly || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 9 }} tickFormatter={compactMoney} />
                <Tooltip formatter={(value) => money(value)} contentStyle={{ borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--text)' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="income" name="Income" stroke={CASH_FLOW_COLORS.income} strokeWidth={2.5} dot={{ r: 3, fill: CASH_FLOW_COLORS.income, strokeWidth: 0 }} activeDot={{ r: 6 }} animationDuration={850} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke={CASH_FLOW_COLORS.expenses} strokeWidth={2.5} dot={{ r: 3, fill: CASH_FLOW_COLORS.expenses, strokeWidth: 0 }} activeDot={{ r: 6 }} animationDuration={850} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Expense categories" subtitle="All recorded expenses">
          {categories.length ? (
            <div className="donut-wrap">
              <ResponsiveContainer width="58%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" innerRadius="57%" outerRadius="82%" paddingAngle={3} animationDuration={750}>
                    {categories.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => money(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend-list">
                {categories.slice(0, 5).map((item, index) => (
                  <div key={item.name}><i style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} /><span>{item.name}</span><b>{money(item.value)}</b></div>
                ))}
              </div>
            </div>
          ) : <EmptyState title="No category data" detail="Record expenses to generate a category breakdown." />}
        </Panel>
      </div>
      {health && (
        <div className="health-layout">
          <Panel title="Financial health score" subtitle="A snapshot based on recorded transactions">
            <div className="score-wrap">
              <div className="score-ring" style={{ '--score': `${health.score}%` }}><div><strong>{health.score}</strong><span>out of 100</span></div></div>
              <div><span className="score-label">{health.label}</span><h3>Your financial momentum</h3><p>Current recorded savings rate: {health.savings_rate}%</p></div>
            </div>
          </Panel>
          <Panel title="Suggestions" subtitle="Practical next steps based on your records">
            <div className="tips-list">
              {(health.tips || []).map((tip, index) => <div className="tip-row" key={tip}><span>0{index + 1}</span><p>{tip}</p></div>)}
              {!health.tips?.length && <div className="tip-row"><span>01</span><p>Keep tracking your finances to get more personalized insights.</p></div>}
            </div>
          </Panel>
        </div>
      )}
      <p className="disclaimer">Insights are calculated from the data in your account and are educational, not financial advice.</p>
    </>
  );
}

function FinancialHealthPage({ health, onNavigate }) {
  return (
    <>
      <div className="page-intro">
        <div><span className="eyebrow">YOUR FINANCIAL WELLBEING</span><h2>Financial health</h2><p>A practical snapshot based on your recorded activity.</p></div>
      </div>
      <div className="health-layout">
        <Panel title="Your score" subtitle="A snapshot, not a judgment">
          <div className="score-wrap">
            <div className="score-ring" style={{ '--score': `${health.score}%` }}><div><strong>{health.score}</strong><span>out of 100</span></div></div>
            <div><span className="score-label">{health.label}</span><h3>Financial momentum</h3><p>Your recorded savings rate is {health.savings_rate}%.</p></div>
          </div>
        </Panel>
        <Panel title="Your next steps" subtitle="Based on the financial information recorded in your account">
          <div className="tips-list">
            {(health.tips || []).map((tip, index) => <div className="tip-row" key={tip}><span>0{index + 1}</span><p>{tip}</p></div>)}
            {!health.tips?.length && <div className="tip-row"><span>01</span><p>Keep recording your activity to receive more relevant insights.</p></div>}
          </div>
        </Panel>
      </div>
      <div className="insight-banner">
        <span className="insight-mark"><Lightbulb size={17} /></span>
        <div><b>Build your plan one step at a time</b><p>Track spending regularly, set a realistic savings goal, and review it as your circumstances change.</p></div>
        <button type="button" onClick={() => onNavigate('Goals')}>View goals <ChevronRight size={14} /></button>
      </div>
      <p className="disclaimer">This score is an educational summary of recorded data, not a credit rating or personalized financial advice.</p>
    </>
  );
}

function SettingsPage({ user, theme, onThemeChange, onSignOut, onNotificationCreated }) {
  const [sendingReset, setSendingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [emailSettings, setEmailSettings] = useState({ email_savings_rewards: false, email_configured: false });
  const [emailSettingsBusy, setEmailSettingsBusy] = useState(false);
  const [emailSettingsError, setEmailSettingsError] = useState('');
  const [emailSettingsMessage, setEmailSettingsMessage] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/notifications/settings')
      .then(({ data }) => {
        if (active) setEmailSettings(data);
      })
      .catch((error) => {
        if (active) setEmailSettingsError(errorMessage(error));
      });
    return () => { active = false; };
  }, []);

  const sendPasswordReset = async () => {
    setSendingReset(true);
    setResetMessage('');
    setResetError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email: user.email });
      setResetMessage(data.message || 'If an account exists for that email, a reset link has been sent.');
    } catch (error) {
      setResetError(errorMessage(error));
    } finally {
      setSendingReset(false);
    }
  };

  const changeEmailAlerts = async (enabled) => {
    setEmailSettingsBusy(true);
    setEmailSettingsError('');
    setEmailSettingsMessage('');
    try {
      const { data } = await api.put('/notifications/settings', { email_savings_rewards: enabled });
      setEmailSettings(data);
      setEmailSettingsMessage(enabled ? 'Savings reward emails are enabled.' : 'Savings reward emails are disabled.');
    } catch (error) {
      setEmailSettingsError(errorMessage(error));
    } finally {
      setEmailSettingsBusy(false);
    }
  };

  const sendTestEmail = async () => {
    setEmailSettingsBusy(true);
    setEmailSettingsError('');
    setEmailSettingsMessage('');
    try {
      const { data } = await api.post('/notifications/test-email');
      setEmailSettingsMessage(data.message);
      onNotificationCreated(data.notification);
    } catch (error) {
      setEmailSettingsError(errorMessage(error));
    } finally {
      setEmailSettingsBusy(false);
    }
  };

  return (
    <>
      <div className="page-intro"><div><span className="eyebrow">YOUR ACCOUNT</span><h2>Settings</h2><p>Review your profile, appearance, and account security.</p></div></div>
      <div className="settings-grid">
        <Panel title="Profile" subtitle="Signed-in account">
          <div className="settings-profile">
            <span className="avatar">{(user.name?.[0] || 'U').toUpperCase()}</span>
            <div><b>{user.name}</b><span>{user.email}</span><small>Account ID: {user.id}</small></div>
          </div>
        </Panel>
        <Panel title="Appearance" subtitle="Choose how NexWealth looks on this device">
          <div className="settings-choice">
            <button className={`btn ${theme === 'light' ? 'primary' : 'subtle'}`} type="button" aria-pressed={theme === 'light'} onClick={() => onThemeChange('light')}><Sun size={15} />Light</button>
            <button className={`btn ${theme === 'dark' ? 'primary' : 'subtle'}`} type="button" aria-pressed={theme === 'dark'} onClick={() => onThemeChange('dark')}><Moon size={15} />Dark</button>
          </div>
          <p className="setting-help">Your appearance preference is saved in this browser.</p>
        </Panel>
        <Panel title="Account security" subtitle="Reset your password using a secure email link">
          <p className="setting-help">We will send a one-time link to <b>{user.email}</b>. The link expires after 60 minutes.</p>
          {resetError && <div className="error" role="alert">{resetError}</div>}
          {resetMessage && <div className="note-card" role="status"><Check size={16} /><p>{resetMessage}</p></div>}
          <button className="btn subtle" type="button" onClick={sendPasswordReset} disabled={sendingReset}>
            {sendingReset ? <LoaderCircle className="spin" size={15} /> : <LockKeyhole size={15} />}
            Send password reset link
          </button>
        </Panel>
        <Panel title="Email notifications" subtitle="Choose which app events send an email to your registered address">
          <label className="notification-setting">
            <input
              type="checkbox"
              checked={emailSettings.email_savings_rewards}
              disabled={emailSettingsBusy || !emailSettings.email_configured}
              onChange={(event) => void changeEmailAlerts(event.target.checked)}
            />
            <span><b>Savings streak rewards</b><small>Email me after a daily savings contribution earns virtual coins.</small></span>
          </label>
          {!emailSettings.email_configured && <p className="setting-help">Email delivery is not configured. Add SMTP settings on the server to enable notifications.</p>}
          {emailSettingsError && <div className="error" role="alert">{emailSettingsError}</div>}
          {emailSettingsMessage && <div className="note-card" role="status"><Mail size={16} /><p>{emailSettingsMessage}</p></div>}
          <button className="btn subtle" type="button" onClick={sendTestEmail} disabled={emailSettingsBusy || !emailSettings.email_configured}>
            {emailSettingsBusy ? <LoaderCircle className="spin" size={15} /> : <Mail size={15} />}
            Send test email to my account
          </button>
        </Panel>
        <Panel title="Session" subtitle="Protect your account on shared devices">
          <p className="setting-help">Sign out to clear this browser's saved NexWealth session.</p>
          <button className="btn subtle" type="button" onClick={onSignOut}><LogOut size={15} />Sign out</button>
        </Panel>
      </div>
    </>
  );
}

function ReportsPage({ user }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchReportData = async () => {
    const { data } = await api.get('/export');
    return data;
  };

  const downloadCsv = async () => {
    setBusy('csv');
    setError('');
    setMessage('');
    try {
      const data = await fetchReportData();
      const columns = ['record_type', 'date', 'title', 'description', 'category', 'type', 'amount', 'note', 'target_amount', 'saved_amount', 'target_date', 'current_amount', 'deadline', 'progress', 'coins', 'streak', 'coins_earned', 'contribution', 'email_status', 'read'];
      const escapeCell = (value) => {
        let text = String(value ?? '');
        if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
        return `"${text.replace(/"/g, '""')}"`;
      };
      const records = [
        ...data.transactions.map((transaction) => ({ record_type: 'transaction', ...transaction })),
        ...data.goals.map((goal) => ({ record_type: 'goal', title: goal.title, target_amount: goal.target_amount, saved_amount: goal.saved_amount, target_date: goal.target_date, progress: goal.progress })),
        ...(data.challenges || []).map((challenge) => ({ record_type: 'archived_challenge', title: challenge.title, description: challenge.description, target_amount: challenge.target_amount, current_amount: challenge.current_amount, deadline: challenge.deadline, progress: challenge.progress })),
        { record_type: 'savings_game', date: data.game.last_played, coins: data.game.coins, streak: data.game.streak },
        ...data.game_entries.map((entry) => ({ record_type: 'savings_entry', date: entry.date, title: entry.goal, coins_earned: entry.coins_earned, contribution: entry.contribution })),
        ...data.notifications.map((notification) => ({ record_type: 'notification', date: notification.created_at, title: notification.title, description: notification.message, category: notification.category, email_status: notification.email_status, read: notification.read })),
      ];
      const rows = [
        columns,
        ...records.map((record) => columns.map((column) => record[column])),
      ];
      const csv = `\uFEFF${rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')}`;
      const objectUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `nexwealth-account-data-${today()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setMessage(`Exported ${data.transactions.length} transactions, ${data.goals.length} goals, ${data.game_entries.length} savings entries, and any archived challenge records as CSV.`);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy('');
    }
  };

  const downloadPdf = async () => {
    setBusy('pdf');
    setError('');
    setMessage('');
    try {
      const data = await fetchReportData();
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      const sanitize = (value) => String(value ?? '').replace(/[^\x20-\xFF]/g, '?');
      const formatMoney = (value) => `INR ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
      let y = 18;

      const ensureSpace = (height = 8) => {
        if (y + height > 280) {
          pdf.addPage();
          y = 18;
        }
      };
      const addText = (text, { size = 10, bold = false, color = [52, 65, 92], gap = 6 } = {}) => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
        const lines = pdf.splitTextToSize(sanitize(text), 180);
        for (const line of lines) {
          ensureSpace(gap);
          pdf.text(line, 15, y);
          y += gap;
        }
      };
      const heading = (text) => {
        y += 3;
        addText(text, { size: 13, bold: true, color: [99, 91, 255], gap: 8 });
      };

      addText('NexWealth financial report', { size: 21, bold: true, color: [28, 38, 72], gap: 10 });
      addText(`${data.user.name} | ${data.user.email} | Prepared ${new Date(data.generated_at).toLocaleDateString()}`, { size: 9, color: [100, 112, 137] });
      heading('Financial overview');
      addText(`Net recorded balance: ${formatMoney(data.dashboard.total_balance)}`);
      addText(`Income this month: ${formatMoney(data.dashboard.monthly_income)}`);
      addText(`Expenses this month: ${formatMoney(data.dashboard.monthly_expenses)}`);
      addText(`Savings rate: ${data.analytics.savings_rate}%`);
      addText(`30-day projected balance: ${formatMoney(data.forecast.projected_balance_30_days)}`);

      heading('Insights and next steps');
      addText(`Financial health: ${data.health.label} (${data.health.score}/100)`);
      (data.health.tips || []).forEach((tip, index) => addText(`${index + 1}. ${tip}`));
      addText(`Forecast method: ${data.forecast.method}`, { size: 9, color: [100, 112, 137] });

      heading('Savings goals');
      if (data.goals.length) {
        data.goals.forEach((goal) => addText(`${goal.title}: ${formatMoney(goal.saved_amount)} of ${formatMoney(goal.target_amount)} (${goal.progress}%)`));
      } else {
        addText('No savings goals have been recorded.');
      }

      heading('Savings game');
      addText(`Virtual coins: ${data.game.coins} | Current streak: ${data.game.streak} days`);
      addText('Game coins are virtual points only, have no cash value, and cannot be withdrawn or redeemed.', { size: 9, color: [100, 112, 137] });

      heading('Recent transactions');
      const reportTransactions = data.transactions.slice(0, 75);
      if (reportTransactions.length) {
        reportTransactions.forEach((transaction) => {
          addText(`${transaction.date} | ${transaction.type.toUpperCase()} | ${transaction.description} | ${transaction.category} | ${formatMoney(transaction.amount)}`, { size: 8, gap: 5 });
        });
        if (data.transactions.length > reportTransactions.length) {
          addText(`Showing the latest ${reportTransactions.length} transactions; the CSV includes all account records.`, { size: 8, color: [100, 112, 137] });
        }
      } else {
        addText('No transactions have been recorded.');
      }

      y += 3;
      addText('This report summarizes information entered in NexWealth. Estimates are uncertain and are not financial, investment, tax, or legal advice.', { size: 8, color: [100, 112, 137] });
      const objectUrl = URL.createObjectURL(pdf.output('blob'));
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `nexwealth-report-${today()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setMessage('Your PDF report is ready.');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <div className="page-intro"><div><span className="eyebrow">YOUR DATA, YOUR PLAN</span><h2>Reports &amp; export</h2><p>Download all account records as CSV or get a PDF report of trends and future estimates.</p></div></div>
      <div className="report-grid">
        <Panel title="Financial insight report" subtitle="PDF summary of cash flow, health insights, goals, and forecast">
          <div className="report-card">
            <span className="report-icon report-purple"><BrainCircuit size={19} /></span>
            <p>Includes your recorded financial summary, suggested next steps, savings goals, and a 30-day estimate.</p>
            <button className="btn primary" type="button" onClick={downloadPdf} disabled={Boolean(busy)}>
              {busy === 'pdf' ? <LoaderCircle className="spin" size={15} /> : <Download size={15} />}
              Download PDF report
            </button>
          </div>
        </Panel>
        <Panel title="Complete account data" subtitle="CSV of transactions, goals, game progress, notifications, and archived records">
          <div className="report-card">
            <span className="report-icon report-teal"><WalletCards size={19} /></span>
            <p>Use the CSV in spreadsheet software. Text cells are escaped to reduce spreadsheet formula risks.</p>
            <button className="btn subtle" type="button" onClick={downloadCsv} disabled={Boolean(busy)}>
              {busy === 'csv' ? <LoaderCircle className="spin" size={15} /> : <Download size={15} />}
              Download account data CSV
            </button>
          </div>
        </Panel>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      {message && <div className="note-card" role="status"><Check size={16} /><p>{message}</p></div>}
      <p className="disclaimer">Exports are generated for {user.email} and contain financial information. The CSV includes all account records; the PDF summarizes the latest 75 transactions. Store downloaded files securely.</p>
    </>
  );
}

function MoneyQuizPage({ userId }) {
  const [unlocked, setUnlocked] = useState(() => {
    const saved = Number(localStorage.getItem(`nexwealth_quiz_${userId}`));
    return Math.max(1, Math.min(QUIZ_LEVELS.length, saved || 1));
  });
  const [level, setLevel] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [complete, setComplete] = useState(false);
  const [cleared, setCleared] = useState(false);
  const questions = QUIZ_LEVELS[level - 1].questions;
  const question = questions[questionIndex];

  useEffect(() => {
    localStorage.setItem(`nexwealth_quiz_${userId}`, String(unlocked));
  }, [unlocked, userId]);

  const startLevel = (nextLevel) => {
    if (nextLevel > unlocked) return;
    setLevel(nextLevel);
    setQuestionIndex(0);
    setSelected(null);
    setScore(0);
    setComplete(false);
    setCleared(false);
  };

  const advance = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((index) => index + 1);
      setSelected(null);
      return;
    }
    const passed = score === questions.length;
    setComplete(true);
    setCleared(passed);
    if (passed && level < QUIZ_LEVELS.length) setUnlocked((current) => Math.max(current, level + 1));
  };

  return (
    <>
      <div className="page-intro"><div><span className="eyebrow">LEARN BY PLAYING</span><h2>Money quiz</h2><p>Clear each financial-literacy level with a perfect score to unlock the next level.</p></div></div>
      <div className="quiz-levels" aria-label="Quiz levels">
        {QUIZ_LEVELS.map((item, index) => (
          <button key={item.title} className={`quiz-level ${level === index + 1 ? 'active' : ''} ${index + 1 <= unlocked ? 'unlocked' : 'locked'}`} type="button" disabled={index + 1 > unlocked} onClick={() => startLevel(index + 1)}>
            <span>{index + 1 <= unlocked ? <Check size={14} /> : <LockKeyhole size={13} />}</span>
            <b>Level {index + 1}</b>
            <small>{item.title}</small>
          </button>
        ))}
      </div>
      <Panel title={`${level}. ${QUIZ_LEVELS[level - 1].title}`} subtitle={complete ? 'Level results' : `Question ${questionIndex + 1} of ${questions.length}`}>
        {!complete ? (
          <div className="quiz-content">
            <div className="quiz-progress"><i style={{ width: `${(questionIndex / questions.length) * 100}%` }} /></div>
            <h3>{question.prompt}</h3>
            <div className="quiz-options">
              {question.options.map((option, index) => (
                <button key={option} className={`quiz-option ${selected === index ? (index === question.answer ? 'correct' : 'incorrect') : ''}`} type="button" disabled={selected !== null} onClick={() => {
                  setSelected(index);
                  if (index === question.answer) setScore((current) => current + 1);
                }}>
                  <span>{String.fromCharCode(65 + index)}</span>{option}
                  {selected === index && (index === question.answer ? <Check size={16} /> : <X size={16} />)}
                </button>
              ))}
            </div>
            {selected !== null && <p className={`quiz-feedback ${selected === question.answer ? 'good' : 'try-again'}`}>{selected === question.answer ? 'Correct. Nice work.' : `Not quite. ${question.options[question.answer]}`}</p>}
            <button className="btn primary" type="button" disabled={selected === null} onClick={advance}>{questionIndex === questions.length - 1 ? 'Finish level' : 'Next question'}<ChevronRight size={15} /></button>
          </div>
        ) : (
          <div className="quiz-result">
            <span className={`quiz-result-icon ${cleared ? 'cleared' : ''}`}>{cleared ? <Trophy size={22} /> : <BrainCircuit size={22} />}</span>
            <h3>{cleared ? (level === QUIZ_LEVELS.length ? 'All levels cleared!' : 'Level cleared!') : 'Level not cleared yet'}</h3>
            <p>You scored {score} out of {questions.length}. {cleared ? (level === QUIZ_LEVELS.length ? 'You mastered every level.' : 'The next level is now unlocked.') : 'You need all questions correct to unlock the next level.'}</p>
            <button className="btn primary" type="button" onClick={() => startLevel(cleared && level < QUIZ_LEVELS.length ? level + 1 : level)}>
              {cleared && level < QUIZ_LEVELS.length ? 'Play next level' : 'Try this level again'}<ChevronRight size={15} />
            </button>
          </div>
        )}
      </Panel>
      <p className="disclaimer">This is an educational game only. It awards no cash or financial returns and does not provide personalized financial advice.</p>
    </>
  );
}

function SavingsGamePage({ game, goals, onComplete, onCreateGoal }) {
  const [goalId, setGoalId] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!goalId && goals.length) setGoalId(String(goals[0].id));
  }, [goalId, goals]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onComplete({ goal_id: Number(goalId), amount: Number(amount) });
      setAmount('');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-intro"><div><span className="eyebrow">SMALL STEPS, STEADY STREAKS</span><h2>Savings streak</h2><p>Log a real contribution toward a savings goal to earn virtual coins.</p></div></div>
      <div className="stats-grid three">
        <StatCard title="Virtual coins" value={game.coins.toLocaleString()} foot="Earn 10 coins for a completed daily save" icon={Gamepad2} tone="purple" />
        <StatCard title="Estimated equivalent" value={money(game.rupee_equivalent)} foot="100 virtual coins display ₹70" icon={CircleDollarSign} tone="green" />
        <StatCard title="Current streak" value={`${game.streak} day${game.streak === 1 ? '' : 's'}`} foot={game.completed_today ? 'Today is complete' : 'Complete a save to continue'} icon={Trophy} tone="orange" />
      </div>
      <div className="game-layout">
        <Panel title="Today's savings quest" subtitle="Choose a goal and record the amount you have actually saved today">
          {goals.length ? (
            <form className="stack-form" onSubmit={submit}>
              <label>Savings goal
                <select required value={goalId} onChange={(event) => setGoalId(event.target.value)}>
                  {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title} · {money(goal.saved_amount)} of {money(goal.target_amount)}</option>)}
                </select>
              </label>
              <label>Amount contributed today (₹)<input type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter your actual contribution" /></label>
              {error && <div className="error" role="alert">{error}</div>}
              {game.completed_today && <div className="note-card"><Check size={16} /><p>You have completed today's savings streak. Come back tomorrow for the next one.</p></div>}
              <button className="btn primary" type="submit" disabled={busy || game.completed_today}>
                {busy ? <LoaderCircle className="spin" size={15} /> : <Gamepad2 size={15} />}
                {game.completed_today ? 'Daily streak complete' : 'Record saving and earn 10 coins'}
              </button>
            </form>
          ) : (
            <EmptyState icon={Target} title="Create a savings goal first" detail="Your game rewards are tied to a contribution recorded toward one of your savings goals." action={<button className="btn primary" type="button" onClick={onCreateGoal}><Plus size={15} />Create a savings goal</button>} />
          )}
        </Panel>
        <Panel title="Your recent streaks" subtitle="Savings contributions recorded through the game">
          {game.recent_entries?.length ? (
            <div className="table-scroll">
              <table>
                <thead><tr><th>DATE</th><th>GOAL</th><th className="right">CONTRIBUTION</th><th className="right">COINS</th></tr></thead>
                <tbody>{game.recent_entries.map((entry) => <tr key={`${entry.date}-${entry.goal}`}><td>{displayDate(entry.date)}</td><td><b>{entry.goal}</b></td><td className="right">{money(entry.contribution)}</td><td className="right positive">+{entry.coins_earned}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <EmptyState icon={Trophy} title="Your first streak is waiting" detail="Record a savings contribution to start your streak." />}
        </Panel>
      </div>
      <p className="disclaimer">{game.conversion_note} Contributions are self-reported and update your goal progress; they are not verified deposits or financial advice.</p>
    </>
  );
}

function ForecastPage({ forecast, estimating, onEstimate }) {
  const prediction = forecast.prediction;
  const trend = prediction?.daily_predictions?.filter((_, index) => index % 3 === 0) || [];
  return (
    <>
      <div className="page-intro">
        <div><span className="eyebrow">LOOK AHEAD</span><h2>Cash-flow estimate</h2><p>Review an estimate based on your saved transaction history.</p></div>
        <button className="btn primary" type="button" onClick={onEstimate} disabled={estimating}>
          {estimating ? <LoaderCircle className="spin" size={15} /> : <Activity size={15} />}
          {estimating ? 'Estimating…' : 'Estimate'}
        </button>
      </div>
      <div className="stats-grid">
        <StatCard title="Average monthly income" value={money(forecast.average_monthly_income)} foot="Four-month historical average" icon={ArrowDownRight} tone="green" />
        <StatCard title="Average monthly expenses" value={money(forecast.average_monthly_expenses)} foot="Four-month historical average" icon={CreditCard} tone="orange" />
        <StatCard title="Estimated monthly savings" value={money(forecast.estimated_monthly_savings)} foot={prediction ? 'Personalized model estimate' : 'Baseline estimate'} icon={CircleDollarSign} tone="blue" />
        <StatCard title="Projected balance in 30 days" value={money(forecast.projected_balance_30_days)} foot={prediction ? 'Model-based projection' : 'Historical baseline'} icon={Activity} tone="purple" />
      </div>
      <div className="dashboard-grid">
        <Panel title="30-day daily estimate" subtitle={prediction ? 'Personalized cash-flow projection' : 'Daily details are unavailable; this estimate uses historical averages'}>
          {trend.length ? (
            <div className="chart-wrap tall">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 9 }} tickFormatter={(value) => value.slice(5)} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 9 }} tickFormatter={compactMoney} />
                  <Tooltip labelFormatter={(value) => displayDate(value)} formatter={(value) => money(value)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="income" name="Income" stroke={CASH_FLOW_COLORS.income} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} animationDuration={850} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke={CASH_FLOW_COLORS.expenses} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} animationDuration={850} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="note-card"><Lightbulb size={18} /><div><b>Historical estimate</b><p>{forecast.method}</p><small>Keep your transaction history up to date for more useful estimates.</small></div></div>
          )}
        </Panel>
        <Panel title="Estimate details" subtitle={prediction ? 'Based on this account’s transaction history' : 'Based on the four-month historical average'}>
          <div className="note-card">
            <BrainCircuit size={18} />
            <div>
              <b>{prediction ? 'Personalized estimate' : 'Historical-average estimate'}</b>
              <p>{forecast.method}</p>
            </div>
          </div>
          {prediction && <div className="result-line"><span>Predicted 30-day income</span><b>{money(prediction.predicted_income_30_days)}</b></div>}
          {prediction && <div className="result-line"><span>Predicted 30-day expenses</span><b>{money(prediction.predicted_expenses_30_days)}</b></div>}
          <p className="disclaimer">Forecasts are estimates, not guarantees. Actual income and expenses may differ as your circumstances change.</p>
        </Panel>
      </div>
    </>
  );
}

function GoalsPage({ goals, search, onSearchChange, onAdd, onProgress, onDelete }) {
  const query = search.trim().toLowerCase();
  const visibleGoals = goals.filter((goal) => !query || goal.title.toLowerCase().includes(query));

  return (
    <>
      <div className="page-intro">
        <div><span className="eyebrow">PLAN WHAT MATTERS</span><h2>Savings goals</h2><p>Track progress toward the things you are saving for.</p></div>
        <button className="btn primary" type="button" onClick={onAdd}><Plus size={15} />New goal</button>
      </div>
      <div className="toolbar">
        <label className="searchbox"><Search size={15} /><input aria-label="Search savings goals" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search goals…" /></label>
      </div>
      {visibleGoals.length ? (
        <div className="goal-grid">
          {visibleGoals.map((goal, index) => (
            <article className="goal-card" key={goal.id}>
              <div className="goal-top">
                <span className={`goal-icon goal-${(index % 3) + 1}`}><Target size={18} /></span>
                <button className="icon-btn small danger-hover" type="button" onClick={() => onDelete(goal)} aria-label={`Delete ${goal.title}`}><Trash2 size={14} /></button>
              </div>
              <h3>{goal.title}</h3>
              <div className="goal-amount"><b>{money(goal.saved_amount)}</b><span>of {money(goal.target_amount)}</span></div>
              <div className="progress-track"><i style={{ width: `${Math.min(100, goal.progress || 0)}%`, background: CHART_COLORS[index % CHART_COLORS.length] }} /></div>
              <div className="goal-foot"><span>{goal.progress}% complete</span><span>{goal.target_date ? `By ${displayDate(goal.target_date)}` : 'No target date'}</span></div>
              <button className="text-btn" type="button" onClick={() => onProgress(goal)}><Pencil size={13} />Update saved amount</button>
            </article>
          ))}
        </div>
      ) : <Panel><EmptyState icon={Target} title={query ? 'No matching goals' : 'No savings goals yet'} detail={query ? 'Try another search term.' : 'Create a goal and track each step toward it.'} action={!query && <button className="btn primary" type="button" onClick={onAdd}><Plus size={15} />Create a goal</button>} /></Panel>}
    </>
  );
}

function SimulatorPage({ dashboard }) {
  const [form, setForm] = useState({ price: '', monthly_income: '', monthly_expenses: '', current_savings: '' });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm((current) => ({
      ...current,
      monthly_income: current.monthly_income || String(dashboard.monthly_income || ''),
      monthly_expenses: current.monthly_expenses || String(dashboard.monthly_expenses ?? 0),
      current_savings: current.current_savings || String(Math.max(0, dashboard.total_balance || 0)),
    }));
  }, [dashboard]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const purchasePrice = result?.purchase_price || 0;
  const currentSavings = result?.starting_savings || 0;
  const purchaseBreakdown = [
    { name: 'Covered by current savings', value: Math.min(purchasePrice, currentSavings), color: CHART_COLORS[1] },
    { name: 'Savings remaining', value: Math.max(currentSavings - purchasePrice, 0), color: CHART_COLORS[0] },
    { name: 'Amount above current savings', value: Math.max(purchasePrice - currentSavings, 0), color: CHART_COLORS[2] },
  ].filter((item) => item.value > 0);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/simulator', {
        price: Number(form.price),
        monthly_income: Number(form.monthly_income),
        monthly_expenses: Number(form.monthly_expenses),
        current_savings: Number(form.current_savings),
      });
      setResult({
        ...data,
        purchase_price: Number(form.price),
        starting_savings: Number(form.current_savings),
      });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-intro"><div><span className="eyebrow">THINK BEFORE YOU SPEND</span><h2>Purchase simulator</h2><p>Explore how a planned purchase could affect your savings.</p></div></div>
      <div className="sim-layout">
        <Panel title="Plan a purchase" subtitle="Use your current monthly figures or enter a scenario">
          <form className="stack-form" onSubmit={submit}>
            <label>Purchase price (₹)<input name="price" type="number" min="0.01" step="0.01" required value={form.price} onChange={change} placeholder="e.g. 25000" /></label>
            <div className="form-two">
              <label>Monthly income (₹)<input name="monthly_income" type="number" min="0.01" step="0.01" required value={form.monthly_income} onChange={change} /></label>
              <label>Monthly expenses (₹)<input name="monthly_expenses" type="number" min="0" step="0.01" required value={form.monthly_expenses} onChange={change} /></label>
            </div>
            <label>Current savings (₹)<input name="current_savings" type="number" min="0" step="0.01" required value={form.current_savings} onChange={change} /></label>
            {error && <div className="error" role="alert">{error}</div>}
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={15} /> : <ShoppingBag size={15} />}
              Check this purchase
            </button>
          </form>
        </Panel>
        <Panel title="Your scenario" subtitle="A simple check based on the numbers you entered">
          {result ? (
            <div className="sim-result">
              <span className={`decision ${result.affordable_now ? 'good' : 'caution'}`}>{result.affordable_now ? 'Fits your current savings' : 'Consider saving first'}</span>
              <h3>{result.message}</h3>
              <div className="result-line"><span>Monthly surplus</span><b>{money(result.monthly_surplus)}</b></div>
              <div className="result-line"><span>Savings after purchase</span><b>{money(result.remaining_savings)}</b></div>
              {result.months_to_save !== null && <div className="result-line"><span>Months to save the purchase price</span><b>{result.months_to_save}</b></div>}
              <div className="sim-visualization">
                <b>Purchase impact on your savings</b>
                <div className="donut-wrap">
                  <ResponsiveContainer width="58%" height="100%">
                    <PieChart>
                      <Pie data={purchaseBreakdown} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="82%" paddingAngle={3} animationDuration={750}>
                        {purchaseBreakdown.map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Pie>
                      <Tooltip formatter={(value) => money(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="legend-list">
                    {purchaseBreakdown.map((item) => <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><b>{money(item.value)}</b></div>)}
                  </div>
                </div>
              </div>
              <p className="disclaimer">This is a budgeting aid, not a financial recommendation. Keep an emergency buffer in mind.</p>
            </div>
          ) : (
            <div className="sim-placeholder"><span className="sim-orb"><ShoppingBag size={25} /></span><b>See the trade-off before you buy</b><p>Enter a price and your monthly cash-flow figures to explore this scenario.</p></div>
          )}
        </Panel>
      </div>
    </>
  );
}

function AssistantPage({ user }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Hi ${user.name?.split(' ')[0] || 'there'}! I can help you understand your recorded income, expenses, savings, and forecast. What would you like to explore?` },
  ]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const messagesRef = useRef(null);
  const suggestions = ['How much did I spend?', 'How can I save more?', 'What is my current balance?', 'What does my forecast show?'];

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async (text = question) => {
    const content = text.trim();
    if (!content || busy) return;
    setMessages((current) => [...current, { role: 'user', text: content }]);
    setQuestion('');
    setBusy(true);
    try {
      const { data } = await api.post('/assistant', { message: content });
      setMessages((current) => [...current, {
        role: 'assistant',
        text: data.answer,
        mode: data.mode,
        assistantName: data.assistant_name,
        disclaimer: data.disclaimer,
      }]);
    } catch (requestError) {
      setMessages((current) => [...current, { role: 'assistant', text: errorMessage(requestError), mode: 'error' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-intro"><div><span className="eyebrow">YOUR FINANCIAL COMPANION</span><h2>AI assistant</h2><p>Ask questions about the records in your NexWealth account.</p></div></div>
      <div className="assistant-layout">
        <section className="chat-panel">
          <div className="chat-head">
            <span className="assistant-avatar"><Sparkles size={17} /></span>
            <div><b>NexWealth assistant</b><span><i /> Ready to help</span></div>
            <span className="powered">PRIVATE SESSION</span>
          </div>
          <div className="chat-messages" ref={messagesRef} aria-live="polite">
            {messages.map((message, index) => (
              <div className={`message ${message.role === 'user' ? 'user' : ''}`} key={`${index}-${message.text.slice(0, 12)}`}>
                <span className="message-avatar">{message.role === 'user' ? (user.name?.[0] || 'Y').toUpperCase() : <Sparkles size={14} />}</span>
                <div className="message-body">
                  <p>{message.text}</p>
                  {message.mode && <small>{message.assistantName || (message.mode === 'error' ? 'Unable to respond' : message.mode === 'ai' ? 'AI response' : 'Rule-based response')}</small>}
                  {message.disclaimer && <small>{message.disclaimer}</small>}
                </div>
              </div>
            ))}
            {busy && <div className="typing" aria-label="Assistant is responding"><i /><i /><i /></div>}
          </div>
          <form className="chat-input" onSubmit={(event) => { event.preventDefault(); void send(); }}>
            <input aria-label="Message the assistant" maxLength={2000} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your recorded finances…" />
            <button className="btn primary" type="submit" disabled={busy || !question.trim()} aria-label="Send message"><Send size={15} /></button>
          </form>
        </section>
        <aside className="suggestion-panel">
          <b>Try asking</b>
          {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void send(suggestion)}>{suggestion}<ChevronRight size={14} /></button>)}
          <div className="privacy-note"><LockKeyhole size={14} /><p>A financial summary may be sent to the configured AI provider. Without a provider key, the assistant uses a local rules-based fallback. Responses are educational, not personalized investment, tax, or legal advice.</p></div>
        </aside>
      </div>
    </>
  );
}

export default function Dashboard({ user, onSignOut }) {
  const [page, setPage] = useState('Dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('nexwealth_sidebar_collapsed') === 'true');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('nexwealth_theme') || 'light');
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [health, setHealth] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [game, setGame] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [goalSearch, setGoalSearch] = useState('');
  const [transactionModal, setTransactionModal] = useState(null);
  const [goalModal, setGoalModal] = useState(false);
  const [progressTarget, setProgressTarget] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const fileInput = useRef(null);
  const searchInput = useRef(null);
  const searchContainer = useRef(null);
  const notificationContainer = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('nexwealth_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('nexwealth_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const [dashboardResult, analyticsResult, transactionsResult, healthResult, forecastResult, goalsResult, gameResult, notificationsResult] = await Promise.all([
        api.get('/dashboard'),
        api.get('/analytics'),
        api.get('/transactions?limit=1000'),
        api.get('/health-score'),
        api.get('/forecast'),
        api.get('/goals'),
        api.get('/game/status'),
        api.get('/notifications?limit=20'),
      ]);
      setDashboard(dashboardResult.data);
      setAnalytics(analyticsResult.data);
      setTransactions(transactionsResult.data);
      setHealth(healthResult.data);
      setForecast(forecastResult.data);
      setGoals(goalsResult.data);
      setGame(gameResult.data);
      setNotifications(notificationsResult.data);
    } catch (error) {
      setPageError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInput.current?.focus();
      }
      if (event.key === 'Escape') {
        setGlobalSearchOpen(false);
        setNotificationOpen(false);
      }
    };
    const handlePointerDown = (event) => {
      if (!searchContainer.current?.contains(event.target)) setGlobalSearchOpen(false);
      if (!notificationContainer.current?.contains(event.target)) setNotificationOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const commitTransaction = async (payload) => {
    if (transactionModal?.id) {
      await api.put(`/transactions/${transactionModal.id}`, payload);
      notify('Transaction updated.');
    } else {
      await api.post('/transactions', payload);
      notify('Transaction added.');
    }
    setTransactionModal(null);
    await refresh();
  };

  const deleteTransaction = async (transaction) => {
    if (!window.confirm(`Delete "${transaction.description}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/transactions/${transaction.id}`);
      notify('Transaction deleted.');
      await refresh();
    } catch (error) {
      notify(errorMessage(error));
    }
  };

  const uploadTransactions = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    try {
      const { data } = await api.post('/transactions/import', body);
      notify(`${data.imported} transaction${data.imported === 1 ? '' : 's'} imported.`);
      await refresh();
    } catch (error) {
      notify(errorMessage(error));
    }
  };

  const createGoal = async (payload) => {
    await api.post('/goals', payload);
    setGoalModal(false);
    notify('Savings goal created.');
    await refresh();
  };

  const updateProgress = async (amount) => {
    const { item } = progressTarget;
    await api.patch(`/goals/${item.id}/progress`, { saved_amount: amount });
    setProgressTarget(null);
    notify('Progress updated.');
    await refresh();
  };

  const removeGoal = async (goal) => {
    if (!window.confirm(`Delete the goal "${goal.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/goals/${goal.id}`);
      notify('Goal deleted.');
      await refresh();
    } catch (error) {
      notify(errorMessage(error));
    }
  };

  const estimateForecast = async () => {
    setEstimating(true);
    try {
      const { data } = await api.get('/forecast');
      setForecast(data);
      notify('Your latest cash-flow estimate is ready.');
    } catch (error) {
      notify(errorMessage(error));
    } finally {
      setEstimating(false);
    }
  };

  const completeGameDay = async (payload) => {
    const { data } = await api.post('/game/complete', payload);
    setGame(data);
    if (data.email_error) notify(data.email_error);
    else notify(data.email_sent ? 'Savings recorded. 10 virtual coins earned and emailed.' : 'Savings recorded. You earned 10 virtual coins.');
    await refresh();
  };

  const markNotificationRead = async (notification) => {
    if (notification.read) return;
    try {
      const { data } = await api.patch(`/notifications/${notification.id}/read`);
      setNotifications((current) => current.map((item) => item.id === data.id ? data : item));
    } catch (error) {
      notify(errorMessage(error));
    }
  };

  const filteredTransactions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return transactions.filter((transaction) =>
      (filter === 'all' || transaction.type === filter) &&
      (!normalized || [transaction.description, transaction.category, transaction.note].some((value) => value?.toLowerCase().includes(normalized)))
    );
  }, [transactions, filter, search]);

  const globalSearchResults = useMemo(() => {
    const query = globalQuery.trim().toLowerCase();
    if (!query) return { pages: [], transactions: [], goals: [], count: 0 };

    const pageTerms = {
      Dashboard: 'overview home balance money',
      Transactions: 'transactions income expense spending activity',
      Analytics: 'insights charts trends',
      'Financial health': 'health wellbeing score financial status',
      Forecast: 'prediction future cash flow',
      Goals: 'savings targets',
      'Purchase simulator': 'affordability purchase buy',
      'AI assistant': 'chat help assistant',
      'Savings game': 'game coins streak play',
      'Money quiz': 'learning game financial literacy levels',
      'Reports & export': 'download report pdf csv data insights',
      Settings: 'account profile preferences password security',
    };
    const pages = NAV_ITEMS.filter(({ name }) =>
      name.toLowerCase().includes(query) || pageTerms[name].includes(query)
    );
    const matchingTransactions = transactions
      .filter((item) => [item.description, item.category, item.note, item.type].some((value) => value?.toLowerCase().includes(query)))
      .slice(0, 5);
    const matchingGoals = goals.filter((item) => item.title.toLowerCase().includes(query)).slice(0, 5);

    return {
      pages,
      transactions: matchingTransactions,
      goals: matchingGoals,
      count: pages.length + matchingTransactions.length + matchingGoals.length,
    };
  }, [globalQuery, transactions, goals]);

  const navigateTo = (destination) => {
    setPage(destination);
    setMenuOpen(false);
    setGlobalQuery('');
    setGlobalSearchOpen(false);
    setSearch('');
    setGoalSearch('');
  };

  const openSearchResult = (type, item) => {
    if (type === 'page') {
      navigateTo(item.name);
      return;
    }

    const destination = type === 'transaction' ? 'Transactions' : 'Goals';
    navigateTo(destination);
    if (type === 'transaction') setSearch(item.description);
    if (type === 'goal') setGoalSearch(item.title);
  };

  const handleGlobalSearchKeyDown = (event) => {
    if (event.key !== 'Enter' || !globalSearchResults.count) return;
    event.preventDefault();
    if (globalSearchResults.pages.length) openSearchResult('page', globalSearchResults.pages[0]);
    else if (globalSearchResults.transactions.length) openSearchResult('transaction', globalSearchResults.transactions[0]);
    else if (globalSearchResults.goals.length) openSearchResult('goal', globalSearchResults.goals[0]);
  };

  const pageTitles = {
    Dashboard: 'Financial overview',
    Transactions: 'Your activity',
    Analytics: 'Insights and trends',
    'Financial health': 'Financial health',
    Forecast: 'Plan ahead',
    Goals: 'Your goals',
    'Purchase simulator': 'Plan a purchase',
    'AI assistant': 'Ask NexWealth',
    'Savings game': 'Savings streak',
    Settings: 'Account settings',
    'Money quiz': 'Money quiz',
    'Reports & export': 'Reports and data export',
  };

  if (loading && !dashboard) {
    return <div className="loading-state"><LoaderCircle className="spin" size={19} />Loading your financial workspace…</div>;
  }

  if (pageError && !dashboard) {
    return (
      <div className="loading-state">
        <div><div className="error" role="alert">{pageError}</div><button className="btn primary" type="button" onClick={() => void refresh()}>Retry</button></div>
      </div>
    );
  }

  const data = dashboard || {
    total_balance: 0, total_income: 0, total_expenses: 0, monthly_income: 0,
    monthly_expenses: 0, monthly_savings: 0, transaction_count: 0, monthly: [],
    categories: [], recent_transactions: [],
  };
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {menuOpen && <button className="scrim" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${menuOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand"><BrandMark /><span className="brand-title">NexWealth</span></div>
          <button className="icon-btn sidebar-collapse" type="button" onClick={() => setSidebarCollapsed((current) => !current)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}><ChevronRight size={17} /></button>
          <button className="icon-btn mobile-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={17} /></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {NAV_ITEMS.map(({ name, icon: Icon, isNew }) => (
            <button className={`nav-item ${page === name ? 'active' : ''}`} key={name} type="button" title={name} aria-label={name} onClick={() => navigateTo(name)}>
              <Icon size={16} /><span>{name}</span>{isNew && <span className="nav-new">AI</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon"><Lightbulb size={15} /></span>
            <b>Small steps add up</b>
            <p>Regular tracking helps you make informed choices.</p>
            <button type="button" onClick={() => navigateTo('AI assistant')}>Ask the assistant <ChevronRight size={13} /></button>
          </div>
          <div className="profile-row">
            <span className="avatar">{(user.name?.[0] || 'U').toUpperCase()}</span>
            <div className="profile-text"><b>{user.name}</b><span>{user.email}</span></div>
            <button className="icon-btn small" type="button" onClick={onSignOut} aria-label="Sign out"><LogOut size={15} /></button>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="top-left">
            <button className="icon-btn mobile-menu" type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
            <div><span className="crumb">NEXWEALTH <span>/</span> {page.toUpperCase()}</span><h1>{pageTitles[page]}</h1></div>
          </div>
          <div className="top-search-wrap" ref={searchContainer}>
            <div className="top-search">
              <Search size={16} />
              <input
                ref={searchInput}
                type="text"
                role="combobox"
                aria-label="Search NexWealth"
                aria-expanded={globalSearchOpen && Boolean(globalQuery.trim())}
                aria-controls="global-search-results"
                aria-autocomplete="list"
                value={globalQuery}
                onChange={(event) => {
                  setGlobalQuery(event.target.value);
                  setGlobalSearchOpen(true);
                }}
                onFocus={() => setGlobalSearchOpen(true)}
                onKeyDown={handleGlobalSearchKeyDown}
                placeholder="Search transactions, goals, pages…"
              />
              <kbd>Ctrl K</kbd>
              {globalQuery && <button className="search-clear" type="button" onClick={() => { setGlobalQuery(''); setGlobalSearchOpen(true); searchInput.current?.focus(); }} aria-label="Clear search"><X size={14} /></button>}
            </div>
            {globalSearchOpen && globalQuery.trim() && (
              <div className="global-search-results" id="global-search-results" role="listbox" aria-label="Search results">
                {globalSearchResults.pages.map(({ name, icon: Icon }) => (
                  <button className="global-search-result" key={`page-${name}`} type="button" role="option" onClick={() => openSearchResult('page', { name })}>
                    <Icon size={16} />
                    <span><b>{name}</b><small>Open workspace page</small></span>
                    <em>PAGE</em>
                  </button>
                ))}
                {globalSearchResults.transactions.map((transaction) => (
                  <button className="global-search-result" key={`transaction-${transaction.id}`} type="button" role="option" onClick={() => openSearchResult('transaction', transaction)}>
                    <WalletCards size={16} />
                    <span><b>{transaction.description}</b><small>{transaction.category} · {displayDate(transaction.date)} · {money(transaction.amount)}</small></span>
                    <em>TRANSACTION</em>
                  </button>
                ))}
                {globalSearchResults.goals.map((goal) => (
                  <button className="global-search-result" key={`goal-${goal.id}`} type="button" role="option" onClick={() => openSearchResult('goal', goal)}>
                    <Target size={16} />
                    <span><b>{goal.title}</b><small>{money(goal.saved_amount)} saved of {money(goal.target_amount)}</small></span>
                    <em>GOAL</em>
                  </button>
                ))}
                {!globalSearchResults.count && <div className="global-search-empty">No matches found. Try a page name or a saved item.</div>}
              </div>
            )}
          </div>
          <div className="top-actions">
            <span className="date-label"><CalendarDays size={13} /> {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <button className="icon-btn" type="button" onClick={() => void refresh()} aria-label="Refresh data"><RefreshCw size={16} /></button>
            <div className="notification-center" ref={notificationContainer}>
              <button className="icon-btn notification-toggle" type="button" onClick={() => setNotificationOpen((current) => !current)} aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`} aria-expanded={notificationOpen}>
                <Bell size={16} />
                {unreadNotifications > 0 && <span className="notification-count">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
              </button>
              {notificationOpen && (
                <div className="notification-popover" role="dialog" aria-label="Notifications">
                  <div className="notification-head"><div><b>Notifications</b><small>{unreadNotifications ? `${unreadNotifications} unread` : 'You are all caught up'}</small></div><button className="icon-btn small" type="button" onClick={() => setNotificationOpen(false)} aria-label="Close notifications"><X size={15} /></button></div>
                  {notifications.length ? notifications.map((notification) => (
                    <button className={`notification-item ${notification.read ? '' : 'unread'}`} key={notification.id} type="button" onClick={() => void markNotificationRead(notification)}>
                      <span className={`notification-dot ${notification.category}`} />
                      <span><b>{notification.title}</b><small>{notification.message}</small><em>{new Date(notification.created_at).toLocaleString()}</em></span>
                    </button>
                  )) : <div className="notification-empty"><Bell size={18} /><p>No notifications yet. Your important updates will appear here.</p></div>}
                </div>
              )}
            </div>
            <button className="icon-btn" type="button" onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}</button>
            <span className="top-avatar">{(user.name?.[0] || 'U').toUpperCase()}</span>
          </div>
        </header>
        <div className="page-content">
          {pageError && <div className="error page-error" role="alert">{pageError} <button className="text-btn" type="button" onClick={() => void refresh()}>Retry</button></div>}
          {loading && dashboard && <div className="refresh-indicator"><LoaderCircle className="spin" size={14} />Refreshing your data…</div>}
          <div className="page-view" key={page}>
            {page === 'Dashboard' && <DashboardHome dashboard={data} health={health} onNavigate={navigateTo} />}
          {page === 'Transactions' && (
            <>
              <div className="page-intro"><div><span className="eyebrow">RECORD AND REVIEW</span><h2>Transactions</h2><p>Manage your income and expenses in one place.</p></div><div className="top-actions">
                <input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={uploadTransactions} />
                <button className="btn subtle upload-btn" type="button" onClick={() => fileInput.current?.click()}><Upload size={15} />Import CSV</button>
                <button className="btn primary" type="button" onClick={() => setTransactionModal({})}><Plus size={15} />Add transaction</button>
              </div></div>
              <div className="toolbar">
                <label className="searchbox"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search descriptions, notes, categories…" /></label>
                <select aria-label="Filter by transaction type" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All activity</option><option value="income">Income</option><option value="expense">Expenses</option></select>
              </div>
              <p className="csv-hint">CSV columns: <code>date, description, type, amount</code>; category and note are optional.</p>
              <Panel title={`${filteredTransactions.length} transaction${filteredTransactions.length === 1 ? '' : 's'}`} subtitle="Newest activity appears first">
                <TransactionRows rows={filteredTransactions} onEdit={setTransactionModal} onDelete={deleteTransaction} />
              </Panel>
            </>
          )}
          {page === 'Analytics' && <AnalyticsPage dashboard={data} analytics={analytics || { monthly: [], categories: [], savings_rate: 0, monthly_income: 0, monthly_expenses: 0 }} health={health} />}
          {page === 'Financial health' && <FinancialHealthPage health={health || { score: 0, label: 'Building', savings_rate: 0, tips: [] }} onNavigate={navigateTo} />}
          {page === 'Forecast' && forecast && <ForecastPage forecast={forecast} estimating={estimating} onEstimate={estimateForecast} />}
          {page === 'Goals' && <GoalsPage goals={goals} search={goalSearch} onSearchChange={setGoalSearch} onAdd={() => setGoalModal(true)} onProgress={(goal) => setProgressTarget({ item: goal, amount: goal.saved_amount, title: goal.title, label: 'Goal' })} onDelete={(goal) => void removeGoal(goal)} />}
          {page === 'Purchase simulator' && <SimulatorPage dashboard={data} />}
          {page === 'AI assistant' && <AssistantPage user={user} />}
          {page === 'Savings game' && game && <SavingsGamePage game={game} goals={goals} onComplete={completeGameDay} onCreateGoal={() => setGoalModal(true)} />}
          {page === 'Money quiz' && <MoneyQuizPage userId={user.id} />}
          {page === 'Reports & export' && <ReportsPage user={user} />}
            {page === 'Settings' && <SettingsPage user={user} theme={theme} onThemeChange={setTheme} onSignOut={onSignOut} onNotificationCreated={(notification) => setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 20))} />}
          </div>
        </div>
      </main>
      {transactionModal && <TransactionEditor transaction={transactionModal.id ? transactionModal : null} onClose={() => setTransactionModal(null)} onSave={commitTransaction} />}
      {goalModal && <GoalEditor onClose={() => setGoalModal(false)} onSave={createGoal} />}
      {progressTarget && <ProgressEditor target={progressTarget} onClose={() => setProgressTarget(null)} onSave={updateProgress} />}
      {toast && <div className="toast" role="status"><Check size={15} />{toast}</div>}
    </div>
  );
}
