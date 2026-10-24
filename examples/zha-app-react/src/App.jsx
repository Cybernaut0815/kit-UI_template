// Ring 2 app-page recipe: React + Vite + the zha-ui CSS, with no router and no component library.
// Every className comes from @gitzhacode/zha-ui-css/classes.txt. The only inline style is the
// --grid-min knob on the stat grid; the columns menu gets its top/left from JS when it opens.
// One small named component per job, so the file shows where the boundaries fall.
import { useEffect, useRef, useState } from 'react';

// Stroke icons on a 24 grid in currentColor (never emoji, never glyph fonts), drawn at 16 px:
// icons-stroke-only allows 16, 20 or 24, and 20 would make the sidebar rows taller.
const ICONS = {
  menu: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></>,
  contrast: <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" /></>,
  grid: <><rect x="2.5" y="2.5" width="8" height="8" rx="2" /><rect x="13.5" y="2.5" width="8" height="8" rx="2" /><rect x="2.5" y="13.5" width="8" height="8" rx="2" /><rect x="13.5" y="13.5" width="8" height="8" rx="2" /></>,
  home: <><path d="M4 18.5V9.5L12 4l8 5.5v9H4Z" /><rect x="9.5" y="12" width="5" height="6.5" rx="1.25" /></>,
  chart: <><path d="M4 18.5 9.5 12l4 4L20 6.5" /><path d="M4 4v16h16" /></>,
  document: <><path d="M6.5 2.5h8L20 8v13.5H6.5V2.5Z" /><path d="M14.5 2.5V8H20M10 13.5h5.5M10 17.5h5.5" /></>,
  sensor: <><circle cx="12" cy="12" r="2.5" /><path d="M5.5 5.5a9.5 9.5 0 0 0 0 13M18.5 5.5a9.5 9.5 0 0 1 0 13" /></>,
  settings: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2" /></>,
  'chevron-left': <path d="M15 4.5 7.5 12l7.5 7.5" />,
  'chevron-right': <path d="m9 4.5 7.5 7.5L9 19.5" />,
  check: <><circle cx="12" cy="12" r="9.5" /><path d="M7.5 12l3 3 6-6" /></>,
  close: <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />,
  more: <g fill="currentColor" stroke="none"><circle cx="5.5" cy="12" r="1.75" /><circle cx="12" cy="12" r="1.75" /><circle cx="18.5" cy="12" r="1.75" /></g>,
};

