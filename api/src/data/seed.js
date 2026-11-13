import bcrypt from 'bcryptjs';

// Deterministic PRNG so the seed is identical on every restart.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);
const randInt = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const weighted = (table) => {
  let r = rand();
  for (const [value, weight] of table) {
    if ((r -= weight) <= 0) return value;
  }
  return table[table.length - 1][0];
};

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const now = Date.now();

// ---------- users ----------
const passwordHash = bcrypt.hashSync('password123', 10);

export const users = [
  { id: 1, name: 'Admin User', email: 'admin@taskdesk.test', role: 'admin', passwordHash },
  { id: 2, name: 'Asha Patel', email: 'asha@taskdesk.test', role: 'agent', passwordHash },
  { id: 3, name: 'Ben Okafor', email: 'ben@taskdesk.test', role: 'agent', passwordHash },
  { id: 4, name: 'Chloe Martin', email: 'chloe@taskdesk.test', role: 'agent', passwordHash },
  { id: 5, name: 'Dev Sharma', email: 'dev@taskdesk.test', role: 'agent', passwordHash },
];

// ---------- tickets ----------
const TICKET_SEEDS = [
  ['Login fails with "invalid credentials" for valid users', 'Several customers report they cannot log in since this morning even though their passwords are correct. Password reset emails arrive but the new password also fails.'],
  ['Dashboard takes over 20 seconds to load', 'The main dashboard is extremely slow for accounts with more than 1,000 tickets. Network tab shows the /summary call taking 18-25s.'],
  ['CSV export missing the "priority" column', 'Exporting tickets to CSV produces a file without the priority column, although it is visible in the table.'],
  ['Billing: charged twice for October invoice', 'Customer ACME Ltd was charged twice on 3 Oct. They want one charge refunded and an explanation.'],
  ['Password reset link expires immediately', 'The reset link in the email says it is expired even when clicked within a minute of receiving it.'],
  ['Email notifications delayed by several hours', 'Ticket assignment emails are arriving 3-6 hours late. Started after the queue worker deploy on Monday.'],
  ['Cannot upload attachments larger than 2 MB', 'Uploads above 2 MB fail with a generic error. The documented limit is 25 MB.'],
  ['Two-factor code never arrives by SMS', 'Users on the Vodafone network report SMS codes never arrive. Authenticator app works fine.'],
  ['Search returns no results for exact ticket ID', 'Typing a ticket ID like #1042 into the search box returns nothing, but it works for words from the title.'],
  ['Mobile layout breaks on ticket detail page', 'On iPhone the comments panel overlaps the description. Reproducible on Safari and Chrome.'],
  ['API rate limit hit with only 50 requests per minute', 'A customer integration is being throttled well under the documented 500 req/min limit.'],
  ['Wrong timezone shown on ticket timestamps', 'All timestamps show UTC even though the user profile is set to Europe/London.'],
  ['Request: bulk close tickets from list view', 'Agents would like to select multiple tickets and close them in one action.'],
  ['Billing question: how is "active user" counted?', 'Customer asks whether deactivated users count towards the monthly active user bill.'],
  ['Export to PDF produces blank pages', 'The PDF export renders empty pages when a ticket has more than 30 comments.'],
  ['SSO login loops back to the sign-in page', 'Okta SSO users are redirected back to the login screen in a loop after authenticating.'],
  ['Comments lose formatting when saved', 'Line breaks and bullet points in comments are collapsed into a single paragraph after saving.'],
  ['Webhook retries flooding customer endpoint', 'A failing webhook is being retried every second instead of with backoff, causing load on the customer side.'],
  ['Slow ticket list when filtering by assignee', 'Filtering by assignee takes ~8s while other filters respond instantly.'],
  ['Invoice PDF shows wrong company address', 'The billing address on invoices still shows the old office address after the customer updated it.'],
  ['Keyboard shortcuts stop working after navigation', 'Shortcuts like "c" for new ticket stop responding after moving between pages without a reload.'],
  ['Request: dark mode for the agent console', 'Several agents have asked for a dark theme for night shifts.'],
  ['Duplicate tickets created from a single email', 'Inbound emails with multiple recipients create one ticket per recipient instead of one.'],
  ['Account locked after one failed login', 'Policy is five attempts, but accounts are being locked after the first failure.'],
  ['Report totals do not match the ticket list', 'The weekly report says 312 resolved tickets but the list filtered by resolved shows 298.'],
  ['Attachment preview shows a broken image', 'PNG attachments uploaded from the mobile app show a broken thumbnail in the web app.'],
  ['Trial expired but customer never received a reminder', 'Customer says no reminder email was sent before the trial ended and they lost access unexpectedly.'],
  ['Cannot change ticket priority from the detail page', 'The priority dropdown is disabled on the detail page for agents, but works from the list view.'],
  ['Browser freezes when opening a ticket with 200+ comments', 'The tab becomes unresponsive for ~30s when opening very long ticket threads.'],
  ['Request: export comments along with tickets', 'The CSV export only includes ticket fields. Customers want a comment export too.'],
  ['Refund not reflected on the account balance', 'A refund was processed on 12 Oct but the balance page still shows the original charge.'],
  ['Autosave drafts disappear after logout', 'Unsent comment drafts are lost after the session expires instead of being restored on login.'],
  ['Status filter resets when changing page', 'Choosing a status filter and then going to page 2 clears the filter.'],
  ['Push notifications not received on Android', 'Android users on version 3.4.1 are not receiving any push notifications.'],
  ['Login page shows blank screen on Internet Explorer mode', 'A customer using Edge in IE mode sees a white screen on the login page.'],
  ['Audit log missing entries for deletions', 'Deleted tickets do not appear in the audit log, only edits and creations.'],
  ['Billing portal shows prices in the wrong currency', 'A UK customer sees USD prices in the billing portal instead of GBP.'],
  ['Request: assign tickets to a team instead of a person', 'Support managers want to assign tickets to a team queue rather than individual agents.'],
  ['"Mark as resolved" button does nothing', 'Clicking the button shows a spinner but the status never changes. Console shows a 500 from PATCH /tickets.'],
  ['Onboarding email links point to the staging site', 'New customers receive welcome emails whose links go to staging.taskdesk.test.'],
];