function Icon({ name, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

// The canonical bar: lockup as the home link, the app name in the primary face, then actions. The nav
// toggle carries .app-bar__nav-toggle, so the bundle shows it only where the drawer exists (768 px and below).
function AppBar({ navOpen, onToggleNav, onToggleTheme, onNewModel }) {
  return (
    <header className="app-bar">
      <span className="app-bar__brand">
        <a className="zha-lockup" href="/" aria-label="ZHA, home"><span className="zha-lockup__zha">ZHA</span></a>
        <span className="app-bar__app">Starter</span>
      </span>
      <span className="app-bar__spacer" />
      <button className="icon-btn icon-btn--ghost app-bar__nav-toggle" type="button" aria-label="Toggle navigation" aria-controls="nav" aria-expanded={navOpen} onClick={onToggleNav}>
        <Icon name="menu" />
      </button>
      <button className="icon-btn icon-btn--ghost" type="button" aria-label="Search">
        <Icon name="search" />
      </button>
      <button className="icon-btn icon-btn--ghost" type="button" aria-label="Toggle light or dark theme" onClick={onToggleTheme}>
        <Icon name="contrast" />
      </button>
      <button className="btn btn--primary" type="button" onClick={onNewModel}>New model</button>
    </header>
  );
}

const NAV = [['Overview', 'grid'], ['Projects', 'home'], ['Models', 'chart'], ['Reports', 'document'], ['Sensors', 'sensor'], ['Settings', 'settings']];

function Sidebar() {
  return (
    <nav className="sidebar" id="nav" aria-label="Main">
      {NAV.map(([label, icon], i) => (
        <a key={label} href="#" aria-current={i === 0 ? 'page' : undefined}><Icon name={icon} /><span>{label}</span></a>
      ))}
    </nav>
  );
}

function Stat({ label, value, delta, direction }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      <span className={direction ? `stat__delta stat__delta--${direction}` : 'stat__delta'}>{delta}</span>
    </div>
  );
}

const ROWS = [
  { project: "Bee'ah Headquarters", climate: 'Hot desert', energy: '118', carbon: '24.6', status: 'Complete', tone: 'success', updated: 'Today' },
  { project: 'NEOM Bay Terminal A', climate: 'Hot desert', energy: '164', carbon: '31.2', status: 'Running', tone: 'info', updated: 'Today' },
  { project: 'Dubai Climate Pavilion', climate: 'Hot desert', energy: '97', carbon: '19.8', status: 'In review', tone: 'warning', updated: 'Yesterday' },
  { project: 'Infinitus Plaza', climate: 'Humid subtropical', energy: '151', carbon: '28.4', status: 'Complete', tone: 'success', updated: '2 days ago' },
  { project: 'Leeza SOHO', climate: 'Humid continental', energy: '173', carbon: '35.1', status: 'Queued', tone: 'neutral', updated: '2 days ago' },
  { project: 'Eleftheria Square', climate: 'Mediterranean', energy: '88', carbon: '17.3', status: 'Complete', tone: 'success', updated: '3 days ago' },
  { project: 'One Thousand Museum', climate: 'Tropical monsoon', energy: '139', carbon: '26.9', status: 'Failed', tone: 'error', updated: '4 days ago' },
  { project: 'Grand Theatre Rabat', climate: 'Mediterranean', energy: '104', carbon: '21.0', status: 'Complete', tone: 'success', updated: 'Last week' },
];

// aria-sort drives the header chevron and aria-selected the row tint. Ordering the data by
// `sort` is the app's job; like the preview, this recipe shows the contract only.
function ModelsTable({ rows, selected, onSelect, sort, onSort }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption>Recent models, 8 of 24</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={sort}><button type="button" onClick={onSort}>Project</button></th>
            <th scope="col">Climate</th>
            <th scope="col" className="num">Energy <span className="th-unit">kWh/m²</span></th>
            <th scope="col" className="num">Carbon <span className="th-unit">kgCO₂e/m²</span></th>
            <th scope="col">Status</th>
            <th scope="col">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.project}
              tabIndex={0}
              aria-selected={selected.has(row.project)}
              onClick={() => onSelect(row.project)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(row.project); } }}
            >
              <td>{row.project}</td>
              <td>{row.climate}</td>
              <td className="num">{row.energy}</td>
              <td className="num">{row.carbon}</td>
              <td><span className={`badge badge--${row.tone}`}><span className="dot" />{row.status}</span></td>
              <td>{row.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination() {
  return (
    <nav aria-label="Pagination">
      <ol className="pagination">
        <li><button type="button" disabled aria-label="Previous page"><Icon name="chevron-left" /></button></li>
        <li><button type="button" aria-current="page">1</button></li>
        <li><button type="button">2</button></li>
        <li><button type="button">3</button></li>
        <li><button type="button" aria-label="Next page"><Icon name="chevron-right" /></button></li>
      </ol>
    </nav>
  );
}

// Each view mounts when its tab is chosen, so .view-fade is the page's one entrance sequence.
function OverviewView(props) {
  return (
    <section className="stack view-fade">
      <h2 className="sr-only">Overview</h2>

      <div className="toolbar">
        <div className="segmented">
          <label><input type="radio" name="range" value="24h" /> 24h</label>
          <label><input type="radio" name="range" value="7d" defaultChecked /> 7d</label>
          <label><input type="radio" name="range" value="30d" /> 30d</label>
        </div>
        <hr className="divider divider--vertical" />
        <button className="chip" type="button" aria-pressed="true">All</button>
        <button className="chip" type="button" aria-pressed="false">Running</button>
        <button className="chip" type="button" aria-pressed="false">Complete</button>
        <span className="divider divider--vertical" role="separator" aria-orientation="vertical" />
        <div className="field">
          <label className="sr-only" htmlFor="q">Search projects</label>
          <input className="input" id="q" type="search" placeholder="Search projects" />
        </div>
        <button className="btn btn--ghost" type="button">Reset</button>
      </div>

      <div className="grid" style={{ '--grid-min': '11rem' }}>
        <Stat label="Models run" value="38" delta="+6 this week" direction="up" />
        <Stat label="Mean energy intensity" value="142" delta="kWh/m² across 8 projects" />
        <Stat label="Sensor uptime" value="96.4%" delta="-1.2 pts vs last week" direction="down" />
        <Stat label="Carbon saved" value="1,240 t" delta="+8% this quarter" direction="up" />
      </div>

      <ModelsTable {...props} />
      <Pagination />
    </section>
  );
}

function ProjectsView({ loaded, onNewModel }) {
  return (
    <section className="stack view-fade">
      <h2 className="sr-only">Projects</h2>
      {loaded ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            {/* Drawn for its 48 px tile (inset, hairline stroke), so an illustration rather than an Icon. */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 32V18l12-8 12 8v14H12Z" /><rect x="20" y="24" width="8" height="8" rx="1.5" />
            </svg>
          </div>
          <h3>No projects yet</h3>
          <p>Projects appear here once a model has run.</p>
          <button className="btn btn--secondary" type="button" onClick={onNewModel}>New model</button>
        </div>
      ) : (
        <div className="grid">
          {[1, 2, 3].map((n) => <div key={n} className="skeleton" aria-hidden="true">&nbsp;<br />&nbsp;<br />&nbsp;</div>)}
        </div>
      )}
    </section>
  );
}

// Native modal: method="dialog" closes it with the pressed button's value; only "save" toasts.
function NewModelDialog({ dialogRef, onSaved }) {
  return (
    <dialog className="dialog dialog--md" ref={dialogRef} aria-labelledby="new-model-title" onClose={(e) => { if (e.currentTarget.returnValue === 'save') onSaved(); }}>
      <div className="dialog__header">
        <h2 className="dialog__title" id="new-model-title">New energy model</h2>
        <button className="icon-btn icon-btn--ghost dialog__close" type="button" aria-label="Close" onClick={() => dialogRef.current.close('cancel')}>
          <Icon name="close" />
        </button>
      </div>
      <form method="dialog" className="dialog__body stack" id="new-model-form">
        <div className="form-grid">
          <div className="field">
            <label className="field__label" htmlFor="f-project">Project</label>
            <input className="input" id="f-project" type="text" defaultValue="Bee'ah Headquarters" required />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="f-climate">Climate</label>
            <select className="select" id="f-climate">
              <option>Sharjah, hot desert</option>
              <option>Dubai, hot desert</option>
              <option>London, oceanic</option>
              <option>Guangzhou, humid subtropical</option>
              <option>Beijing, humid continental</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="f-area">Floor area</label>
            <input className="input" id="f-area" type="number" inputMode="decimal" min="0" step="10" defaultValue="19400" />
            <span className="field__help">Gross internal area in m²</span>
          </div>
          <div className="field field--span">
            <label className="field__label" htmlFor="f-notes">Notes</label>
            <textarea className="input" id="f-notes" rows={3} placeholder="Occupancy schedule, envelope assumptions, anything the reviewer should know" />
          </div>
        </div>
      </form>
      <div className="dialog__footer">
        <button className="btn btn--ghost" type="submit" form="new-model-form" value="cancel" formNoValidate>Cancel</button>
        <button className="btn btn--primary" type="submit" form="new-model-form" value="save">Save model</button>
      </div>
    </dialog>
  );
}

// The toast repeats the action's verb ("Model saved"). It mounts and unmounts with the state, which is the
// bundle's contract: consumer JS inserts and removes the toast, so the status region arrives with its content.
function Toast() {
  return (
    <div className="toast">
      <div className="alert alert--success" role="status">
        <span className="alert__icon"><Icon name="check" /></span>
        <div><span className="alert__title">Model saved</span>Bee'ah Headquarters is queued to run.</div>
      </div>
    </div>
  );
}

// Native popover: popovertarget opens it and light dismiss closes it. JS owns only placement
// (top/left) and the trigger's aria-expanded. React 18 wires onToggle for <details> alone,
// hence the listener.
function ColumnsMenu({ menuRef, triggerRef }) {
  useEffect(() => {
    const menu = menuRef.current;
    const onToggle = (e) => {
      const trigger = triggerRef.current;
      const open = e.newState === 'open';
      trigger.setAttribute('aria-expanded', String(open));
      if (!open) return;
      const r = trigger.getBoundingClientRect();
      menu.style.top = `${r.bottom + 4}px`;
      menu.style.left = `${Math.max(8, r.right - menu.offsetWidth)}px`;
    };
    menu.addEventListener('toggle', onToggle);
    return () => menu.removeEventListener('toggle', onToggle);
  }, [menuRef, triggerRef]);

  return (
    <div className="menu" id="more-menu" popover="auto" ref={menuRef}>
      <div className="menu__section">Columns</div>
      <div className="menu__list" role="group" aria-label="Columns">
        <label className="menu__item"><input className="menu__check" type="checkbox" defaultChecked /><span>Climate</span></label>
        <label className="menu__item"><input className="menu__check" type="checkbox" defaultChecked /><span>Carbon</span></label>
        <label className="menu__item"><input className="menu__check" type="checkbox" /><span>Updated</span></label>
      </div>
      <div className="menu__separator" />
      <div className="menu__footer"><button className="btn btn--ghost" type="button">Reset columns</button></div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState('light');
  const [navOpen, setNavOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const [selected, setSelected] = useState(() => new Set(['NEOM Bay Terminal A']));
  const [sort, setSort] = useState('ascending');
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [toast, setToast] = useState(false);
  const dialogRef = useRef(null);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const toastTimer = useRef(0);

  // data-theme on <html>, not an inner div: :root owns color-scheme, so native chrome
  // (scrollbars, form-control wells, select popups) follows the theme only when the root does.
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  // Projects shows its skeletons, then the empty state 900 ms after the tab first appears.
  useEffect(() => {
    if (tab !== 'projects' || projectsLoaded) return undefined;
    const timer = setTimeout(() => setProjectsLoaded(true), 900);
    return () => clearTimeout(timer);
  }, [tab, projectsLoaded]);

  useEffect(() => () => clearTimeout(toastTimer.current), []); // clear the toast timer on unmount

  const openDialog = () => { dialogRef.current.returnValue = ''; dialogRef.current.showModal(); };
  const showToast = () => {
    clearTimeout(toastTimer.current);
    setToast(true);
    toastTimer.current = setTimeout(() => setToast(false), 3000);
  };
  const toggleRow = (project) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(project)) next.delete(project); else next.add(project);
    return next;
  });

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      {/* data-nav-open is the shell's contract; it only paints at 768 px and below, where the bar's .app-bar__nav-toggle is visible. */}
      <div className="app-shell" {...(navOpen ? { 'data-nav-open': '' } : {})}>
        <AppBar
          navOpen={navOpen}
          onToggleNav={() => setNavOpen((open) => !open)}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onNewModel={openDialog}
        />
        <Sidebar />
        <main className="app-main stack" id="main">
          <div className="page-header">
            <h1 className="page-header__title">Overview</h1>
            <div className="page-header__actions">
              <button className="btn btn--secondary" type="button">Export</button>
              {/* aria-expanded stays a constant prop: ColumnsMenu updates it on the element. */}
              <button className="icon-btn icon-btn--ghost" ref={triggerRef} type="button" aria-label="More actions" aria-haspopup="true" aria-expanded="false" popovertarget="more-menu">
                <Icon name="more" />
              </button>
            </div>
          </div>

          <div className="tabs" role="presentation">
            <button className="tabs__tab" type="button" aria-current={tab === 'overview' ? 'page' : undefined} onClick={() => setTab('overview')}>Overview</button>
            <button className="tabs__tab" type="button" aria-current={tab === 'projects' ? 'page' : undefined} onClick={() => setTab('projects')}>Projects</button>
          </div>

          {tab === 'overview' ? (
            <OverviewView
              rows={ROWS}
              selected={selected}
              onSelect={toggleRow}
              sort={sort}
              onSort={() => setSort((s) => (s === 'ascending' ? 'descending' : 'ascending'))}
            />
          ) : (
            <ProjectsView loaded={projectsLoaded} onNewModel={openDialog} />
          )}
        </main>
      </div>

      <NewModelDialog dialogRef={dialogRef} onSaved={showToast} />
      {toast && <Toast />}
      <ColumnsMenu menuRef={menuRef} triggerRef={triggerRef} />
    </>
  );
}