const STATUSES = [['open', 0.35], ['in_progress', 0.25], ['resolved', 0.25], ['closed', 0.15]];
const PRIORITIES = [['low', 0.25], ['medium', 0.35], ['high', 0.25], ['urgent', 0.15]];
const AGENT_IDS = [2, 3, 4, 5];

export const tickets = TICKET_SEEDS.map(([title, description], i) => {
  const id = i + 1;
  const createdAt = now - (60 - i * 1.5) * DAY - randInt(0, 12) * HOUR;
  const updatedAt = Math.min(now, createdAt + randInt(0, 72) * HOUR);
  const hasDue = i % 3 !== 0;
  return {
    id,
    title,
    description,
    status: weighted(STATUSES),
    priority: weighted(PRIORITIES),
    assigneeId: i % 5 === 0 ? null : pick(AGENT_IDS),
    reporterId: pick(users).id,
    dueDate: hasDue ? new Date(createdAt + randInt(2, 20) * DAY).toISOString() : null,
    createdAt: new Date(createdAt).toISOString(),
    updatedAt: new Date(updatedAt).toISOString(),
  };
});

// Guarantee a hit for the spec's acceptance query: status=open&priority=high&q=login
Object.assign(tickets[0], { status: 'open', priority: 'high' });
Object.assign(tickets[15], { status: 'open', priority: 'high' });

// ---------- comments ----------
const COMMENT_TEXTS = [
  'Thanks for reporting this. I can reproduce it on my side, looking into it now.',
  'Could you share the browser version and a screenshot of the error?',
  'This looks related to the deploy from Monday. Escalating to the platform team.',
  'Customer confirmed the workaround is acceptable for now.',
  'Fix is merged and will go out with the next release.',
  'Still waiting on a reply from the customer, pinging again tomorrow.',
  'Root cause found: a missing index on the tickets table. Migration in progress.',
  'Verified on staging, everything looks good.',
  'Customer says the issue is back after clearing their cache.',
  'Adding this to the Q4 roadmap discussion.',
  'Refund has been issued, should appear within 5 business days.',
  'Closing this as resolved. Please reopen if it happens again.',
];

export const comments = [];
let nextCommentId = 1;

for (const ticket of tickets) {
  if (ticket.id % 2 !== 0) continue;
  const count = randInt(2, 5);
  const base = Date.parse(ticket.createdAt);
  for (let k = 0; k < count; k++) {
    const author = pick(users);
    comments.push({
      id: nextCommentId++,
      ticketId: ticket.id,
      authorId: author.id,
      authorName: author.name,
      text: pick(COMMENT_TEXTS),
      createdAt: new Date(Math.min(now, base + (k + 1) * randInt(1, 30) * HOUR)).toISOString(),
    });
  }
}

// ---------- helpers ----------
let nextTicketId = tickets.length + 1;

export const newTicketId = () => nextTicketId++;
export const newCommentId = () => nextCommentId++;
export const findUser = (id) => users.find((u) => u.id === id);
export const findTicket = (id) => tickets.find((t) => t.id === id);
export const publicUser = ({ id, name, email, role }) => ({ id, name, email, role });
